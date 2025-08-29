import React, { useState, useCallback } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  useDataChannel,
} from '@livekit/components-react';
// import '@livekit/components-styles'; // BUG: This line breaks the app and was removed. CSS is now linked in index.html
// FIX: Removed DataPacket_Kind as it's not used in the new API for sending data.
import { Track, type VideoTrack } from 'livekit-client';
import AgentPanel from './AgentPanel';
import { type ChatMessage, CodeContextFile, DataPacket, PacketType } from '../types';
import { askVibeAgentWithScreens, isGeminiAvailable } from '../services/geminiService';

const VIBE_CHANNEL = 'vibe_agent_state';

interface VibeRoomProps {
  serverUrl: string;
  token: string;
  roomName: string;
  identity: string;
  onLeave: () => void;
}

const VibeRoom: React.FC<VibeRoomProps> = ({ serverUrl, token, onLeave }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [codeContext, setCodeContext] = useState<CodeContextFile[]>([]);
  
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  // FIX: The type `ReceivedDataMessage` is not exported from '@livekit/components-react'.
  // The handler has been updated to use an inline type for the message payload to resolve the import error.
  const handleData = useCallback((msg: { payload: Uint8Array }) => {
    const jsonString = textDecoder.decode(msg.payload);
    const packet = JSON.parse(jsonString) as DataPacket;

    switch (packet.type) {
      case 'CHAT_MESSAGE_ADD':
        setMessages(prev => [...prev, packet.payload]);
        break;
      case 'CHAT_MESSAGE_UPDATE':
        setMessages(prev => prev.map(m => m.id === packet.payload.id ? { ...m, content: packet.payload.content } : m));
        break;
      case 'CONTEXT_ADD':
        // Avoid duplicates if packets arrive out of order
        if (!codeContext.some(f => f.id === packet.payload.id)) {
            setCodeContext(prev => [...prev, packet.payload]);
        }
        break;
      case 'CONTEXT_REMOVE':
        setCodeContext(prev => prev.filter(f => f.id !== packet.payload.id));
        break;
    }
  }, [textDecoder, codeContext]); // Added codeContext dependency

  const { send } = useDataChannel(VIBE_CHANNEL, handleData);

  const broadcast = useCallback((packet: DataPacket) => {
    if (send) {
      const msg = textEncoder.encode(JSON.stringify(packet));
      // FIX: Changed the send options from the deprecated `kind` property to the current `{ reliable: true }` API.
      send(msg, { reliable: true });
    }
  }, [send, textEncoder]);

  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  ).map(ref => ref.publication.track as VideoTrack);
  
  // The agent is ready if at least one person is sharing their screen.
  const isAgentReady = screenShareTracks.length >= 1;

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  const handleAddCodeContext = useCallback((file: CodeContextFile) => {
     if (!codeContext.some(f => f.url === file.url)) {
      setCodeContext(prev => [...prev, file]);
      broadcast({ type: 'CONTEXT_ADD', payload: file });
    }
  }, [codeContext, broadcast]);

  const handleRemoveCodeContext = useCallback((id: string) => {
    setCodeContext(prev => prev.filter(f => f.id !== id));
    broadcast({ type: 'CONTEXT_REMOVE', payload: { id } });
  }, [broadcast]);

  const handleAskAgent = async (prompt: string) => {
    if (!isAgentReady) {
      alert("At least one user must be sharing their screen to use the Vibe Agent.");
      return;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), author: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    broadcast({ type: 'CHAT_MESSAGE_ADD', payload: userMessage });
    setIsThinking(true);

    const [trackA, trackB] = screenShareTracks; // trackB will be undefined if in solo mode

    const agentMessageId = crypto.randomUUID();
    let fullAgentResponse = '';

    const onChunk = (chunk: string) => {
      fullAgentResponse += chunk;
      const updatePayload = { id: agentMessageId, content: fullAgentResponse };

      setMessages(prev => {
        const existing = prev.find(m => m.id === agentMessageId);
        if (existing) {
          return prev.map(m => m.id === agentMessageId ? { ...m, content: fullAgentResponse } : m);
        } else {
          return [...prev, { id: agentMessageId, author: 'agent', content: chunk }];
        }
      });
      broadcast({ type: 'CHAT_MESSAGE_UPDATE', payload: updatePayload });
    };

    const onDone = () => setIsThinking(false);
    
    const onError = (error: Error) => {
      const errorMessage = { id: crypto.randomUUID(), author: 'agent', content: `Error: ${error.message}` } as ChatMessage;
      setMessages(prev => [...prev, errorMessage]);
      broadcast({ type: 'CHAT_MESSAGE_ADD', payload: errorMessage });
      setIsThinking(false);
    };

    await askVibeAgentWithScreens(prompt, trackA, trackB || null, messages, codeContext, onChunk, onDone, onError);
  };

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={onLeave}
    >
      <div className="flex h-full w-full bg-gray-900 p-4 gap-4">
        <div className="flex-grow h-full flex flex-col">
          <GridLayout tracks={tracks} className="lk-grid-layout">
            <ParticipantTile />
          </GridLayout>
          <div className="mt-4">
            <ControlBar />
          </div>
        </div>

        <div className="w-1/3 max-w-lg h-full flex-shrink-0">
          <AgentPanel
            messages={messages}
            onAskAgent={handleAskAgent}
            isReady={isAgentReady}
            isThinking={isThinking}
            codeContext={codeContext}
            onAddCodeContext={handleAddCodeContext}
            onRemoveCodeContext={handleRemoveCodeContext}
            isGeminiConfigured={isGeminiAvailable}
            screenSharers={screenShareTracks.length}
          />
        </div>
      </div>
    </LiveKitRoom>
  );
};

export default VibeRoom;
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CodeContextFile } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicrophoneIcon } from './icons';
import { CodeContext } from './CodeContext';

interface AgentPanelProps {
  messages: ChatMessage[];
  onAskAgent: (prompt: string) => void;
  isReady: boolean;
  isThinking: boolean;
  codeContext: CodeContextFile[];
  onAddCodeContext: (file: CodeContextFile) => void;
  onRemoveCodeContext: (url: string) => void;
  isGeminiConfigured: boolean;
  screenSharers: number;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ 
  messages, onAskAgent, isReady, isThinking, 
  codeContext, onAddCodeContext, onRemoveCodeContext,
  isGeminiConfigured, screenSharers
}) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && isReady && !isThinking) {
      onAskAgent(prompt.trim());
      setPrompt('');
      if (isListening) {
        stopListening();
      }
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }
  
  const getAgentStatusText = () => {
      if(isReady) return "Vibe Agent is Ready";
      if(screenSharers === 0) return "Please share your screen to begin";
      if(screenSharers === 1) return "Ready for Solo Mode. Invite another to pair!";
      return "Waiting for both participants to share their screen..."
  }
  
  const getInputPlaceholder = () => {
      if(!isReady) return screenSharers > 0 ? "Agent is ready for your prompt..." : "Waiting for screen share...";
      if(isThinking) return "Agent is thinking...";
      return "Ask the agent or use the mic...";
  }


  if (!isGeminiConfigured) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex flex-col shadow-2xl items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-yellow-400">Agent Offline</h2>
        <p className="text-sm text-gray-400 mt-2">
          The Vibe Agent requires a Gemini API key to function. The host has not configured this, so the agent is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg flex flex-col shadow-2xl">
      <header className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-center">Vibe Agent</h2>
        {!isReady && (
            <p className="text-xs text-center text-yellow-400 mt-1">
                {getAgentStatusText()}
            </p>
        )}
      </header>

      <CodeContext 
        files={codeContext}
        onAddFile={onAddCodeContext}
        onRemoveFile={onRemoveCodeContext}
      />

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md p-3 rounded-lg ${
                  msg.author === 'user' ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
              </div>
            </div>
          ))}
           {isThinking && messages[messages.length - 1]?.author !== 'agent' && (
             <div className="flex justify-start">
               <div className="max-w-md p-3 rounded-lg bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
               </div>
             </div>
           )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getInputPlaceholder()}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={!isReady || isThinking}
            />
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2 rounded-md ${isListening ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              disabled={!isReady || isThinking}
              title={isListening ? "Stop listening" : "Start listening"}
            >
              <MicrophoneIcon className="w-5 h-5 text-white" />
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isReady || isThinking}
              title={isReady ? "Ask the AI agent for help" : "At least one user must be sharing their screen to use the agent."}
            >
              Ask
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default AgentPanel;
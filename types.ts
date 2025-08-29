export interface ChatMessage {
  id: string;
  author: 'user' | 'agent';
  content: string;
}

export interface CodeContextFile {
  id: string;
  fileName: string;
  url: string;
  content: string;
}

// Types for real-time state synchronization via LiveKit Data Channels
export type PacketType = 
  | 'CHAT_MESSAGE_ADD' 
  | 'CHAT_MESSAGE_UPDATE'
  | 'CONTEXT_ADD' 
  | 'CONTEXT_REMOVE';

export interface DataPacket {
  type: PacketType;
  payload: any;
}

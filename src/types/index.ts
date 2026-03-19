export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface ChatRequest {
  messages: Message[];
  stream?: boolean;
}

export interface StreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp?: number;
  version?: string;
}

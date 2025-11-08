
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export interface SavedSession {
  id: string;
  name: string;
  timestamp: number;
  chatHistory: ChatMessage[];
  image: string | null;
}

export interface Profile {
  id: string;
  name: string;
  systemInstruction: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export type AppView = 'chat' | 'experiment';

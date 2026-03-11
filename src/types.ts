export interface Profile {
  id: string;
  name: string;
  systemInstruction: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export type AppView = 'home' | 'chat' | 'experiment';

export interface RatingCriteria {
  clarity: number;


  enjoyment: number;
  vibes: number;
}

export interface ExperimentRoundResult {
  round: number;
  ratings: Record<string, RatingCriteria>; // profileId -> ratings
  prompts: Record<string, string>; // profileId -> prompt used
  responses: Record<string, string>; // profileId -> response text
}

export interface ExperimentRecord {
  id: string;
  date: string;
  topic: string;
  modelId: string;
  rounds: ExperimentRoundResult[];
  totalScores: Record<string, RatingCriteria>; // Accumulated scores per profile
}

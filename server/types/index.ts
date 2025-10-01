// Core data types
export interface Question {
  id: string;
  prompt: string;
  unit?: string;
  trueValue: number;
  source?: string;
  sourceUrl?: string;
}

export interface Answer {
  questionId: string;
  lower: number;
  upper: number;
  submittedAt: Date;
}

export interface Session {
  sessionId: string;
  questionIds: string[];
  answers: Answer[];
}

export interface Judgement {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  source?: string;
  sourceUrl?: string;
  communityStats?: {
    averageScore: number;
    highestScore: number;
  };
}

// API request/response types
export interface StartSessionResponse {
  sessionId: string;
  questions: Omit<Question, 'trueValue'>[];
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  lower: number;
  upper: number;
}

export interface FinalizeSessionRequest {
  sessionId: string;
}

export interface FinalizeSessionResponse {
  judgements: Judgement[];
  score: number;
  totalQuestions: number;
}



// Core data types

// User types
export interface User {
  id: string;
  deviceId: string | null;
  authId: string | null;
  email: string | null;
  displayName: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastPlayedAt: Date | null;
  timezone: string;
  totalScore: number;
  averageScore: number;
  weeklyScore: number;
  gamesPlayed: number;
  questionsCaptured: number;
  calibrationRate: number;
  currentStreak: number;
  bestStreak: number;
  bestSingleScore: number;
}

export interface AuthUser {
  userId: string;
  authId: string | null;
  isAnonymous: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

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



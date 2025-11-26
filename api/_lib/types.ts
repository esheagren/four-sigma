// Core data types for API

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

export interface CrowdGuess {
  min: number;
  max: number;
}

export interface CrowdData {
  guesses: CrowdGuess[];
  avgMin: number;
  avgMax: number;
  avgHit: boolean;
  hitRate: number;
  totalResponses: number;
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
  crowdData?: CrowdData;
}

export interface DailyStats {
  dailyRank: number | null;
  topScoreToday: number | null;
  todaysAverage: number | null;
  userScoreToday: number | null;
  calibrationToday: number | null;
  totalParticipantsToday: number;
}

export interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

export interface Feedback {
  id: string;
  userId: string | null;
  feedbackText: string;
  createdAt: Date;
  userAgent: string | null;
  pageUrl: string | null;
}

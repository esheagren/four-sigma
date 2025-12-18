import { Session, Answer } from '../types/index.js';

// In-memory session storage - in v2 this will be replaced with Supabase
const sessions = new Map<string, Session>();

// Question statistics storage - tracks all scores for each question
interface QuestionStats {
  questionId: string;
  scores: number[];
}

const questionStats = new Map<string, QuestionStats>();

// Leaderboard storage - tracks top scores across all sessions
interface LeaderboardEntry {
  sessionId: string;
  score: number;
  timestamp: Date;
}

const leaderboard: LeaderboardEntry[] = [];

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new session
 * @param sessionId - Unique session identifier
 * @param questionIds - Array of question IDs for this session
 * @param userId - User ID who started the session (null if not authenticated)
 */
export function createSession(sessionId: string, questionIds: string[], userId: string | null = null): Session {
  const session: Session = {
    sessionId,
    questionIds,
    answers: [],
    userId,
    startedAt: new Date(),
  };

  sessions.set(sessionId, session);

  if (userId) {
    console.log(`Session ${sessionId} created for user ${userId}`);
  } else {
    console.log(`Session ${sessionId} created without user context`);
  }

  return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

/**
 * Add an answer to a session
 */
export function addAnswer(sessionId: string, answer: Answer): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }
  
  session.answers.push(answer);
  return true;
}

/**
 * Check if a question belongs to a session
 */
export function isQuestionInSession(sessionId: string, questionId: string): boolean {
  const session = sessions.get(sessionId);
  return session ? session.questionIds.includes(questionId) : false;
}

/**
 * Get all sessions (for debugging purposes)
 */
export function getAllSessions(): Map<string, Session> {
  return sessions;
}

/**
 * Clear all sessions (for testing purposes)
 */
export function clearAllSessions(): void {
  sessions.clear();
}

/**
 * Record a score for a question
 */
export function recordQuestionScore(questionId: string, score: number): void {
  let stats = questionStats.get(questionId);
  
  if (!stats) {
    stats = {
      questionId,
      scores: [],
    };
    questionStats.set(questionId, stats);
  }
  
  stats.scores.push(score);
}

/**
 * Get statistics for a question
 */
export function getQuestionStats(questionId: string): { averageScore: number; highestScore: number } | null {
  const stats = questionStats.get(questionId);
  
  if (!stats || stats.scores.length === 0) {
    return null;
  }
  
  const averageScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
  const highestScore = Math.max(...stats.scores);
  
  return {
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore: Math.round(highestScore * 100) / 100,
  };
}

/**
 * Add a score to the leaderboard
 */
export function addToLeaderboard(sessionId: string, score: number): void {
  leaderboard.push({
    sessionId,
    score,
    timestamp: new Date(),
  });
  
  // Keep leaderboard sorted by score (descending)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Keep only top 100 entries to prevent memory issues
  if (leaderboard.length > 100) {
    leaderboard.splice(100);
  }
}

/**
 * Get top leaderboard entries
 */
export function getLeaderboard(limit: number = 10): LeaderboardEntry[] {
  return leaderboard.slice(0, limit);
}



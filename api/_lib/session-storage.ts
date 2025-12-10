import { supabase } from './supabase.js';
import { Answer } from './types.js';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new session in Supabase
 */
export async function createSession(sessionId: string, questionIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('game_sessions')
    .insert({
      id: sessionId,
      question_ids: questionIds,
      answers: [],
      created_at: new Date().toISOString(),
    });

  if (error) {
    // If table doesn't exist, we'll handle sessions in-memory via request body
    console.error('Session creation error (table may not exist):', error);
  }
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<{
  sessionId: string;
  questionIds: string[];
  answers: Answer[];
} | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    sessionId: data.id,
    questionIds: data.question_ids,
    answers: (data.answers || []).map((a: any) => ({
      questionId: a.questionId,
      lower: a.lower,
      upper: a.upper,
      submittedAt: new Date(a.submittedAt),
    })),
  };
}

/**
 * Add an answer to a session using Postgres array append (single DB call)
 */
export async function addAnswer(sessionId: string, answer: Answer): Promise<boolean> {
  const newAnswer = {
    questionId: answer.questionId,
    lower: answer.lower,
    upper: answer.upper,
    submittedAt: answer.submittedAt.toISOString(),
  };

  // Use raw SQL to append to JSONB array in a single operation
  const { error } = await supabase.rpc('append_session_answer', {
    p_session_id: sessionId,
    p_answer: newAnswer,
  });

  if (error) {
    // Fallback to read-modify-write if RPC doesn't exist
    console.warn('RPC not available, using fallback:', error.message);
    return addAnswerFallback(sessionId, answer);
  }

  return true;
}

/**
 * Fallback for adding answer (used if RPC not available)
 */
async function addAnswerFallback(sessionId: string, answer: Answer): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) {
    return false;
  }

  const updatedAnswers = [...session.answers, {
    questionId: answer.questionId,
    lower: answer.lower,
    upper: answer.upper,
    submittedAt: answer.submittedAt.toISOString(),
  }];

  const { error } = await supabase
    .from('game_sessions')
    .update({ answers: updatedAnswers })
    .eq('id', sessionId);

  return !error;
}

/**
 * Check if a question belongs to a session
 */
export async function isQuestionInSession(sessionId: string, questionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  return session ? session.questionIds.includes(questionId) : false;
}

// In-memory fallback for question stats (resets on each function invocation but works for demo)
const questionStatsCache = new Map<string, { scores: number[] }>();

/**
 * Record a score for a question (in-memory cache - will reset between invocations)
 */
export function recordQuestionScore(questionId: string, score: number): void {
  const stats = questionStatsCache.get(questionId) || { scores: [] };
  stats.scores.push(score);
  questionStatsCache.set(questionId, stats);
}

/**
 * Get statistics for a question
 */
export function getQuestionStats(questionId: string): { averageScore: number; highestScore: number } | null {
  const stats = questionStatsCache.get(questionId);

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

import { supabase } from './supabase.js';
import { Feedback } from '../types/index.js';

// Helper to convert database row to Feedback type
function rowToFeedback(row: any): Feedback {
  return {
    id: row.id,
    userId: row.user_id,
    feedbackText: row.feedback_text,
    createdAt: new Date(row.created_at),
    userAgent: row.user_agent,
    pageUrl: row.page_url,
  };
}

/**
 * Create a new feedback entry
 */
export async function createFeedback(
  userId: string | null,
  feedbackText: string,
  userAgent?: string,
  pageUrl?: string
): Promise<Feedback> {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      feedback_text: feedbackText,
      user_agent: userAgent || null,
      page_url: pageUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create feedback: ${error.message}`);
  }

  return rowToFeedback(data);
}

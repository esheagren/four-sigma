import { Question } from './types';
import { supabase } from './supabase';

/**
 * Get a question by ID from Supabase
 */
export async function getQuestionById(id: string): Promise<Question | undefined> {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      answer_value,
      answer_explanation,
      source_url,
      source_name,
      units (name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching question:', error);
    return undefined;
  }

  return {
    id: data.id,
    prompt: data.question_text,
    unit: (data.units as any)?.name || '',
    trueValue: data.answer_value,
    source: data.source_name || '',
    sourceUrl: data.source_url || '',
  };
}

/**
 * Get a set of random questions for a new session from Supabase
 */
export async function getQuestionsForSession(count: number = 3): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      answer_value,
      answer_explanation,
      source_url,
      source_name,
      units (name)
    `)
    .eq('is_active', true)
    .limit(100);

  if (error || !data || data.length === 0) {
    console.error('Error fetching questions:', error);
    return [];
  }

  // Shuffle and pick `count` questions
  const shuffled = data.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map(q => ({
    id: q.id,
    prompt: q.question_text,
    unit: (q.units as any)?.name || '',
    trueValue: q.answer_value,
    source: q.source_name || '',
    sourceUrl: q.source_url || '',
  }));
}

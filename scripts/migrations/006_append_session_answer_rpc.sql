-- Migration: Add RPC function for atomic answer appending
-- This eliminates the read-modify-write pattern for faster answer submissions

CREATE OR REPLACE FUNCTION append_session_answer(
  p_session_id TEXT,
  p_answer JSONB
)
RETURNS void AS $$
BEGIN
  UPDATE game_sessions
  SET answers = answers || p_answer
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

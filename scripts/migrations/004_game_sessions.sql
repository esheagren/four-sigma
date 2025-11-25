-- Migration: Create game_sessions table for serverless function session storage
-- Required for Vercel serverless deployment where we can't use in-memory session storage

-- Create the game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  question_ids TEXT[] NOT NULL,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Sessions expire after 1 hour
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON game_sessions(expires_at);

-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations on game_sessions (since sessions are anonymous)
CREATE POLICY "Allow all game session operations" ON game_sessions
  FOR ALL USING (true);

-- Create a function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up expired sessions every hour
-- This requires the pg_cron extension (available in Supabase)
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');

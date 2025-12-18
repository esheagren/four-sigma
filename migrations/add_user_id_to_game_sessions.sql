-- Migration: Add user_id column to game_sessions table
-- This column stores which user started the session (captured at session start time)
-- Required for proper attribution of game results to users

-- Check if the column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column as nullable (existing sessions won't have it)
        ALTER TABLE game_sessions
        ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

        -- Create an index for faster lookups by user
        CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);

        RAISE NOTICE 'Added user_id column to game_sessions table';
    ELSE
        RAISE NOTICE 'user_id column already exists on game_sessions table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_sessions'
ORDER BY ordinal_position;

# Vercel Deployment Guide

This guide explains how to deploy Four Sigma to Vercel with serverless API functions.

## Architecture

The app consists of:
- **Frontend**: Vite + React SPA (deployed as static files)
- **Backend**: Vercel Serverless Functions (in the `/api` directory)
- **Database**: Supabase (PostgreSQL)

## Prerequisites

1. A Vercel account connected to your GitHub repository
2. A Supabase project with the database schema set up

## Deployment Steps

### 1. Run Database Migration

Before deploying, run the new game sessions migration in your Supabase SQL editor:

```sql
-- Copy contents of scripts/migrations/004_game_sessions.sql
```

This creates a table to store game session data (required for serverless functions).

### 2. Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | `eyJ...` |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL (for frontend) | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key (safe for frontend) | `eyJ...` |

#### Optional Scoring Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SCORING_EXACT_GUESS_BONUS` | `10000` | Bonus for exact guesses |
| `SCORING_BUFFER_MULTIPLIER` | `0.01` | Buffer for edge cases |
| `SCORING_BASE_SCORE` | `50` | Base score for hits |
| `SCORING_PRECISION_EXPONENT` | `0.7` | Precision reward steepness |
| `SCORING_INDIVIDUAL_DECIMALS` | `1` | Decimal places for question scores |
| `SCORING_TOTAL_DECIMALS` | `2` | Decimal places for session scores |

### 3. Deploy

Push to your connected GitHub branch, or run:

```bash
vercel --prod
```

## API Endpoints

After deployment, your API is available at:

### Auth
- `POST /api/auth/device` - Initialize anonymous user
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Session
- `POST /api/session/start` - Start new game
- `POST /api/session/answer` - Submit answer
- `POST /api/session/finalize` - Complete game
- `GET /api/session/leaderboard?type=overall` - Overall leaderboard
- `GET /api/session/leaderboard?type=best-guesses` - Best guesses

### User
- `GET /api/user/profile` - Get profile with stats
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/stats` - Get user stats
- `GET /api/user/daily-stats` - Get daily stats
- `GET /api/user/performance-history?days=7` - Performance history

### Other
- `POST /api/feedback` - Submit feedback
- `GET /api/health` - Health check

## Local Development

For local development, you can still use the Express server:

```bash
npm run dev
```

This runs both the Vite dev server and the Express backend concurrently.

## Troubleshooting

### Build Timeout
The old build with `tsc -b` was timing out. This has been fixed by:
1. Removing TypeScript compilation from build (Vite handles it)
2. Moving API to Vercel serverless functions

### CORS Issues
All API endpoints include CORS headers for:
- All origins (`*`)
- Methods: GET, POST, PATCH, OPTIONS
- Headers: Content-Type, Authorization, X-Device-Id

### Session Not Found
If you get "Session not found" errors:
1. Make sure you ran the `004_game_sessions.sql` migration
2. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase dashboard for any connection issues
- Ensure RLS policies are set up correctly

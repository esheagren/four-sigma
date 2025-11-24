# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development
```bash
npm run dev          # Start both frontend + backend with hot reloading
npm run dev:client   # Frontend only (Vite on :5173)
npm run dev:server   # Backend only (Express on :3001)
```

### Other Commands
```bash
npm run build        # Build frontend for production
npm run lint         # Run ESLint
```

### Testing
There are currently no automated tests in this project.

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + TypeScript (with tsx for hot reloading)
- **Data**: In-memory storage (planned migration to Supabase)
- **Scoring**: Custom logarithmic algorithm in `server/utils/scoring.ts`

### Request Flow
1. User starts game → Frontend calls `POST /api/session/start`
2. Backend creates session, returns 3 questions (without true values)
3. User submits each answer → `POST /api/session/answer`
4. After 3 answers → `POST /api/session/finalize`
5. Backend calculates scores, returns judgements with true values

### Backend Architecture

The backend follows a clean separation of concerns:

**`server/types/index.ts`** - All TypeScript interfaces (Question, Answer, Session, Judgement, API types)

**`server/database/`**
- `questions.ts` - Mock question bank and query functions
- `storage.ts` - In-memory session storage, leaderboard, and community stats

**`server/routes/session.routes.ts`** - All API endpoints and business logic

**`server/utils/scoring.ts`** - Scoring algorithm implementation

**`server/server.ts`** - Express app setup and middleware

### Frontend Architecture

**`src/components/Game.tsx`** - Main orchestrator that manages:
- Session lifecycle (start, submit answers, finalize)
- State for questions, results, loading, errors
- Delegates to QuestionCard and Results components

**`src/components/QuestionCard.tsx`** - Single question UI with input validation

**`src/components/Results.tsx`** - Results display with scores and statistics

**`src/components/Leaderboard.tsx`** - Displays top scores

**`src/components/DailyScoreCard.tsx`** - Shows daily session stats

**`src/components/HowToPlayModal.tsx`** - Game instructions

**`src/components/Nav.tsx`** - Navigation component

### Key Design Patterns

1. **Type Safety**: Shared types between frontend and backend via `server/types/index.ts`
2. **Data Isolation**: Database layer encapsulates all data access, making Supabase migration straightforward
3. **Stateless API**: Each request is independent; session state lives in backend storage
4. **Question Privacy**: True values never sent to frontend until session is finalized

### Scoring System

The game uses a logarithmic scoring algorithm (see `server/utils/README.md` for details):
- Hits (true value in interval): Score based on interval width (narrower = higher)
- Misses: Score of 0
- Exact guesses: 3x multiplier with 5% buffer

Formula accounts for value magnitude to fairly compare small and large numbers.

## Adding New Features

### Adding Questions
Edit `server/database/questions.ts` and add to the `questions` array:
```typescript
{
  id: 'q9',
  prompt: 'Your question here',
  unit: 'units',
  trueValue: 123,
  source: 'Source Name',
  sourceUrl: 'https://example.com',
}
```

### Adding API Endpoints
1. Add request/response types to `server/types/index.ts`
2. Create route handler in `server/routes/session.routes.ts`
3. Register route in `server/server.ts` if creating new router

### Frontend Components
- Components live in `src/components/`
- Use TypeScript interfaces for props
- Styling in `src/App.css` (single CSS file)

## Important Context

### API Proxy
Vite proxies `/api` requests to `http://localhost:3001` (see `vite.config.ts`)

### Hot Reloading
- Backend: `tsx watch` restarts server on file changes
- Frontend: Vite HMR updates browser instantly

### Community Stats
The backend tracks:
- Question scores (average and best per question)
- Leaderboard (top scores across all sessions)
- In-memory only (resets on server restart)

### Planned Migration to Supabase
The backend is structured to make database migration simple:
- All data access isolated in `server/database/`
- Keep function signatures identical when implementing Supabase
- No route changes needed during migration

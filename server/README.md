# Four Sigma Backend

Express API server for the Four Sigma calibration game.

## Project Structure

```
server/
├── server.ts                 # Main server setup and middleware
├── types/
│   └── index.ts             # TypeScript type definitions
├── database/
│   ├── questions.ts         # Question data and queries
│   └── storage.ts           # In-memory session storage
└── routes/
    └── session.routes.ts    # Session API endpoints
```

## Architecture Overview

### `/types/index.ts`
Centralized type definitions for the entire backend:
- Core data types: `Question`, `Answer`, `Session`, `Judgement`
- API request/response types for type-safe endpoints

### `/database/questions.ts`
Question data layer:
- `questions` - Mock question bank (8 questions)
- `getQuestionById(id)` - Fetch a single question
- `getQuestionsForSession(count)` - Get questions for a new game

**Future**: Replace with Supabase queries when migrating to persistence.

### `/database/storage.ts`
Session storage layer:
- `generateSessionId()` - Create unique session IDs
- `createSession(sessionId, questionIds)` - Initialize a session
- `getSession(sessionId)` - Retrieve session data
- `addAnswer(sessionId, answer)` - Store user answers
- `isQuestionInSession(sessionId, questionId)` - Validate questions

**Future**: Replace with Supabase tables when migrating to persistence.

### `/routes/session.routes.ts`
API route handlers:
- `POST /api/session/start` - Create a new game session
- `POST /api/answer` - Submit an answer
- `POST /api/session/finalize` - Get results and score

All validation and business logic is contained here.

### `/server.ts`
Main server entry point:
- Express app configuration
- Middleware setup (CORS, JSON parsing)
- Route registration
- Server initialization

## Key Design Decisions

### Separation of Concerns
- **Types**: Shared across all modules for consistency
- **Database**: Data access logic isolated for easy migration
- **Routes**: Business logic and validation separate from data
- **Server**: Clean, minimal setup file

### Future-Ready Structure
The current structure makes it easy to:
- Replace mock storage with Supabase
- Add new routes (e.g., user profiles, leaderboards)
- Add new question sources
- Implement caching or other optimizations

### Type Safety
All modules use TypeScript interfaces to ensure:
- Compile-time error checking
- IntelliSense support
- API contract enforcement

## Development

### Running the Server

**With frontend (recommended):**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:server
```

Uses `tsx watch` for hot reloading - any changes to server files automatically restart the server.

### Adding New Questions
Edit `database/questions.ts` and add to the `questions` array:
```typescript
{
  id: 'q9',
  prompt: 'Your question here',
  unit: 'units',
  trueValue: 123,
}
```

### Adding New Endpoints
1. Add types to `types/index.ts` if needed
2. Create route handler in `routes/session.routes.ts` (or create new route file)
3. Register router in `server.ts`

### Migration to Supabase
When ready to migrate:
1. Create Supabase client in `database/supabase.ts`
2. Update `questions.ts` functions to query Supabase
3. Update `storage.ts` functions to use Supabase tables
4. Keep function signatures identical - no route changes needed!

## API Reference

See main README.md for detailed API documentation.



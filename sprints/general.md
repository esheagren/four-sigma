Four Sigma is a numerical question calibration game. Every question is numerical. Example. Height of Mount Everest. The user enters a 95 percent interval with a lower bound and an upper bound. After a game session, we can show an answer card with the true value and a hit or miss flag. Scoring v1 is binary. One point if the true value is inside the interval. Zero otherwise. Total score is out of three.

Stack. React with TypeScript on the frontend. Express with TypeScript on the backend. Supabase for data in the future. For now use a simple in-memory mock.

Game loop. Start a session. Serve three questions. For each question the user submits lower and upper bounds. After the third submission the backend returns judgements with the true values and the total score. The UI then shows the results card.

Frontend shape. A top level Game component manages session state. It fetches a new session on mount. It renders one QuestionCard at a time. QuestionCard shows the question text at the top. Two numeric inputs in the middle. Lower bound and upper bound. A Submit button at the bottom. The button is disabled if inputs are empty or if lower is greater than upper. When the user submits, Game posts the answer, advances to the next question, and after the third answer calls finalize. When finalized, Game renders a Results view. Results shows score and a list of each question with the user interval, the true value, and hit or miss.

Backend shape. Express API with three routes. POST /api/session/start creates a session and returns a sessionId and three question stubs without true values. POST /api/answer accepts sessionId, questionId, lower, and upper. It stores the answer for that session. POST /api/session/finalize accepts sessionId. It compares each stored interval to the true value, computes hit booleans, and returns judgements plus the total score.

Data. Questions have id, prompt, optional unit, trueValue, and optional source with sourceUrl. Answers have questionId, lower, upper, and submittedAt. A session tracks the three questionIds and the answers. Judgements contain lower, upper, trueValue, hit, and source attribution.

Mock storage. Provide a small in-memory array of five to ten questions with true values. On session start pick the first three for determinism or pick three at random. Keep a Map of sessionId to session data. Save answers there. Compute judgements on finalize.

Supabase plan. Later we will replace the mock with tables for questions, sessions, and answers. Keep the API contracts identical so the frontend does not change. Create a supabase client file with env vars. No live calls yet.

Scoring logic. A hit is truth greater than or equal to lower and less than or equal to upper. Score uses a logarithmic algorithm that rewards narrow intervals. Misses receive 0 points. The formula accounts for interval width relative to value magnitude. See server/utils/scoring.ts for implementation.

Answer card behavior. On finalize return the three true values and hit flags. The UI displays a compact list. Show the interval as [lower, upper]. Show the true value next to it. Color green for hit. Red for miss.

Validation. Reject if lower is not a number. Reject if upper is not a number. Reject if lower is greater than upper. Frontend mirrors the same checks to disable the button early.

Non goals for v1. No auth. No persistence across reloads. No user profiles. No best estimate input. Only intervals.

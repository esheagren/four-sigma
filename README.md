# Four Sigma - Numerical Calibration Game

A game that helps you calibrate your confidence intervals by asking numerical questions and checking if the true value falls within your 95% confidence interval.

## Overview

Four Sigma presents three numerical questions per game session. For each question, you provide a lower and upper bound representing your 95% confidence interval. After all three questions, you'll see your score and whether the true values fell within your intervals.

## Tech Stack

- **Frontend**: React 19 with TypeScript, Vite
- **Backend**: Express with TypeScript
- **Styling**: Custom CSS with modern design

## Getting Started

> **Quick Start:** See [QUICKSTART.md](QUICKSTART.md) for the fastest way to get up and running!

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
npm install
```

### Running the Application

Start both the backend and frontend with a single command:

```bash
npm run dev
```

This will:
- Start the Express server on `http://localhost:3001` (with hot reloading)
- Start the Vite development server on `http://localhost:5173` (with hot reloading)
- Show color-coded output for both servers in one terminal

Open your browser to `http://localhost:5173` to play the game!

**Alternative:** Run servers separately (optional)
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

## How to Play

1. When the game loads, you'll see the first of three questions
2. Enter a lower bound and upper bound for your 95% confidence interval
3. Click "Submit Answer" to move to the next question
4. After three questions, you'll see your results:
   - Your total score (out of 3)
   - Each question with your interval, the true value, and whether you got it right
5. Click "Play Again" to start a new game

## Game Rules

### Scoring
- **Hit**: True value is within your interval → Positive score based on interval width
- **Miss**: True value is outside your interval → Score of 0
- **Narrower intervals get higher scores** when they contain the true value
- Total score is the sum of all individual question scores

### Validation
The submit button is disabled if:
- Either input is empty
- Either input is not a number
- Lower bound is greater than upper bound

### Scoring Formula
The game uses a logarithmic scoring algorithm that:
- Rewards narrow, accurate confidence intervals
- Misses score 0 points (no penalty)
- Accounts for the magnitude of values (1000 vs 1,000,000)

### Visual Feedback
Each result card displays:
- Your interval and score
- True value
- **Precision score** - Visible percentage showing interval narrowness (100% = perfectly narrow; 0% for misses). Hover ⓘ icon for explanation
- **Community statistics**:
  - Community average score for this question
  - Community best score for this question
- **Source attribution** - Clickable link to the source of the true value

This helps you compare your performance, understand calibration quality, and verify the accuracy of information.

See [SCORING_VISUAL.md](SCORING_VISUAL.md), [COMMUNITY_STATS.md](COMMUNITY_STATS.md), [SOURCES.md](SOURCES.md), and [server/utils/README.md](server/utils/README.md) for detailed documentation.

## Project Structure

```
four-sigma/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── Game.tsx          # Main game orchestrator
│   │   ├── QuestionCard.tsx  # Question display and input
│   │   └── Results.tsx       # Results and score display
│   ├── App.tsx               # Root component
│   ├── App.css               # Main styles
│   └── main.tsx              # Entry point
├── server/                   # Backend (Express + TypeScript)
│   ├── server.ts             # Main server setup
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── database/
│   │   ├── questions.ts      # Question data and queries
│   │   └── storage.ts        # In-memory session storage
│   └── routes/
│       └── session.routes.ts # API route handlers
└── package.json
```

See [server/README.md](server/README.md) for detailed backend architecture documentation.

## API Endpoints

### POST /api/session/start
Creates a new game session and returns three questions (without true values).

**Response:**
```json
{
  "sessionId": "session_123...",
  "questions": [
    {
      "id": "q1",
      "prompt": "Height of Mount Everest in meters",
      "unit": "meters"
    }
  ]
}
```

### POST /api/session/answer
Submits an answer for a question.

**Request:**
```json
{
  "sessionId": "session_123...",
  "questionId": "q1",
  "lower": 8000,
  "upper": 9000
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/session/finalize
Finalizes the session and returns judgements with true values.

**Request:**
```json
{
  "sessionId": "session_123..."
}
```

**Response:**
```json
{
  "judgements": [
    {
      "questionId": "q1",
      "prompt": "Height of Mount Everest in meters",
      "unit": "meters",
      "lower": 8000,
      "upper": 9000,
      "trueValue": 8849,
      "hit": true
    }
  ],
  "score": 2,
  "totalQuestions": 3
}
```

## Future Enhancements

- Supabase integration for persistence
- User authentication and profiles
- Scoring that penalizes overly wide intervals
- Streak tracking
- More questions and question categories
- Leaderboards

## Development

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

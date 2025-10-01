# Community Statistics

## Overview

Four Sigma tracks community performance on each question, allowing you to compare your calibration against other players.

## What Statistics Are Tracked

For each question, the system records:
- **All scores** from all players who attempted the question
- **Average score** across all attempts
- **Highest score** ever achieved

## How It Works

### Score Recording
1. When you finalize a session, your individual score for each question is recorded
2. Scores are stored in-memory (will move to Supabase in future)
3. Both hits and misses are included in the statistics

### Statistics Calculation
- **Community average**: Mean of all scores for that question
- **Community best**: Maximum score ever achieved for that question

### Display
Community stats appear in the results card for each question:

```
Your score:          232.89
─────────────────────────────
Community average:   185.45
Community best:      425.78
```

## Interpreting Community Stats

### Compare Your Performance

**Above average:**
- Your score > Community average
- You're calibrating better than most players

**Below average:**
- Your score < Community average
- Room for improvement in narrowing your intervals

**Near the best:**
- Your score approaches Community best
- Excellent calibration for this question

### Understanding Question Difficulty

**High average scores:**
- Question is easier to calibrate
- Community generally gets narrow intervals right

**Low average scores:**
- Question is harder to calibrate
- Wide intervals or frequent misses

## Privacy

- Individual scores are aggregated anonymously
- No personally identifiable information is stored
- Statistics are per-question, not per-user

## Future Enhancements

When migrating to Supabase:
- Persistent statistics across server restarts
- Percentile rankings
- Time-based trends (monthly averages)
- Question difficulty ratings
- Leaderboards (optional, with opt-in)


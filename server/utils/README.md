# Scoring Algorithm

## Overview

The Four Sigma scoring algorithm rewards narrow confidence intervals that contain the true value and penalizes misses. Unlike simple binary scoring (1 for hit, 0 for miss), this algorithm provides graduated scores based on interval width.

## Scoring Rules

### Hits (True value within interval)
- Narrower intervals receive higher scores
- Score is calculated using a logarithmic formula that accounts for:
  - Interval width relative to the value magnitude
  - Position of the true value within the interval

### Misses (True value outside interval)
- **Score: 0** (no points awarded)

### Exact Guesses (Lower = Upper = True Value)
- Receives a 5% buffer to account for the precision
- Score is multiplied by **3x** to reward confidence

## Formula

For hits, the score is computed using:

```
upperLog = log₁₀(upper + 1.1)
lowerLog = log₁₀(lower + 1.1)
answerLog = log₁₀(answer + 1.1)
upperLogMinusLowerLog = log₁₀(upperLog - lowerLog)
upperMinusLower = upperLog - lowerLog
allThree = answerLog - 2 * upperLog - 2 * lowerLog
pow = (allThree / upperMinusLower)²

score = √(upperLogMinusLowerLog / 4 + 2 * pow)
```

The 1.1 offset prevents log(0) issues for values near zero.

## Examples

### Wide Interval Hit
- Interval: [8000, 9000]
- True Value: 8849
- **Score: 325.39**

### Narrow Interval Hit
- Interval: [1400, 1500]
- True Value: 1440
- **Score: 448.11**

### Miss
- Interval: [100, 150]
- True Value: 206
- **Score: 0.00**

### Total Score
Sum of all individual scores, rounded to 2 decimal places.

Example session: 325.39 + 448.11 + 0.00 = **773.50**

## Interpretation

- **Higher scores** indicate better calibration with narrower intervals
- **Low total scores** indicate poor calibration (many misses or wide intervals)
- Over multiple sessions, average score reflects calibration quality

## Usage

```typescript
import { Score } from '../utils/scoring';

// Calculate individual score
const score = Score.calculateScore(lower, upper, trueValue);

// Calculate total from array of scores
const total = Score.calculateTotalScore([325.39, 448.11, -1]);
// Returns: 772.50
```


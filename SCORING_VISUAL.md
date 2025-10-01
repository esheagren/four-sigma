# Scoring Visualization Guide

## Visual Feedback Elements

The results screen now includes visual indicators that help users understand why their score is what it is.

### For Each Hit (Correct Answer)

#### 1. Interval Width Display
Shows the numerical width of your confidence interval:
```
Interval width: 399,900  (for [100, 400000])
Interval width: 200      (for [1400, 1600])
```

#### 2. Precision Score with Tooltip
Displays as a visible percentage with an explanatory tooltip:

**Display:**
```
Precision: ⓘ                     86%
```

**Tooltip appears on hover:**
```
┌────────────────────────────────────────────┐
│ Narrower range yields higher precision.   │
│ Only updated with correct answer.         │
└────────────────────────────────────────────┘
```

The percentage is always visible. Hover over ⓘ for a concise explanation.

**Precision Scale:**
- 100% = Perfect precision (interval width is 0, and hit)
- 86% = High precision (interval width is 14% of true value, and hit)
- 0% = Miss (interval did not contain the true value)

**Note:** Precision is only calculated for correct answers (hits). If you miss, precision is always 0% regardless of interval width.

### How Precision is Calculated

```typescript
if (hit) {
  precisionScore = 100 - (intervalWidth / trueValue * 100)
} else {
  precisionScore = 0  // Misses always get 0% precision
}
```

**Examples:**

1. **Question 1**: Height of Mount Everest (Hit)
   - Interval: [100, 400000] → Width: 399,900
   - True Value: 8849
   - Width %: 4519% of true value
   - Precision: 0% (width exceeds true value, but still a hit)
   - Score: 4.44

2. **Question 2**: Printing Press Year (Hit)
   - Interval: [1400, 1600] → Width: 200
   - True Value: 1440
   - Width %: 13.9% of true value
   - Precision: 86%
   - Score: 232.89

3. **Question 3**: Example Miss
   - Interval: [10, 100] → Width: 90
   - True Value: 1440
   - Missed the true value
   - Precision: 0% (miss = no precision credit)
   - Score: 0.00

### Visual Design Features

✨ **Elegant Hover Tooltip**
- Clean, minimal design
- Info icon (ⓘ) changes color on hover
- Dark tooltip with white text, rounded corners
- Arrow pointer to indicate source
- Smooth slide-up animation with fade-in
- Deeper shadow for better depth
- Concise, clear messaging

✨ **Color Coding**
- Green border for hits
- Red border for misses
- Gray info icon turns purple on hover
- High contrast tooltip

✨ **Clear Information**
- Precision percentage + explanation in one line
- "Narrower intervals score higher" reminder
- Only appears when you need it

### User Understanding

The tooltip helps users understand:
1. **Why a wide interval gets a low score** → Sees "Width is 4519% of true value"
2. **Why a narrow interval gets a high score** → Sees "Width is 13.9% of true value"
3. **The relationship between width and score** → Direct explanation

This teaches calibration in an elegant, unobtrusive way: you want to be confident enough to narrow your interval, but not so overconfident that you miss entirely.


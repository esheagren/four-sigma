/**
 * Scoring utility for Four Sigma game
 * Rewards narrow confidence intervals that contain the true value
 * Misses score 0 points
 * 
 * Algorithm parameters are configurable via environment variables to keep
 * the scoring logic secure on the server side.
 */

// Load scoring parameters from environment variables with defaults
const EXACT_GUESS_BONUS = parseFloat(process.env.SCORING_EXACT_GUESS_BONUS || '10000');
const BUFFER_MULTIPLIER = parseFloat(process.env.SCORING_BUFFER_MULTIPLIER || '0.01');
const BASE_SCORE = parseFloat(process.env.SCORING_BASE_SCORE || '50');
const PRECISION_EXPONENT = parseFloat(process.env.SCORING_PRECISION_EXPONENT || '0.7');
const INDIVIDUAL_SCORE_DECIMALS = parseInt(process.env.SCORING_INDIVIDUAL_DECIMALS || '1', 10);
const TOTAL_SCORE_DECIMALS = parseInt(process.env.SCORING_TOTAL_DECIMALS || '2', 10);

export class Score {
  /**
   * Calculate score for a single answer
   * @param lower - Lower bound of the interval
   * @param upper - Upper bound of the interval
   * @param answer - True value
   * @returns Score (positive for hit, 0 for miss)
   */
  static calculateScore(lower: number, upper: number, answer: number): number {
    // Check if answer is within bounds
    if (!Score.inBounds(lower, upper, answer)) {
      return 0; // Miss scores zero
    }
    
    // Handle exact guess - legendary precision bonus
    if (lower === upper && lower === answer) {
      return EXACT_GUESS_BONUS;
    }
    
    // Handle edge case where bounds are equal but not exact
    if (lower === upper) {
      // Add small buffer to prevent division issues
      const buffer = Math.max(0.01, Math.abs(lower) * BUFFER_MULTIPLIER);
      lower = lower - buffer;
      upper = upper + buffer;
    }
    
    // Calculate the actual score
    return Score.computeScore(lower, upper, answer);
  }

  /**
   * Compute score using very steep convexity formula
   * Score = BASE_SCORE * (1 / relativeWidth^PRECISION_EXPONENT)
   * @param lower - Lower bound
   * @param upper - Upper bound
   * @param answer - True value
   * @returns Computed score
   */
  static computeScore(lower: number, upper: number, answer: number): number {
    // Calculate interval width
    const intervalWidth = Math.abs(upper - lower);
    
    // Handle zero answers by using minimum magnitude of 1
    const answerMagnitude = Math.max(1, Math.abs(answer === 0 ? 1 : answer));
    
    // Calculate relative width (interval as proportion of answer)
    const relativeWidth = intervalWidth / answerMagnitude;
    
    // Precision multiplier with very steep convexity
    // This creates dramatic rewards for precision
    const precisionMultiplier = 1 / Math.pow(relativeWidth, PRECISION_EXPONENT);
    
    // Calculate final score
    const score = BASE_SCORE * precisionMultiplier;
    
    // Round to configured decimal places for display
    const multiplier = Math.pow(10, INDIVIDUAL_SCORE_DECIMALS);
    return Math.round(score * multiplier) / multiplier;
  }

  /**
   * Check if answer is within bounds
   * @param lowerBound - Lower bound
   * @param upperBound - Upper bound
   * @param answer - True value
   * @returns True if answer is in [lowerBound, upperBound]
   */
  static inBounds(lowerBound: number, upperBound: number, answer: number): boolean {
    return lowerBound <= answer && upperBound >= answer;
  }

  /**
   * Calculate total score from multiple answers
   * @param scores - Array of individual scores
   * @returns Sum of all scores, rounded to configured decimal places
   */
  static calculateTotalScore(scores: number[]): number {
    const total = scores.reduce((sum, score) => sum + score, 0);
    const multiplier = Math.pow(10, TOTAL_SCORE_DECIMALS);
    return Math.round(total * multiplier) / multiplier;
  }
}


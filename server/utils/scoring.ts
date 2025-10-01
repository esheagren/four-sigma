/**
 * Scoring utility for Four Sigma game
 * Rewards narrow confidence intervals that contain the true value
 * Misses score 0 points
 */
export class Score {
  /**
   * Calculate score for a single answer
   * @param lower - Lower bound of the interval
   * @param upper - Upper bound of the interval
   * @param answer - True value
   * @returns Score (positive for hit, 0 for miss)
   */
  static calculateScore(lower: number, upper: number, answer: number): number {
    if (Score.inBounds(lower, upper, answer)) {
      // Special case: exact guess (same lower and upper)
      if (lower === answer && upper === answer) {
        // Apply 5% buffer for exact guesses
        const adjustedUpper = upper * 1.05;
        const adjustedLower = lower * 0.95;
        const baseScore = this.computeScore(adjustedLower, adjustedUpper, answer);
        return 3 * baseScore;
      }
      return this.computeScore(lower, upper, answer);
    } else {
      // Out of bounds: no score
      return 0;
    }
  }

  /**
   * Compute score using logarithmic formula
   * Narrower intervals get higher scores
   * @param lower - Lower bound
   * @param upper - Upper bound
   * @param answer - True value
   * @returns Computed score
   */
  static computeScore(lower: number, upper: number, answer: number): number {
    const upperLog = Math.log10(upper + 1.1);
    const lowerLog = Math.log10(lower + 1.1);
    const answerLog = Math.log10(answer + 1.1);
    const upperLogMinusLowerLog = Math.log10(upperLog - lowerLog);
    const upperMinusLower = upperLog - lowerLog;
    const allThree = answerLog - 2 * upperLog - 2 * lowerLog;
    const pow = Math.pow(allThree / upperMinusLower, 2);

    const algo = upperLogMinusLowerLog / 4 + 2 * pow;
    const comp = Math.sqrt(algo);
    return comp;
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
   * @returns Sum of all scores, rounded to 2 decimal places
   */
  static calculateTotalScore(scores: number[]): number {
    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(total * 100) / 100;
  }
}


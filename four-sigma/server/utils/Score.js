// utility class for calculating score
class Score {
  static score = 0;

  static getScore() {
    return this.score;
  }

  static setScore(score) {
    this.score = score;
  }

  // Provides a calculated score based on the submitted range and true answer,
  // Rounded to the nearest whole number.
  static calculateScore(lower, upper, answer) {
    console.log("Score.calculateScore called with:", { lower, upper, answer });
    
    if (Score.inBounds(lower, upper, answer)) {
      if (lower === answer && upper === answer) {
        upper *= 1.05;
        lower *= 0.95;
        let test = this.computeScore(lower, upper, answer);
        const finalScore = Math.round(3 * test);
        console.log("Score.computeScore computed (triple):", finalScore);
        return finalScore;
      }
      let computed = this.computeScore(lower, upper, answer);
      const finalScore = Math.round(computed);
      console.log("Score.computeScore computed:", finalScore);
      return finalScore;
    } else {
      console.log("Answer is out of bounds. Returning -1");
      return -1;
    }
  }

  // Computes the score based on the answers given
  static computeScore(lower, upper, answer) {
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

  // Checks if the true answer is within the (possibly modified) range 
  static inBounds(lowerBound, upperBound, answer) {
    return lowerBound <= answer && upperBound >= answer;
  }
}

export default Score; 
// utility class for calculating score
class Score {
  static score = 0;

  static getScore() {
    return this.score;
  }

  static setScore(score) {
    this.score = score;
  }

  static calculateScore(lower, upper, answer) {
    if (Score.inBounds(lower, upper, answer)) {
      if (lower === answer && upper === answer) {
        upper *= 1.05;
        lower *= 0.95;
        let test = this.computeScore(lower, upper, answer);
        return 3 * test;
      }
      return this.computeScore(lower, upper, answer);
    } else {
      return -1;
    }
  }

  static computeScore(lower, upper, answer) {
    let upperLog = Math.log10(upper + 1.1);
    let lowerLog = Math.log10(lower + 1.1);
    let answerLog = Math.log10(answer + 1.1);
    let upperLogMinusLowerLog = Math.log10(upperLog - lowerLog);
    let upperMinusLower = upperLog - lowerLog;
    let allThree = answerLog - 2 * upperLog - 2 * lowerLog;
    let pow = Math.pow(allThree / upperMinusLower, 2);

    let algo = upperLogMinusLowerLog / 4 + 2 * pow;
    let comp = Math.sqrt(algo);
    return comp;
  }

  static inBounds(lowerBound, upperBound, answer) {
    return lowerBound <= answer && upperBound >= answer;
  }
}

export default Score; 
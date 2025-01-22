export class Question {
  constructor(
    questionId,  // will be auto-generated by Firestore
    text,
    answer,
    url = '',
    tags = [],
    timeAttempted = 0,
    guesses = [],
    createdBy,
    createdAt = new Date(),
    averageUpper = 0,
    averageLower = 0,
    standardDevUpper = 0,
    standardDevLower = 0,
    percentCorrect = 0,
    inBounds = 0
  ) {
    this.questionId = questionId;
    this.text = text;
    this.answer = answer;
    this.url = url;
    this.tags = tags;
    this.timeAttempted = timeAttempted;
    this.guesses = guesses;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.averageUpper = averageUpper;
    this.averageLower = averageLower;
    this.standardDevUpper = standardDevUpper;
    this.standardDevLower = standardDevLower;
    this.percentCorrect = percentCorrect;
    this.inBounds = inBounds;
  }
}
export default Question;
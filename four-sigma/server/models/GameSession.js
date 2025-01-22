export class GameSession {
  constructor(
    gameId,    // will be auto-generated by Firestore
    userId,
    score = 0,
    questionsAnswered = [],
    startedAt = new Date(),
    endedAt = null
  ) {
    this.gameId = gameId;
    this.userId = userId;
    this.score = score;
    this.questionsAnswered = questionsAnswered;
    this.startedAt = startedAt;
    this.endedAt = endedAt;
  }
}

export default GameSession;
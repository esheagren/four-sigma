export class User {
    constructor(
      userId,
      email,
      username,
      profile = {
        dateJoined: new Date(),
        lastActive: new Date()
      },
      stats = {
        averageQuestionScore: 0,
        calibration: 0,
        correctAnswers: 0,
        dailyStreak: 0,
        highestGameScore: 0,
        highestQuestionScore: 0,
        sdQuestionScore: 0,
        totalGamesPlayed: 0,
        totalQuestionsAnswered: 0
      }
    ) {
      this.userId = userId;
      this.email = email;
      this.username = username;
      this.profile = profile;
      this.stats = stats;
    }
  }
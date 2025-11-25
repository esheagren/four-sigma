import { supabase } from './supabase.js';

/**
 * Get UTC date string for "today" (YYYY-MM-DD)
 */
function getUTCDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get start of UTC day as ISO string
 */
function getUTCDayStart(date: Date = new Date()): string {
  const dateStr = getUTCDateString(date);
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Record a user's response for a question
 */
export async function recordUserResponse(
  userId: string,
  questionId: string,
  data: {
    lowerBound: number;
    upperBound: number;
    score: number;
    captured: boolean;
    answerValueAtResponse: number;
  }
): Promise<void> {
  const { error } = await supabase.from('user_responses').insert({
    user_id: userId,
    question_id: questionId,
    lower_bound: data.lowerBound,
    upper_bound: data.upperBound,
    score: data.score,
    captured: data.captured,
    answer_value_at_response: data.answerValueAtResponse,
    answered_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to record user response:', error);
    throw new Error(`Failed to record response: ${error.message}`);
  }
}

/**
 * Update user aggregate stats after completing a session
 */
export async function updateUserStatsAfterSession(
  userId: string,
  sessionData: {
    sessionScore: number;
    questionsCaptured: number;
    questionsAnswered: number;
  }
): Promise<void> {
  // First get current user stats
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('total_score, games_played, questions_captured, best_single_score, current_streak, best_streak')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('Failed to fetch user stats');
  }

  const newTotalScore = Number(user.total_score) + sessionData.sessionScore;
  const newGamesPlayed = user.games_played + 1;
  const newQuestionsCaptured = user.questions_captured + sessionData.questionsCaptured;
  const totalQuestionsAnswered = user.games_played * 3 + sessionData.questionsAnswered;
  const newCalibrationRate = totalQuestionsAnswered > 0
    ? newQuestionsCaptured / totalQuestionsAnswered
    : 0;
  const newAverageScore = newGamesPlayed > 0 ? newTotalScore / newGamesPlayed : 0;

  const newBestSingleScore = Math.max(Number(user.best_single_score), sessionData.sessionScore);

  const streakMaintained = sessionData.questionsCaptured >= 2;
  const newCurrentStreak = streakMaintained ? user.current_streak + 1 : 0;
  const newBestStreak = Math.max(user.best_streak, newCurrentStreak);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      total_score: newTotalScore,
      average_score: newAverageScore,
      games_played: newGamesPlayed,
      questions_captured: newQuestionsCaptured,
      calibration_rate: newCalibrationRate,
      current_streak: newCurrentStreak,
      best_streak: newBestStreak,
      best_single_score: newBestSingleScore,
      last_played_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update user stats:', updateError);
    throw new Error(`Failed to update user stats: ${updateError.message}`);
  }
}

/**
 * Get daily stats for a user
 */
export async function getDailyStats(userId: string): Promise<{
  dailyRank: number | null;
  topScoreToday: number | null;
  todaysAverage: number | null;
  userScoreToday: number | null;
  calibrationToday: number | null;
  totalParticipantsToday: number;
}> {
  const todayStart = getUTCDayStart();

  const { data: dailyScores, error: dailyError } = await supabase
    .from('user_responses')
    .select('user_id, score, captured')
    .gte('answered_at', todayStart);

  if (dailyError) {
    console.error('Failed to fetch daily scores:', dailyError);
    return {
      dailyRank: null,
      topScoreToday: null,
      todaysAverage: null,
      userScoreToday: null,
      calibrationToday: null,
      totalParticipantsToday: 0,
    };
  }

  if (!dailyScores || dailyScores.length === 0) {
    return {
      dailyRank: null,
      topScoreToday: null,
      todaysAverage: null,
      userScoreToday: null,
      calibrationToday: null,
      totalParticipantsToday: 0,
    };
  }

  const userAggregates: Map<string, { totalScore: number; captured: number; total: number }> = new Map();

  for (const response of dailyScores) {
    const current = userAggregates.get(response.user_id) || { totalScore: 0, captured: 0, total: 0 };
    current.totalScore += Number(response.score);
    current.captured += response.captured ? 1 : 0;
    current.total += 1;
    userAggregates.set(response.user_id, current);
  }

  const sortedUsers = Array.from(userAggregates.entries())
    .map(([uid, stats]) => ({
      userId: uid,
      totalScore: stats.totalScore,
      calibration: stats.total > 0 ? (stats.captured / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const totalParticipants = sortedUsers.length;
  const topScore = sortedUsers.length > 0 ? sortedUsers[0].totalScore : null;
  const averageScore = sortedUsers.length > 0
    ? sortedUsers.reduce((sum, u) => sum + u.totalScore, 0) / sortedUsers.length
    : null;

  const userRankIndex = sortedUsers.findIndex(u => u.userId === userId);
  const userStats = sortedUsers.find(u => u.userId === userId);

  return {
    dailyRank: userRankIndex >= 0 ? userRankIndex + 1 : null,
    topScoreToday: topScore,
    todaysAverage: averageScore,
    userScoreToday: userStats?.totalScore ?? null,
    calibrationToday: userStats?.calibration ?? null,
    totalParticipantsToday: totalParticipants,
  };
}

/**
 * Get performance history for past N days
 */
export async function getPerformanceHistory(
  userId: string,
  days: number = 7
): Promise<Array<{
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}>> {
  const dayNames = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
  const result: Array<{
    date: string;
    day: string;
    userScore: number;
    avgScore: number;
    calibration: number;
  }> = [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const startDateStr = getUTCDayStart(startDate);

  const { data: responses, error } = await supabase
    .from('user_responses')
    .select('user_id, score, captured, answered_at')
    .gte('answered_at', startDateStr);

  if (error) {
    console.error('Failed to fetch performance history:', error);
    return [];
  }

  const dateUserStats: Map<string, Map<string, { score: number; captured: number; total: number }>> = new Map();

  for (const response of responses || []) {
    const dateStr = getUTCDateString(new Date(response.answered_at));

    if (!dateUserStats.has(dateStr)) {
      dateUserStats.set(dateStr, new Map());
    }

    const dayStats = dateUserStats.get(dateStr)!;
    const userStats = dayStats.get(response.user_id) || { score: 0, captured: 0, total: 0 };
    userStats.score += Number(response.score);
    userStats.captured += response.captured ? 1 : 0;
    userStats.total += 1;
    dayStats.set(response.user_id, userStats);
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = getUTCDateString(date);
    const dayOfWeek = date.getUTCDay();

    const dayStats = dateUserStats.get(dateStr);

    if (!dayStats || dayStats.size === 0) {
      result.push({
        date: dateStr,
        day: dayNames[dayOfWeek],
        userScore: 0,
        avgScore: 0,
        calibration: 0,
      });
      continue;
    }

    const allUserScores = Array.from(dayStats.values()).map(s => s.score);
    const avgScore = allUserScores.reduce((a, b) => a + b, 0) / allUserScores.length;

    const userDayStats = dayStats.get(userId);
    const userScore = userDayStats?.score ?? 0;
    const userCalibration = userDayStats && userDayStats.total > 0
      ? (userDayStats.captured / userDayStats.total) * 100
      : 0;

    result.push({
      date: dateStr,
      day: dayNames[dayOfWeek],
      userScore,
      avgScore,
      calibration: userCalibration,
    });
  }

  return result;
}

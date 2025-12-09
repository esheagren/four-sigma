import { supabase } from './supabase.js';
import { CrowdData } from './types.js';

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
 * calibrationToday is cumulative (all-time) for robust measurement
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

  // Fetch today's scores for ranking
  const { data: dailyScores, error: dailyError } = await supabase
    .from('user_responses')
    .select('user_id, score, captured')
    .gte('answered_at', todayStart);

  // Fetch ALL responses for this user to calculate cumulative calibration
  const { data: allUserResponses, error: allUserError } = await supabase
    .from('user_responses')
    .select('captured')
    .eq('user_id', userId);

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

  // Calculate cumulative calibration from all user responses
  let cumulativeCalibration: number | null = null;
  if (!allUserError && allUserResponses && allUserResponses.length > 0) {
    const totalCaptured = allUserResponses.filter(r => r.captured).length;
    const totalAnswered = allUserResponses.length;
    cumulativeCalibration = (totalCaptured / totalAnswered) * 100;
  }

  if (!dailyScores || dailyScores.length === 0) {
    return {
      dailyRank: null,
      topScoreToday: null,
      todaysAverage: null,
      userScoreToday: null,
      calibrationToday: cumulativeCalibration,
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
    calibrationToday: cumulativeCalibration,
    totalParticipantsToday: totalParticipants,
  };
}

/**
 * Get performance history for past N days
 * Calibration is shown as cumulative (all-time) up to each day for robust measurement
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

  // Fetch responses from the display window for daily scores
  const { data: recentResponses, error: recentError } = await supabase
    .from('user_responses')
    .select('user_id, score, captured, answered_at')
    .gte('answered_at', startDateStr);

  if (recentError) {
    console.error('Failed to fetch performance history:', recentError);
    return [];
  }

  // Fetch ALL responses for this user to calculate cumulative calibration
  const { data: allUserResponses, error: allUserError } = await supabase
    .from('user_responses')
    .select('captured, answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: true });

  if (allUserError) {
    console.error('Failed to fetch all user responses:', allUserError);
    return [];
  }

  // Build daily stats for all users (for avgScore calculation)
  const dateUserStats: Map<string, Map<string, { score: number; captured: number; total: number }>> = new Map();

  for (const response of recentResponses || []) {
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

  // Calculate cumulative calibration for the user up to end of each day
  // Map: dateStr -> { cumulativeCaptured, cumulativeTotal }
  const cumulativeByDate: Map<string, { captured: number; total: number }> = new Map();
  let runningCaptured = 0;
  let runningTotal = 0;

  for (const response of allUserResponses || []) {
    runningCaptured += response.captured ? 1 : 0;
    runningTotal += 1;
    const dateStr = getUTCDateString(new Date(response.answered_at));
    cumulativeByDate.set(dateStr, { captured: runningCaptured, total: runningTotal });
  }

  // Track the last known cumulative values for days with no activity
  let lastKnownCaptured = 0;
  let lastKnownTotal = 0;

  // Find cumulative stats before the display window starts
  for (const response of allUserResponses || []) {
    const responseDate = new Date(response.answered_at);
    if (responseDate < startDate) {
      lastKnownCaptured += response.captured ? 1 : 0;
      lastKnownTotal += 1;
    }
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = getUTCDateString(date);
    const dayOfWeek = date.getUTCDay();

    const dayStats = dateUserStats.get(dateStr);

    // Get cumulative calibration up to this date
    const cumulative = cumulativeByDate.get(dateStr);
    if (cumulative) {
      lastKnownCaptured = cumulative.captured;
      lastKnownTotal = cumulative.total;
    }

    const cumulativeCalibration = lastKnownTotal > 0
      ? (lastKnownCaptured / lastKnownTotal) * 100
      : 0;

    if (!dayStats || dayStats.size === 0) {
      result.push({
        date: dateStr,
        day: dayNames[dayOfWeek],
        userScore: 0,
        avgScore: 0,
        calibration: cumulativeCalibration,
      });
      continue;
    }

    const allUserScores = Array.from(dayStats.values()).map(s => s.score);
    const avgScore = allUserScores.reduce((a, b) => a + b, 0) / allUserScores.length;

    const userDayStats = dayStats.get(userId);
    const userScore = userDayStats?.score ?? 0;

    result.push({
      date: dateStr,
      day: dayNames[dayOfWeek],
      userScore,
      avgScore,
      calibration: cumulativeCalibration,
    });
  }

  return result;
}

/**
 * Get crowd data for a specific question
 * Returns distribution of other players' guesses for visualization
 */
export async function getCrowdDataForQuestion(
  questionId: string,
  trueValue: number,
  excludeUserId?: string
): Promise<CrowdData | null> {
  // Query user_responses for this question, excluding the current user
  let query = supabase
    .from('user_responses')
    .select('lower_bound, upper_bound, captured')
    .eq('question_id', questionId)
    .order('answered_at', { ascending: false })
    .limit(60);

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch crowd data:', error);
    return null;
  }

  // Need at least 1 response to show crowd data
  if (!data || data.length < 1) {
    return null;
  }

  // Build guesses array
  const guesses = data.map(r => ({
    min: Number(r.lower_bound),
    max: Number(r.upper_bound),
  }));

  // Calculate median lower and upper bounds
  const lowerBounds = guesses.map(g => g.min).sort((a, b) => a - b);
  const upperBounds = guesses.map(g => g.max).sort((a, b) => a - b);
  const midIdx = Math.floor(data.length / 2);

  const avgMin = data.length % 2 === 0
    ? (lowerBounds[midIdx - 1] + lowerBounds[midIdx]) / 2
    : lowerBounds[midIdx];

  const avgMax = data.length % 2 === 0
    ? (upperBounds[midIdx - 1] + upperBounds[midIdx]) / 2
    : upperBounds[midIdx];

  // Check if average bounds would capture the true value
  const avgHit = trueValue >= avgMin && trueValue <= avgMax;

  // Calculate hit rate from captured column
  const hitCount = data.filter(r => r.captured).length;
  const hitRate = hitCount / data.length;

  return {
    guesses,
    avgMin,
    avgMax,
    avgHit,
    hitRate,
    totalResponses: data.length,
  };
}

import { supabase } from './supabase.js';
import type { TodayLeaderboardEntry } from '../types/index.js';

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
  const totalQuestionsAnswered = user.games_played * 3 + sessionData.questionsAnswered; // Assuming 3 questions per game
  const newCalibrationRate = totalQuestionsAnswered > 0
    ? newQuestionsCaptured / totalQuestionsAnswered
    : 0;
  const newAverageScore = newGamesPlayed > 0 ? newTotalScore / newGamesPlayed : 0;

  // Check for best single score
  const newBestSingleScore = Math.max(Number(user.best_single_score), sessionData.sessionScore);

  // Update streak - if they got all questions right (captured >= 2 out of 3), maintain/increase streak
  // Otherwise reset streak
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
 * Get top scorers for specific questions answered today
 * Returns the highest score and username for each question
 */
export async function getQuestionTopScorers(
  questionIds: string[]
): Promise<Map<string, { highestScore: number; highestScoreUsername: string }>> {
  const todayStart = getUTCDayStart();
  const result = new Map<string, { highestScore: number; highestScoreUsername: string }>();

  if (questionIds.length === 0) {
    return result;
  }

  // Query user_responses joined with users to get top scorer per question for today
  const { data, error } = await supabase
    .from('user_responses')
    .select(`
      question_id,
      score,
      users!fk_user_responses_user(display_name)
    `)
    .in('question_id', questionIds)
    .gte('answered_at', todayStart)
    .order('score', { ascending: false });

  if (error) {
    console.error('Failed to fetch question top scorers:', error);
    return result;
  }

  if (!data || data.length === 0) {
    return result;
  }

  // Group by question_id and take the highest score for each
  for (const row of data) {
    const questionId = row.question_id;
    if (!result.has(questionId)) {
      const displayName = (row.users as any)?.display_name || 'Anonymous';
      result.set(questionId, {
        highestScore: Number(row.score),
        highestScoreUsername: displayName,
      });
    }
  }

  return result;
}

/**
 * Get daily stats for a user - rank, top score, average, calibration, leaderboard
 * calibrationToday is cumulative (all-time) for robust measurement
 */
export async function getDailyStats(userId: string): Promise<{
  dailyRank: number | null;
  topScoreToday: number | null;
  todaysAverage: number | null;
  userScoreToday: number | null;
  calibrationToday: number | null;
  totalParticipantsToday: number;
  todayLeaderboard?: TodayLeaderboardEntry[];
}> {
  const todayStart = getUTCDayStart();

  // Get all users' daily scores for today
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

  // Aggregate scores by user
  const userAggregates: Map<string, { totalScore: number; captured: number; total: number }> = new Map();

  for (const response of dailyScores) {
    const current = userAggregates.get(response.user_id) || { totalScore: 0, captured: 0, total: 0 };
    current.totalScore += Number(response.score);
    current.captured += response.captured ? 1 : 0;
    current.total += 1;
    userAggregates.set(response.user_id, current);
  }

  // Convert to array and sort by score
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

  // Find current user's stats
  const userRankIndex = sortedUsers.findIndex(u => u.userId === userId);
  const userStats = sortedUsers.find(u => u.userId === userId);

  // Build today's leaderboard (top 5) with usernames
  let todayLeaderboard: TodayLeaderboardEntry[] | undefined;
  const top5UserIds = sortedUsers.slice(0, 5).map(u => u.userId);

  if (top5UserIds.length > 0) {
    const { data: userNames, error: userNamesError } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', top5UserIds);

    if (!userNamesError && userNames) {
      const userNameMap = new Map(userNames.map(u => [u.id, u.display_name]));
      todayLeaderboard = sortedUsers.slice(0, 5).map((user, index) => ({
        rank: index + 1,
        username: userNameMap.get(user.userId) || 'Anonymous',
        score: Math.round(user.totalScore),
        isCurrentUser: user.userId === userId,
      }));
    }
  }

  return {
    dailyRank: userRankIndex >= 0 ? userRankIndex + 1 : null,
    topScoreToday: topScore,
    todaysAverage: averageScore,
    userScoreToday: userStats?.totalScore ?? null,
    calibrationToday: cumulativeCalibration,
    totalParticipantsToday: totalParticipants,
    todayLeaderboard,
  };
}

/**
 * Get performance history for the user's last N plays (days they actually played)
 * Calibration is shown as cumulative (all-time) up to each day for robust measurement
 */
export async function getPerformanceHistory(
  userId: string,
  plays: number = 10
): Promise<Array<{
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}>> {
  const dayNames = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

  // Fetch ALL responses for this user to find days they played and calculate calibration
  const { data: allUserResponses, error: allUserError } = await supabase
    .from('user_responses')
    .select('score, captured, answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: true });

  if (allUserError) {
    console.error('Failed to fetch user responses:', allUserError);
    return [];
  }

  if (!allUserResponses || allUserResponses.length === 0) {
    return [];
  }

  // Group user's responses by date and calculate cumulative calibration
  const userDayStats: Map<string, { score: number; captured: number; total: number; cumulativeCaptured: number; cumulativeTotal: number }> = new Map();
  let runningCaptured = 0;
  let runningTotal = 0;

  for (const response of allUserResponses) {
    const dateStr = getUTCDateString(new Date(response.answered_at));
    runningCaptured += response.captured ? 1 : 0;
    runningTotal += 1;

    const existing = userDayStats.get(dateStr) || { score: 0, captured: 0, total: 0, cumulativeCaptured: 0, cumulativeTotal: 0 };
    existing.score += Number(response.score);
    existing.captured += response.captured ? 1 : 0;
    existing.total += 1;
    existing.cumulativeCaptured = runningCaptured;
    existing.cumulativeTotal = runningTotal;
    userDayStats.set(dateStr, existing);
  }

  // Get the last N days the user actually played
  const playedDates = Array.from(userDayStats.keys()).slice(-plays);

  if (playedDates.length === 0) {
    return [];
  }

  // Fetch all responses for those dates to calculate average scores
  const { data: allResponses, error: allError } = await supabase
    .from('user_responses')
    .select('user_id, score, answered_at')
    .gte('answered_at', `${playedDates[0]}T00:00:00.000Z`)
    .lte('answered_at', `${playedDates[playedDates.length - 1]}T23:59:59.999Z`);

  if (allError) {
    console.error('Failed to fetch all responses for avg calculation:', allError);
    return [];
  }

  // Build daily stats for all users (for avgScore calculation)
  const dateAllUserStats: Map<string, Map<string, number>> = new Map();

  for (const response of allResponses || []) {
    const dateStr = getUTCDateString(new Date(response.answered_at));

    if (!dateAllUserStats.has(dateStr)) {
      dateAllUserStats.set(dateStr, new Map());
    }

    const dayStats = dateAllUserStats.get(dateStr)!;
    const currentScore = dayStats.get(response.user_id) || 0;
    dayStats.set(response.user_id, currentScore + Number(response.score));
  }

  // Build result for each day the user played
  const result: Array<{
    date: string;
    day: string;
    userScore: number;
    avgScore: number;
    calibration: number;
  }> = [];

  for (const dateStr of playedDates) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const dayOfWeek = date.getUTCDay();

    const userStats = userDayStats.get(dateStr)!;
    const cumulativeCalibration = userStats.cumulativeTotal > 0
      ? (userStats.cumulativeCaptured / userStats.cumulativeTotal) * 100
      : 0;

    // Calculate average score across all users for this day
    const dayAllUsers = dateAllUserStats.get(dateStr);
    let avgScore = 0;
    if (dayAllUsers && dayAllUsers.size > 0) {
      const allScores = Array.from(dayAllUsers.values());
      avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    }

    result.push({
      date: dateStr,
      day: dayNames[dayOfWeek],
      userScore: userStats.score,
      avgScore,
      calibration: cumulativeCalibration,
    });
  }

  return result;
}

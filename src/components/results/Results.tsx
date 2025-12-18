import { ResultsCarousel } from './ResultsCarousel';

interface CrowdGuess {
  min: number;
  max: number;
}

interface CrowdData {
  guesses: CrowdGuess[];
  avgMin: number;
  avgMax: number;
  avgHit: boolean;
  hitRate: number;
  totalResponses: number;
}

interface Judgement {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  source?: string;
  sourceUrl?: string;
  answerContext?: string;
  communityStats?: {
    averageScore: number;
    highestScore: number;
    highestScoreUsername?: string;
  };
  crowdData?: CrowdData;
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface CalibrationMilestone {
  date: string;
  label: string;
  calibration: number;
}

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

interface OverallLeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

interface OverallStanding {
  percentile: number;
  totalPlayers: number;
}

interface ResultsProps {
  judgements: Judgement[];
  score: number;
  onRestart: () => void;
  dailyRank?: number;
  topScoreGlobal?: number;
  averageScore?: number;
  dailyAverageScore?: number;
  calibration?: number;
  performanceHistory?: PerformanceHistoryEntry[];
  calibrationMilestones?: CalibrationMilestone[];
  totalParticipants?: number;
  todayLeaderboard?: TodayLeaderboardEntry[];
  overallLeaderboard?: OverallLeaderboardEntry[];
  overallStanding?: OverallStanding;
  onScroll?: (progress: number) => void;
}

export function Results({
  judgements,
  score,
  dailyRank,
  calibration,
  performanceHistory,
  calibrationMilestones,
  totalParticipants,
  topScoreGlobal,
  todayLeaderboard,
  overallLeaderboard,
  overallStanding,
  onScroll,
}: ResultsProps) {
  return (
    <ResultsCarousel
      judgements={judgements}
      score={score}
      calibration={calibration}
      dailyRank={dailyRank}
      totalParticipants={totalParticipants}
      topScoreToday={topScoreGlobal}
      performanceHistory={performanceHistory}
      calibrationMilestones={calibrationMilestones}
      todayLeaderboard={todayLeaderboard}
      overallLeaderboard={overallLeaderboard}
      overallStanding={overallStanding}
      onScroll={onScroll}
    />
  );
}

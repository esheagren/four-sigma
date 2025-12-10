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

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
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
  totalParticipants?: number;
  todayLeaderboard?: TodayLeaderboardEntry[];
}

export function Results({
  judgements,
  score,
  dailyRank,
  calibration,
  performanceHistory,
  totalParticipants,
  topScoreGlobal,
  todayLeaderboard,
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
      todayLeaderboard={todayLeaderboard}
    />
  );
}

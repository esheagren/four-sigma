import { forwardRef } from 'react';

interface OverallLeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

interface DailyStatsSlideProps {
  overallLeaderboard?: OverallLeaderboardEntry[];
}

export const DailyStatsSlide = forwardRef<HTMLDivElement, DailyStatsSlideProps>(({
  overallLeaderboard,
}, ref) => {
  return (
    <div className="tiktok-slide daily-stats-slide" ref={ref}>
      <div className="slide-body">
        <div className="daily-stats-content">

        {/* Overall Leaderboard (Top 10 by total points) */}
        <div className="today-leaderboard">
          <div className="today-leaderboard-header">Overall Leaderboard</div>
          {overallLeaderboard && overallLeaderboard.length > 0 ? (
            <div className="today-leaderboard-list">
              {overallLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`leaderboard-entry ${entry.isCurrentUser ? 'is-current-user' : ''}`}
                >
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span className="leaderboard-username">{entry.displayName}</span>
                  <span className="leaderboard-score">{entry.totalScore.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="leaderboard-empty">
              Play more games to see the leaderboard!
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="slide-scroll-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        </div>
      </div>
    </div>
  );
});

DailyStatsSlide.displayName = 'DailyStatsSlide';

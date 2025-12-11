import { forwardRef } from 'react';

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

interface DailyStatsSlideProps {
  todayLeaderboard?: TodayLeaderboardEntry[];
}

export const DailyStatsSlide = forwardRef<HTMLDivElement, DailyStatsSlideProps>(({
  todayLeaderboard,
}, ref) => {
  return (
    <div className="tiktok-slide daily-stats-slide" ref={ref}>
      <div className="slide-body">
        <div className="daily-stats-content">

        {/* Today's Leaderboard (Top 5) */}
        {todayLeaderboard && todayLeaderboard.length > 0 && (
          <div className="today-leaderboard">
            <div className="today-leaderboard-header">Today's Leaderboard</div>
            <div className="today-leaderboard-list">
              {todayLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`leaderboard-entry ${entry.isCurrentUser ? 'is-current-user' : ''}`}
                >
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span className="leaderboard-username">{entry.username}</span>
                  <span className="leaderboard-score">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

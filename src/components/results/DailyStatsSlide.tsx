import { forwardRef, useRef, useState } from 'react';
import { ShareLeaderboardCard, type ShareLeaderboardCardRef } from './ShareLeaderboardCard';

interface OverallLeaderboardEntry {
  rank: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

interface OverallStanding {
  percentile: number;
  totalPlayers: number;
}

interface DailyStatsSlideProps {
  overallLeaderboard?: OverallLeaderboardEntry[];
  overallStanding?: OverallStanding;
  username: string;
}

function getStandingDisplay(percentile: number): {
  message: string;
  emphasis: 'high' | 'medium' | 'low';
} {
  if (percentile >= 99) {
    return { message: "You're literally a top player!", emphasis: 'high' };
  } else if (percentile >= 95) {
    return { message: "Elite calibration skills!", emphasis: 'high' };
  } else if (percentile >= 90) {
    return { message: "Excellent standing!", emphasis: 'high' };
  } else if (percentile >= 80) {
    return { message: "Great work!", emphasis: 'medium' };
  } else if (percentile >= 70) {
    return { message: "Solid performance!", emphasis: 'medium' };
  } else if (percentile >= 50) {
    return { message: "You're in the top half!", emphasis: 'medium' };
  } else {
    return { message: "Every game improves your standing!", emphasis: 'low' };
  }
}

export const DailyStatsSlide = forwardRef<HTMLDivElement, DailyStatsSlideProps>(({
  overallLeaderboard,
  overallStanding,
  username,
}, ref) => {
  const shareCardRef = useRef<ShareLeaderboardCardRef>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!shareCardRef.current || !overallStanding) return;

    setIsSharing(true);

    try {
      const blob = await shareCardRef.current.generateImage();
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      // Try native share first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '4sigma-standing.png', { type: 'image/png' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      } catch {
        // Final fallback: Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '4sigma-standing.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const topPercent = overallStanding ? 100 - overallStanding.percentile : null;
  const standingDisplay = overallStanding ? getStandingDisplay(overallStanding.percentile) : null;

  return (
    <div className="tiktok-slide daily-stats-slide" ref={ref}>
      <div className="slide-body">
        <div className="daily-stats-content">

        {/* Your Standing Section */}
        {overallStanding && standingDisplay && (
          <div className="your-standing-section">
            <div className="your-standing-header">Your Standing</div>
            <div className="your-standing-content">
              <div className={`standing-percentile emphasis-${standingDisplay.emphasis}`}>
                Top {topPercent}%
              </div>
              <div className="standing-message">
                {standingDisplay.message}
              </div>
              <div className="standing-context">
                of {overallStanding.totalPlayers.toLocaleString()} players
              </div>
              <button
                className="standing-share-button"
                onClick={handleShare}
                disabled={isSharing}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                {isSharing ? 'Sharing...' : 'Share Your Standing'}
              </button>
            </div>
          </div>
        )}

        {/* Overall Leaderboard (Top 5 by best single-day score) */}
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
                  <span className="leaderboard-username">{entry.username}</span>
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

      {/* Hidden share card for image generation */}
      {overallStanding && (
        <ShareLeaderboardCard
          ref={shareCardRef}
          percentile={overallStanding.percentile}
          totalPlayers={overallStanding.totalPlayers}
          username={username}
        />
      )}
    </div>
  );
});

DailyStatsSlide.displayName = 'DailyStatsSlide';

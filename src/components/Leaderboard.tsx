import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  sessionId: string;
  score: number;
  timestamp: string;
}

interface LeaderboardProps {
  userScore: number;
}

export function Leaderboard({ userScore }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/session/leaderboard?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <div className="leaderboard-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <div className="leaderboard-error">{error}</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <div className="leaderboard-empty">No scores yet. Be the first!</div>
      </div>
    );
  }

  // Find user's rank based on their score (most recent entry with matching score)
  const sortedByTime = [...leaderboard].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const mostRecentEntry = sortedByTime[0];
  const userRank = mostRecentEntry && Math.abs(mostRecentEntry.score - userScore) < 0.01
    ? leaderboard.findIndex(entry => entry.sessionId === mostRecentEntry.sessionId) + 1
    : 0;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        {userRank > 0 && (
          <div className="user-rank-badge">
            You're #{userRank}
          </div>
        )}
      </div>
      
      <div className="leaderboard-list">
        {leaderboard.slice(0, 10).map((entry, index) => {
          const isUserScore = index === userRank - 1;
          
          return (
            <div 
              key={entry.sessionId} 
              className={`leaderboard-entry ${isUserScore ? 'user-entry' : ''}`}
            >
              <div className="leaderboard-rank">
                <span className={`rank-number ${index < 3 ? `rank-${index + 1}` : ''}`}>
                  #{index + 1}
                </span>
              </div>
              <div className="leaderboard-score">
                {entry.score.toFixed(2)}
              </div>
              <div className="leaderboard-time">
                {isUserScore ? '👈 You' : formatTimeAgo(entry.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


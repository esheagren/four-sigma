import { useEffect, useState } from 'react';

interface OverallEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: string;
}

interface BestGuessEntry {
  rank: number;
  displayName: string;
  score: number;
  questionText: string;
  answeredAt: string;
}

export function DualLeaderboard() {
  const [activeTab, setActiveTab] = useState<'overall' | 'bestGuesses'>('overall');
  const [overallLeaderboard, setOverallLeaderboard] = useState<OverallEntry[]>([]);
  const [bestGuessesLeaderboard, setBestGuessesLeaderboard] = useState<BestGuessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overallRes, bestGuessesRes] = await Promise.all([
        fetch('/api/session/leaderboard/overall'),
        fetch('/api/session/leaderboard/best-guesses'),
      ]);

      if (!overallRes.ok || !bestGuessesRes.ok) {
        throw new Error('Failed to fetch leaderboards');
      }

      const overallData = await overallRes.json();
      const bestGuessesData = await bestGuessesRes.json();

      setOverallLeaderboard(overallData.leaderboard || []);
      setBestGuessesLeaderboard(bestGuessesData.leaderboard || []);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Failed to load leaderboards');
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

  const truncateQuestion = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="dual-leaderboard">
        <div className="leaderboard-tabs">
          <button className="leaderboard-tab active">Overall</button>
          <button className="leaderboard-tab">Best Guesses</button>
        </div>
        <div className="leaderboard-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dual-leaderboard">
        <div className="leaderboard-tabs">
          <button className="leaderboard-tab active">Overall</button>
          <button className="leaderboard-tab">Best Guesses</button>
        </div>
        <div className="leaderboard-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dual-leaderboard">
      <div className="leaderboard-tabs">
        <button
          className={`leaderboard-tab ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Overall Score
        </button>
        <button
          className={`leaderboard-tab ${activeTab === 'bestGuesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('bestGuesses')}
        >
          Best Guesses
        </button>
      </div>

      {activeTab === 'overall' ? (
        <div className="leaderboard-list">
          {overallLeaderboard.length === 0 ? (
            <div className="leaderboard-empty">No scores yet. Be the first!</div>
          ) : (
            overallLeaderboard.map((entry) => (
              <div key={`overall-${entry.rank}`} className="leaderboard-entry">
                <div className="leaderboard-rank">
                  <span className={`rank-number ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                    #{entry.rank}
                  </span>
                </div>
                <div className="leaderboard-name">{entry.displayName}</div>
                <div className="leaderboard-score">{entry.totalScore.toLocaleString()}</div>
                <div className="leaderboard-meta">{entry.gamesPlayed} games</div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="leaderboard-list">
          {bestGuessesLeaderboard.length === 0 ? (
            <div className="leaderboard-empty">No guesses yet. Be the first!</div>
          ) : (
            bestGuessesLeaderboard.map((entry) => (
              <div key={`guess-${entry.rank}`} className="leaderboard-entry leaderboard-entry-guess">
                <div className="leaderboard-rank">
                  <span className={`rank-number ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                    #{entry.rank}
                  </span>
                </div>
                <div className="leaderboard-guess-info">
                  <div className="leaderboard-name">{entry.displayName}</div>
                  <div className="leaderboard-question" title={entry.questionText}>
                    {truncateQuestion(entry.questionText)}
                  </div>
                </div>
                <div className="leaderboard-score">{entry.score.toLocaleString()}</div>
                <div className="leaderboard-meta">{formatTimeAgo(entry.answeredAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PerformanceChart } from './PerformanceChart';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PerformanceHistoryEntry {
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

export function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const { user, authToken } = useAuth();
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistoryEntry[] | undefined>();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchPerformanceHistory();
    }
  }, [isOpen, user]);

  async function fetchPerformanceHistory() {
    setIsLoadingHistory(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/user/performance-history?days=7', {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch performance history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  if (!isOpen) return null;

  const stats = [
    { label: 'Games Played', value: user?.gamesPlayed ?? 0 },
    { label: 'Average Score', value: Math.round(user?.averageScore ?? 0).toLocaleString() },
    { label: 'Best Score', value: (user?.bestSingleScore ?? 0).toLocaleString() },
    { label: 'Calibration Rate', value: `${Math.round((user?.calibrationRate ?? 0) * 100)}%` },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Statistics</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="statistics-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="statistics-chart-section">
            <h3 className="statistics-section-title">7-Day Performance</h3>
            {isLoadingHistory ? (
              <div className="statistics-chart-loading">Loading...</div>
            ) : (
              <PerformanceChart performanceHistory={performanceHistory} />
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

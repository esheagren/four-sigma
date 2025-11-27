import { useAuth } from '../context/AuthContext';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const { user } = useAuth();

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

        </div>

        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

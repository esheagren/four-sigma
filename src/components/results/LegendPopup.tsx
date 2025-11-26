interface LegendPopupProps {
  onClose: () => void;
}

export function LegendPopup({ onClose }: LegendPopupProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content legend-popup" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Understanding the Graph</h2>
        </div>
        <div className="modal-body">
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-icon legend-icon-user-hit">
                <svg viewBox="0 0 40 20">
                  <path d="M 2 18 Q 20 4 38 18" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <circle cx="2" cy="18" r="3" fill="white" stroke="#10b981" strokeWidth="2" />
                  <circle cx="38" cy="18" r="3" fill="white" stroke="#10b981" strokeWidth="2" />
                </svg>
              </div>
              <div className="legend-text">
                <strong>Your Interval (Hit)</strong>
                <p>Green curve shows your confidence range when the answer falls within your bounds.</p>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-icon legend-icon-user-miss">
                <svg viewBox="0 0 40 20">
                  <path d="M 2 18 Q 20 4 38 18" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                  <circle cx="2" cy="18" r="3" fill="white" stroke="#f43f5e" strokeWidth="2" />
                  <circle cx="38" cy="18" r="3" fill="white" stroke="#f43f5e" strokeWidth="2" />
                </svg>
              </div>
              <div className="legend-text">
                <strong>Your Interval (Miss)</strong>
                <p>Red curve shows your confidence range when the answer falls outside your bounds.</p>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-icon legend-icon-avg">
                <svg viewBox="0 0 40 20">
                  <path d="M 4 18 Q 20 6 36 18" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                  <polygon points="4,15 7,18 4,21 1,18" fill="#94a3b8" />
                  <polygon points="36,15 39,18 36,21 33,18" fill="#94a3b8" />
                </svg>
              </div>
              <div className="legend-text">
                <strong>Average Player</strong>
                <p>Silver curve shows the median confidence interval across all players.</p>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-icon legend-icon-answer">
                <svg viewBox="0 0 40 20">
                  <line x1="0" y1="18" x2="40" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <circle cx="20" cy="18" r="5" fill="#38bdf8" />
                </svg>
              </div>
              <div className="legend-text">
                <strong>True Answer</strong>
                <p>Blue dot marks where the actual answer falls on the number line.</p>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-icon legend-icon-crowd">
                <svg viewBox="0 0 40 20">
                  <path d="M 2 18 Q 12 8 22 18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <path d="M 8 18 Q 20 4 32 18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <path d="M 18 18 Q 28 10 38 18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                </svg>
              </div>
              <div className="legend-text">
                <strong>Crowd Guesses</strong>
                <p>Ghostly curves show other players' confidence intervals. Taller peaks = narrower guesses.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

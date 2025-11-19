import { useState } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Import scoring function
function calculateScore(lower: number, upper: number, answer: number): number {
  const inBounds = (l: number, u: number, a: number) => a >= l && a <= u;

  if (!inBounds(lower, upper, answer)) {
    return 0;
  }

  const buffer = 0.05;
  if (Math.abs(lower - answer) < buffer && Math.abs(upper - answer) < buffer) {
    return computeScore(lower * (1 - buffer), upper * (1 + buffer), answer) * 3;
  }

  return computeScore(lower, upper, answer);
}

function computeScore(lower: number, upper: number, answer: number): number {
  const lowerLog = Math.log10(Math.abs(lower) + 1);
  const upperLog = Math.log10(Math.abs(upper) + 1);
  const answerLog = Math.log10(Math.abs(answer) + 1);

  const upperLogMinusLowerLog = upperLog - lowerLog;
  const answerLogMinusLowerLog = answerLog - lowerLog;

  const score = Math.sqrt(
    upperLogMinusLowerLog / 4 +
    2 * Math.pow(upperLogMinusLowerLog - 2 * answerLogMinusLowerLog, 2)
  );

  return Math.max(0, 100 - score * 10);
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const [activeTab, setActiveTab] = useState<'how-to' | 'scoring'>('how-to');

  if (!isOpen) return null;

  // Example scoring scenarios
  const trueValue = 8849; // Mount Everest height
  const examples = [
    { lower: 2000, upper: 15000, label: 'Very wide range', color: '#ff6b6b' },
    { lower: 5000, upper: 12000, label: 'Medium range', color: '#ffa500' },
    { lower: 8700, upper: 9000, label: 'Narrow range', color: '#4ecdc4' },
  ];

  const scaleMin = 0;
  const scaleMax = 16000;
  const scaleRange = scaleMax - scaleMin;

  const examplesWithScores = examples.map(ex => ({
    ...ex,
    score: calculateScore(ex.lower, ex.upper, trueValue).toFixed(1),
    width: ((ex.upper - ex.lower) / scaleRange) * 100,
    offset: ((ex.lower - scaleMin) / scaleRange) * 100,
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tabs">
            <button
              className={`modal-tab ${activeTab === 'how-to' ? 'modal-tab-active' : ''}`}
              onClick={() => setActiveTab('how-to')}
            >
              How to Play
            </button>
            <button
              className={`modal-tab ${activeTab === 'scoring' ? 'modal-tab-active' : ''}`}
              onClick={() => setActiveTab('scoring')}
            >
              Scoring
            </button>
          </div>
        </div>

        <div className="modal-body">
          {activeTab === 'how-to' ? (
            <>
              <p className="modal-intro">
                <strong>4-σ</strong> is a daily calibration training game that teaches you to think accurately about uncertainty.
              </p>

              <div className="how-to-section">
                <h3>The Challenge</h3>
                <p>
                  For each question, provide a <strong>95% confidence interval</strong> — a range where you're 95% confident the true answer lies.
                </p>
              </div>

              <div className="how-to-section">
                <h3>Scoring</h3>
                <ul>
                  <li><strong>Hit:</strong> True value falls within your range — you score points!</li>
                  <li><strong>Miss:</strong> True value is outside your range — you score 0 points</li>
                  <li><strong>Precision Bonus:</strong> Narrower correct ranges earn more points</li>
                </ul>
              </div>

              <div className="how-to-section">
                <h3>The Goal</h3>
                <p>
                  Most people are overconfident and hit less than 95% of questions. Train yourself to be properly calibrated by hitting close to 95% over time while keeping your ranges as narrow as possible.
                </p>
              </div>

              <div className="how-to-section">
                <h3>Daily Play</h3>
                <p>
                  Answer 3 questions each day. Everyone gets the same questions, so you can compare your performance on the leaderboard.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="modal-intro">
                The scoring algorithm rewards <strong>narrow, accurate ranges</strong> using logarithmic scaling.
              </p>

              <div className="how-to-section">
                <h3>Key Principles</h3>
                <ul>
                  <li><strong>Hits vs Misses:</strong> True value must fall within your range to score</li>
                  <li><strong>Narrower is Better:</strong> Smaller correct ranges earn exponentially more points</li>
                  <li><strong>Scale Matters:</strong> Scoring is proportional to the magnitude of the answer</li>
                  <li><strong>Logarithmic:</strong> Ranges are compared on a log scale for fairness across magnitudes</li>
                </ul>
              </div>

              <div className="how-to-section">
                <h3>Example: Height of Mount Everest (8,849m)</h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.9375rem', color: 'var(--text-tertiary)' }}>
                  Compare three different ranges that all contain the true value:
                </p>

                <div className="scoring-visual">
                  <div className="scoring-scale">
                    <div className="scoring-ranges">
                      {examplesWithScores.map((ex, i) => {
                        const lowerPercent = ex.offset;
                        const upperPercent = ex.offset + ex.width;
                        const trueValuePercent = ((trueValue - scaleMin) / scaleRange) * 100;

                        return (
                          <div key={i} className="scoring-range-row">
                            <div className="scoring-range-label-left">
                              Guess {i + 1}
                            </div>
                            <div className="scoring-range-visualization">
                              <div className="scoring-range-line" />

                              {/* Span between dots */}
                              <div
                                className="scoring-range-span"
                                style={{
                                  left: `${lowerPercent}%`,
                                  width: `${ex.width}%`,
                                  background: ex.color,
                                }}
                              />

                              {/* True value marker */}
                              <div
                                className="scoring-true-answer-marker"
                                style={{ left: `${trueValuePercent}%` }}
                              >
                                <div className="scoring-true-answer-dot" />
                              </div>

                              {/* Lower bound */}
                              <div
                                className="scoring-range-bound"
                                style={{ left: `${lowerPercent}%` }}
                              >
                                <div
                                  className="scoring-range-bound-dot"
                                  style={{ background: ex.color }}
                                />
                                <div
                                  className="scoring-range-bound-label"
                                  style={{ background: ex.color }}
                                >
                                  {ex.lower.toLocaleString()}
                                </div>
                              </div>

                              {/* Upper bound */}
                              <div
                                className="scoring-range-bound"
                                style={{ left: `${upperPercent}%` }}
                              >
                                <div
                                  className="scoring-range-bound-dot"
                                  style={{ background: ex.color }}
                                />
                                <div
                                  className="scoring-range-bound-label"
                                  style={{ background: ex.color }}
                                >
                                  {ex.upper.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="scoring-range-score" style={{ color: ex.color }}>
                              {ex.score} pts
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="scoring-explanation">
                  <p>
                    Notice how the <span style={{ color: '#4ecdc4', fontWeight: 600 }}>narrow range</span> (8,700-9,000)
                    earns dramatically more points than the <span style={{ color: '#ff6b6b', fontWeight: 600 }}>very wide range</span> (2,000-15,000),
                    even though both contain the answer. The narrow range scores {examplesWithScores[2].score} points while the wide range scores only {examplesWithScores[0].score} points — a {Math.round((parseFloat(examplesWithScores[2].score) / parseFloat(examplesWithScores[0].score)) * 10) / 10}x difference!
                  </p>
                </div>
              </div>

              <div className="how-to-section">
                <h3>Why Logarithmic?</h3>
                <p>
                  A ±100 range is impressive for small numbers (e.g., 100-300 for 200) but trivial for large numbers (e.g., 999,900-1,000,100 for 1 million).
                  Logarithmic scoring ensures fairness across all magnitudes.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
}

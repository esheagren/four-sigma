import { useState } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Scoring function matching server-side algorithm
function calculateScore(lower: number, upper: number, answer: number): number {
  // Check if answer is within bounds
  if (lower > answer || upper < answer) {
    return 0; // Miss scores zero
  }

  // Handle exact guess
  if (lower === upper && lower === answer) {
    return 10000;
  }

  // Handle edge case where bounds are equal but not exact
  if (lower === upper) {
    const buffer = Math.max(0.01, Math.abs(lower) * 0.01);
    lower = lower - buffer;
    upper = upper + buffer;
  }

  // Calculate score
  const BASE_SCORE = 50;
  const PRECISION_EXPONENT = 0.7;

  const intervalWidth = Math.abs(upper - lower);
  const answerMagnitude = Math.max(1, Math.abs(answer));
  const relativeWidth = intervalWidth / answerMagnitude;
  const precisionMultiplier = 1 / Math.pow(relativeWidth, PRECISION_EXPONENT);
  const score = BASE_SCORE * precisionMultiplier;

  return Math.round(score * 10) / 10;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  // Example scoring scenarios
  const trueValue = 8849; // Mount Everest height
  const examples = [
    { lower: 2000, upper: 15000, label: 'Very wide range', color: '#ff6b6b' },
    { lower: 5000, upper: 12000, label: 'Medium range', color: '#ffa500' },
    { lower: 8700, upper: 9000, label: 'Narrow range', color: '#4ecdc4' },
    { lower: 9500, upper: 12000, label: 'Miss (too high)', color: '#df1b41' },
  ];

  const scaleMin = 0;
  const scaleMax = 16000;
  const scaleRange = scaleMax - scaleMin;

  const examplesWithScores = examples.map(ex => ({
    ...ex,
    score: Math.round(calculateScore(ex.lower, ex.upper, trueValue)),
    width: ((ex.upper - ex.lower) / scaleRange) * 100,
    offset: ((ex.lower - scaleMin) / scaleRange) * 100,
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">4-σ</h2>
          <p className="modal-subtitle">Daily Quant Game | 3 Questions | Answers are 95% Confidence Intervals</p>
        </div>

        <div className="modal-body">
          <>
              <p className="modal-intro">
                The purpose of 4-σ is to estimate the numerical quantity of various things.
              </p>

              <div className="how-to-section">
                <h3>Answers</h3>
                <p className="modal-intro">
                  Answers are given with two numbers, an Upper Bound and a Lower Bound, such that you are 95% sure the true answer lies somewhere between the bounds you gave.
                </p>

                <div className="answer-visual">
                  <div className="answer-diagram">
                    <div className="answer-question-example">
                      Height of Mount Everest
                    </div>
                    <div className="answer-unit-example">
                      Unit: <span className="unit-value">meters</span>
                    </div>
                    <div className="answer-bounds">
                      <div className="answer-bound-container">
                        <div className="answer-bound-label">Lower Bound</div>
                        <div className="answer-input-demo">0</div>
                      </div>
                      <span className="answer-to">to</span>
                      <div className="answer-bound-container">
                        <div className="answer-bound-label">Upper Bound</div>
                        <div className="answer-input-demo">0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="how-to-section">
                <h3>Scoring</h3>
                <p className="modal-intro">
                  Scoring works as follows: If the upper and lower bound you submit contains the true answer, you will get more points the narrower your range. However, if the true answer is outside the bound you gave, you will get no points for that question.
                </p>

                <div className="scoring-visual">
                  <p className="scoring-example-label">
                    Example: Height of Mount Everest (8,849m)
                  </p>
                  <div className="scoring-scale">
                    {/* Correct answer marker */}
                    <div className="correct-answer-indicator" style={{ left: `${((trueValue - scaleMin) / scaleRange) * 100}%` }}>
                      <div className="correct-answer-line"></div>
                    </div>

                    <div className="scoring-ranges">
                      <div className="scoring-range-row scoring-header-row">
                        <div className="scoring-range-label-left">Guesses</div>
                        <div className="scoring-range-visualization"></div>
                        <div className="scoring-range-score" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Points
                        </div>
                      </div>
                      {examplesWithScores.map((ex, i) => {
                        const lowerPercent = ex.offset;
                        const upperPercent = ex.offset + ex.width;
                        const trueValuePercent = ((trueValue - scaleMin) / scaleRange) * 100;

                        return (
                          <div key={i} className="scoring-range-row">
                            <div className="scoring-range-label-left">
                              {i + 1}
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
                                className="scoring-range-bound scoring-range-bound-lower"
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
                                className="scoring-range-bound scoring-range-bound-upper"
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
                              {ex.score}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="how-to-section">
                <h3>Daily Play</h3>
                <p>
                  Answer 3 questions each day. Everyone gets the same questions, so you can compare your performance on the leaderboard.
                </p>
              </div>
            </>
        </div>

        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
}

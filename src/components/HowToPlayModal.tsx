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
  ];
  const missExample = { lower: 9500, upper: 12000, label: 'Miss (too high)', color: '#df1b41' };
  const wideExample = { lower: 1, upper: 100000000, trueValue: 30, color: '#9ca3af' };

  const scaleMin = 0;
  const scaleMax = 20000;
  const scaleRange = scaleMax - scaleMin;

  const examplesWithScores = examples.map(ex => ({
    ...ex,
    score: Math.round(calculateScore(ex.lower, ex.upper, trueValue)),
    width: ((ex.upper - ex.lower) / scaleRange) * 100,
    offset: ((ex.lower - scaleMin) / scaleRange) * 100,
  }));

  const missWithScore = {
    ...missExample,
    score: Math.round(calculateScore(missExample.lower, missExample.upper, trueValue)),
    width: ((missExample.upper - missExample.lower) / scaleRange) * 100,
    offset: ((missExample.lower - scaleMin) / scaleRange) * 100,
  };
  const trueValuePercent = ((trueValue - scaleMin) / scaleRange) * 100;

  const wideWithScore = {
    ...wideExample,
    score: Math.round(calculateScore(wideExample.lower, wideExample.upper, wideExample.trueValue) * 10) / 10,
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-horizontal">
          <h2 className="modal-title">4-σ</h2>
          <div className="modal-subtitle-stack">
            <span>Daily Quant Game</span>
            <span>3 Questions</span>
            <span>95% Confidence Intervals</span>
          </div>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <>
              <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                The purpose of 4-σ is to estimate the numerical quantity of various things.
              </p>

              <div className="how-to-section">
                <h3>Answers</h3>
                <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                  Answers are given with two numbers, an <strong>Upper Bound</strong> and a <strong>Lower Bound</strong>, such that you are 95% sure the true answer lies somewhere between the bounds you gave.
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
                <p className="modal-intro" style={{ marginBottom: '1.5rem' }}>
                  If the upper and lower bound you submit contains the true answer, you will get more points the narrower your range.
                </p>

                <p className="scoring-example-label" style={{ marginBottom: '0' }}>
                  Example: Height of Mount Everest (8,849m)
                </p>

                <div className="scoring-visual">
                  <div className="scoring-scale">
                    {/* Correct answer marker */}
                    <div className="correct-answer-indicator" style={{ left: `${((trueValue - scaleMin) / scaleRange) * 100}%` }}>
                      <div className="correct-answer-line"></div>
                    </div>

                    <div className="scoring-ranges">
                      <div className="scoring-column-headers scoring-column-headers-no-label">
                        <span></span>
                        <span>Points</span>
                      </div>
                      {examplesWithScores.map((ex, i) => {
                        const lowerPercent = ex.offset;
                        const upperPercent = ex.offset + ex.width;
                        const trueValuePercent = ((trueValue - scaleMin) / scaleRange) * 100;

                        return (
                          <div key={i} className="scoring-range-row scoring-range-row-no-label">
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

                <p className="modal-intro" style={{ marginTop: '1.5rem' }}>
                  However, if the true answer is outside the bound you gave, you will get no points for that question.
                </p>

                <div className="scoring-visual" style={{ marginTop: '1rem' }}>
                  <div className="scoring-scale">
                    <div className="scoring-ranges">
                      <div className="scoring-range-row scoring-range-row-no-label">
                        <div className="scoring-range-visualization">
                          <div className="scoring-range-line" />
                          <div
                            className="scoring-range-span"
                            style={{
                              left: `${missWithScore.offset}%`,
                              width: `${missWithScore.width}%`,
                              background: missWithScore.color,
                            }}
                          />
                          <div
                            className="scoring-true-answer-marker"
                            style={{ left: `${trueValuePercent}%` }}
                          >
                            <div className="scoring-true-answer-dot" />
                          </div>
                          <div
                            className="scoring-range-bound scoring-range-bound-lower"
                            style={{ left: `${missWithScore.offset}%` }}
                          >
                            <div
                              className="scoring-range-bound-dot"
                              style={{ background: missWithScore.color }}
                            />
                            <div
                              className="scoring-range-bound-label"
                              style={{ background: missWithScore.color }}
                            >
                              {missWithScore.lower.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className="scoring-range-bound scoring-range-bound-upper"
                            style={{ left: `${missWithScore.offset + missWithScore.width}%` }}
                          >
                            <div
                              className="scoring-range-bound-dot"
                              style={{ background: missWithScore.color }}
                            />
                            <div
                              className="scoring-range-bound-label"
                              style={{ background: missWithScore.color }}
                            >
                              {missWithScore.upper.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="scoring-range-score" style={{ color: missWithScore.color }}>
                          {missWithScore.score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="modal-intro" style={{ marginTop: '1.5rem' }}>
                  As an interval becomes increasingly large relative to the answer, your score will approach zero.
                </p>

                <div className="scoring-visual" style={{ marginTop: '1rem' }}>
                  <div className="scoring-scale">
                    <div className="scoring-ranges">
                      <div className="scoring-range-row scoring-range-row-no-label">
                        <div className="scoring-range-visualization">
                          <div className="scoring-range-line" />
                          <div
                            className="scoring-range-span"
                            style={{
                              left: '0%',
                              width: '100%',
                              background: wideWithScore.color,
                            }}
                          />
                          <div
                            className="scoring-true-answer-marker"
                            style={{ left: `${((wideWithScore.trueValue - wideWithScore.lower) / (wideWithScore.upper - wideWithScore.lower)) * 100}%` }}
                          >
                            <div className="scoring-true-answer-dot" />
                          </div>
                          <div
                            className="scoring-range-bound scoring-range-bound-lower"
                            style={{ left: '0%' }}
                          >
                            <div
                              className="scoring-range-bound-dot"
                              style={{ background: wideWithScore.color }}
                            />
                            <div
                              className="scoring-range-bound-label"
                              style={{ background: wideWithScore.color }}
                            >
                              {wideWithScore.lower.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className="scoring-range-bound scoring-range-bound-upper"
                            style={{ left: '100%' }}
                          >
                            <div
                              className="scoring-range-bound-dot"
                              style={{ background: wideWithScore.color }}
                            />
                            <div
                              className="scoring-range-bound-label"
                              style={{ background: wideWithScore.color }}
                            >
                              {wideWithScore.upper.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="scoring-range-score" style={{ color: wideWithScore.color }}>
                          {wideWithScore.score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

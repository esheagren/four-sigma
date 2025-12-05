import { useState, useCallback, useRef } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interactive demo step type
type DemoStep = 'estimate' | 'uncertainty' | 'complete';

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
  // Interactive demo state
  const [demoStep, setDemoStep] = useState<DemoStep>('estimate');
  const [demoUncertainty, setDemoUncertainty] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Demo values
  const demoEstimate = 8849;
  const demoBounds = {
    lower: Math.round(demoEstimate * (1 - demoUncertainty / 100)),
    upper: Math.round(demoEstimate * (1 + demoUncertainty / 100)),
  };

  // Calculate uncertainty from pointer position
  const calculateUncertaintyFromPointer = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDemoUncertainty(Math.round(percentage));
  }, []);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (demoStep !== 'uncertainty') return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateUncertaintyFromPointer(e.clientX);
  }, [demoStep, calculateUncertaintyFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || demoStep !== 'uncertainty') return;
    calculateUncertaintyFromPointer(e.clientX);
  }, [demoStep, calculateUncertaintyFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    // If they've dragged to at least 5%, advance to complete step
    if (demoUncertainty >= 5) {
      setDemoStep('complete');
    }
  }, [demoUncertainty]);

  // Handle step 1 click (entering estimate)
  const handleEstimateClick = useCallback(() => {
    if (demoStep === 'estimate') {
      setDemoStep('uncertainty');
    }
  }, [demoStep]);

  // Reset demo
  const resetDemo = useCallback(() => {
    setDemoStep('estimate');
    setDemoUncertainty(0);
  }, []);

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
            <span>Estimate + Uncertainty</span>
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
                  For each question, you'll enter an estimate and set your uncertainty. Try it below!
                </p>

                <div className="answer-visual">
                  <div className="answer-diagram">
                    <div className="answer-question-example">
                      Height of Mount Everest
                    </div>
                    <div className="answer-unit-example">
                      Unit: <span className="unit-value">meters</span>
                    </div>

                    {/* Interactive stepped demo */}
                    <div className="demo-steps">
                      {/* Step 1: Enter estimate */}
                      <div className={`demo-step ${demoStep === 'estimate' ? 'demo-step-active' : ''} ${demoStep !== 'estimate' ? 'demo-step-complete' : ''}`}>
                        <div className="demo-step-number">1</div>
                        <div className="demo-step-content">
                          <div className="demo-step-label">Enter your estimate</div>
                          {demoStep === 'estimate' ? (
                            <button className="demo-estimate-input demo-estimate-input-clickable" onClick={handleEstimateClick}>
                              <span className="demo-typing-cursor">|</span>
                              <span className="demo-tap-hint">Tap to enter 8,849</span>
                            </button>
                          ) : (
                            <div className="demo-estimate-input demo-estimate-input-filled">
                              8,849
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Drag uncertainty */}
                      <div className={`demo-step ${demoStep === 'uncertainty' ? 'demo-step-active' : ''} ${['bounds', 'complete'].includes(demoStep) ? 'demo-step-complete' : ''}`}>
                        <div className="demo-step-number">2</div>
                        <div className="demo-step-content">
                          <div className="demo-step-label">Drag to set uncertainty</div>
                          <div className="demo-slider-row">
                            <div
                              ref={sliderRef}
                              className={`demo-slider-bar ${demoStep === 'uncertainty' ? 'demo-slider-bar-active' : ''}`}
                              onPointerDown={handlePointerDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onPointerCancel={handlePointerUp}
                              style={{ touchAction: demoStep === 'uncertainty' ? 'none' : 'auto' }}
                            >
                              <div
                                className={`demo-slider-fill ${demoStep === 'uncertainty' && demoUncertainty === 0 ? 'demo-slider-fill-initial' : ''}`}
                                style={{ width: demoUncertainty === 0 ? '8px' : `${demoUncertainty}%` }}
                              />
                              <div className="demo-slider-value">8,849</div>
                            </div>
                            <div className="demo-slider-percent">±{demoUncertainty}%</div>
                          </div>
                          {demoStep === 'uncertainty' && (
                            <div className="demo-drag-hint">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M15 6l6 6-6 6"/>
                              </svg>
                              <span>Drag across the bar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Bounds appear */}
                      <div className={`demo-step ${demoStep === 'complete' ? 'demo-step-active demo-step-highlight' : ''}`}>
                        <div className="demo-step-number">3</div>
                        <div className="demo-step-content">
                          <div className="demo-step-label">Your bounds are calculated</div>
                          {demoStep === 'complete' && demoUncertainty > 0 ? (
                            <div className="demo-bounds-display demo-bounds-display-animate">
                              <span className="demo-bound-value">{demoBounds.lower.toLocaleString()}</span>
                              <span className="demo-bound-separator">–</span>
                              <span className="demo-bound-value">{demoBounds.upper.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="demo-bounds-placeholder">
                              Lower – Upper
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Final explanation */}
                    {demoStep === 'complete' && demoUncertainty > 0 && (
                      <p className="demo-final-note">
                        These bounds are then graded based on whether they contain the true answer.
                      </p>
                    )}

                    {/* Reset button */}
                    {demoStep === 'complete' && (
                      <button className="demo-reset-button" onClick={resetDemo}>
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="how-to-section">
                <h3>Scoring</h3>
                <p className="modal-intro" style={{ marginBottom: '1.5rem' }}>
                  If your range contains the true answer, you score points. Lower uncertainty = narrower range = more points.
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
                  However, if the true answer is outside your range, you get zero points for that question.
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
                  Very high uncertainty (very wide range) gives minimal points even if correct.
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

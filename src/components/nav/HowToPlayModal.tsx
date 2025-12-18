import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ModalBackdropAnimation } from '../ModalBackdropAnimation';
import { UsernameClaimModal } from './UsernameClaimModal';
import { useAuth } from '../../context/AuthContext';

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
  const { user, hasClaimedUsername } = useAuth();

  // Interactive slider state
  const [demoUncertainty, setDemoUncertainty] = useState(10);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Scroll detection state
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Username claim state
  const [showUsernameClaim, setShowUsernameClaim] = useState(false);

  // Check if user has scrolled to bottom
  const checkScrollPosition = useCallback(() => {
    const element = modalBodyRef.current;
    if (!element) return;

    const threshold = 20; // pixels from bottom to consider "at bottom"
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    setHasScrolledToBottom(isAtBottom);
  }, []);

  // Set up scroll listener and initial check
  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false);
      return;
    }

    const element = modalBodyRef.current;
    if (!element) return;

    // Check initial position (in case content doesn't need scrolling)
    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    element.addEventListener('scroll', checkScrollPosition);

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener('scroll', checkScrollPosition);
    };
  }, [isOpen, checkScrollPosition]);

  const handleSliderInteraction = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDemoUncertainty(percentage);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleSliderInteraction(e.clientX);
  }, [handleSliderInteraction]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    handleSliderInteraction(e.clientX);
  }, [handleSliderInteraction]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!isOpen) return null;

  // Calculate demo bounds based on uncertainty
  const demoEstimate = 8849;
  const uncertaintyFraction = demoUncertainty / 100;
  const demoLower = Math.round(demoEstimate * (1 - uncertaintyFraction));
  const demoUpper = Math.round(demoEstimate * (1 + uncertaintyFraction));

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

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <ModalBackdropAnimation />
      <div className="modal-content dark-glass-modal" onClick={(e) => e.stopPropagation()}>
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

        <div className="modal-body" ref={modalBodyRef}>
          <>
              <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', color: '#ffffff', marginBottom: '2.5rem' }}>
                The purpose of 4-σ is to estimate the numerical quantity of various things.
              </p>

              <div className="how-to-section">
                <h3>Answers</h3>
                <div className="answer-steps">
                  {/* Step 1: Number pad */}
                  <div className="answer-step">
                    <div className="answer-step-number">1</div>
                    <div className="answer-step-content">
                      <div className="answer-step-title">Enter your estimate</div>
                      <div className="answer-step-desc">Use the number pad to type your best guess</div>
                      <div className="mini-numpad">
                        <div className="mini-question">The height of Mount Everest in meters?</div>
                        <div className="mini-numpad-display">
                          <span className="mini-numpad-value">8,849</span>
                        </div>
                        <div className="mini-numpad-grid">
                          <div className="mini-key">7</div>
                          <div className="mini-key">8</div>
                          <div className="mini-key">9</div>
                          <div className="mini-key mini-key-op">÷</div>
                          <div className="mini-key">4</div>
                          <div className="mini-key">5</div>
                          <div className="mini-key">6</div>
                          <div className="mini-key mini-key-op">×</div>
                          <div className="mini-key">1</div>
                          <div className="mini-key">2</div>
                          <div className="mini-key">3</div>
                          <div className="mini-key mini-key-op">−</div>
                          <div className="mini-key">.</div>
                          <div className="mini-key">0</div>
                          <div className="mini-key mini-key-backspace">⌫</div>
                          <div className="mini-key mini-key-op">+</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Uncertainty slider */}
                  <div className="answer-step">
                    <div className="answer-step-number">2</div>
                    <div className="answer-step-content">
                      <div className="answer-step-title">Set your uncertainty</div>
                      <div className="answer-step-desc">Drag across the bar to widen your range</div>
                      <div className="mini-slider">
                        <div
                          className="mini-slider-bar mini-slider-bar-interactive"
                          ref={sliderRef}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                        >
                          <div className="mini-slider-fill" style={{ width: `${demoUncertainty}%` }}></div>
                          <div className="mini-slider-value">{demoEstimate.toLocaleString()}</div>
                        </div>
                        <div className="mini-slider-percent">±{Math.round(demoUncertainty)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Bounds calculated */}
                  <div className="answer-step">
                    <div className="answer-step-number">3</div>
                    <div className="answer-step-content">
                      <div className="answer-step-title">Bounds calculated automatically</div>
                      <div className="answer-step-desc">Your lower and upper bounds appear based on your uncertainty</div>
                      <div className="mini-bounds">
                        <div className="mini-bounds-value">{demoLower.toLocaleString()}</div>
                        <div className="mini-bounds-separator">–</div>
                        <div className="mini-bounds-value">{demoUpper.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Submit button */}
                  <div className="answer-step">
                    <div className="answer-step-number">4</div>
                    <div className="answer-step-content">
                      <div className="answer-step-title">Submit your bounds</div>
                      <div className="answer-step-desc">Your range is graded against the true answer</div>
                      <div className="mini-submit-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
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

        {/* Floating scroll indicator or Got it button */}
        {!hasScrolledToBottom ? (
          <div className="floating-scroll-indicator">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        ) : (
          <div className="modal-footer-actions">
            <button className="got-it-button" onClick={() => {
              // Check if user needs to claim username
              if (user?.isAnonymous || !hasClaimedUsername) {
                setShowUsernameClaim(true);
              } else {
                onClose();
              }
            }}>
              Got it
            </button>
          </div>
        )}

        {/* Username claim modal - shown after "Got it" if user hasn't claimed username */}
        <UsernameClaimModal
          isOpen={showUsernameClaim}
          onUsernameClaimed={() => {
            setShowUsernameClaim(false);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body
  );
}

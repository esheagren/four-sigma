import { DailyScoreCard } from './DailyScoreCard';
import { ShareScoreCard, type ShareScoreCardRef } from './ShareScoreCard';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Judgement {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  source?: string;
  sourceUrl?: string;
  communityStats?: {
    averageScore: number;
    highestScore: number;
  };
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface ResultsProps {
  judgements: Judgement[];
  score: number;
  onRestart: () => void;
  dailyRank?: number;
  topScoreGlobal?: number;
  averageScore?: number;
  dailyAverageScore?: number;
  calibration?: number;
  performanceHistory?: PerformanceHistoryEntry[];
  totalParticipants?: number;
}

// Counter animation component
function AnimatedScore({ finalScore, delay = 0 }: { finalScore: number; delay?: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Wait for the delay before starting animation
    const delayTimeout = setTimeout(() => {
      const duration = 800; // Animation duration in ms
      const steps = 30; // Number of steps in the animation
      const increment = finalScore / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(finalScore);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.floor(increment * currentStep));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [finalScore, delay]);

  return <>{displayScore}</>;
}

export function Results({
  judgements,
  score,
  onRestart,
  dailyRank,
  topScoreGlobal,
  dailyAverageScore,
  calibration,
  performanceHistory,
  totalParticipants
}: ResultsProps) {
  const { user } = useAuth();
  const shareCardRef = useRef<ShareScoreCardRef>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const hits = judgements.filter(j => j.hit).length;
  const total = judgements.length;

  // Calculate percentile: if rank is 1 out of 10, you beat 90% of players
  const percentile = (dailyRank && totalParticipants && totalParticipants > 0)
    ? Math.round(((totalParticipants - dailyRank) / totalParticipants) * 100)
    : undefined;

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    setIsSharing(true);
    setShareSuccess(false);

    try {
      const blob = await shareCardRef.current.generateImage();
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      // Try to use Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '4sigma-score.png', { type: 'image/png' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareSuccess(true);
          return;
        }
      }

      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setShareSuccess(true);
      } catch (clipboardError) {
        // Final fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '4sigma-score.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareSuccess(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
      // Reset success message after 3 seconds
      if (shareSuccess) {
        setTimeout(() => setShareSuccess(false), 3000);
      }
    }
  };
  // Calculate interval metrics for visual display
  const getIntervalMetrics = (lower: number, upper: number, trueValue: number, hit: boolean) => {
    const width = upper - lower;
    const widthPercent = ((width / trueValue) * 100);

    // Calculate precision score (0-100) - inverse of width percentage, capped
    // Narrower intervals get higher precision scores
    // Only meaningful if the interval contains the true value (hit)
    const precisionScore = hit
      ? Math.max(0, Math.min(100, 100 - widthPercent))
      : 0;

    return {
      width,
      widthPercent: widthPercent.toFixed(1),
      precisionScore: Math.round(precisionScore),
    };
  };

  return (
    <div className="results-container">
      {/* Hidden share card for image generation */}
      <ShareScoreCard
        ref={shareCardRef}
        totalScore={score}
        displayName={user?.displayName || 'Player'}
        hits={hits}
        total={total}
        calibration={calibration}
        percentile={percentile}
      />

      <DailyScoreCard
        totalScore={score}
        dailyRank={dailyRank}
        topScoreGlobal={topScoreGlobal}
        dailyAverageScore={dailyAverageScore}
        calibration={calibration}
        performanceHistory={performanceHistory}
        onShare={handleShare}
        isSharing={isSharing}
      />

      <div className="judgements-list">
        {judgements.map((judgement) => {
        const metrics = getIntervalMetrics(judgement.lower, judgement.upper, judgement.trueValue, judgement.hit);

        // Fixed visual display - always show bounds at consistent positions
        // regardless of actual numerical range
        const VISUAL_WIDTH = 60; // Fixed width for the interval display (percentage)
        const CENTER = 50; // Center point of the visualization

        // Place bounds symmetrically around center at fixed visual distance
        const lowerPercent = CENTER - (VISUAL_WIDTH / 2);
        const upperPercent = CENTER + (VISUAL_WIDTH / 2);

        // Calculate where the true value should appear
        const range = judgement.upper - judgement.lower;
        let trueValuePosition: number;
        let isOutsideBounds = false;

        if (judgement.trueValue < judgement.lower) {
          // True value is below the lower bound
          isOutsideBounds = true;
          // Clamp to show just outside the lower bound (5% of visual width)
          trueValuePosition = -0.05;
        } else if (judgement.trueValue > judgement.upper) {
          // True value is above the upper bound
          isOutsideBounds = true;
          // Clamp to show just outside the upper bound (105% of visual width)
          trueValuePosition = 1.05;
        } else {
          // True value is within or at the bounds
          // Use epsilon for floating point comparison
          const epsilon = 0.0001;

          if (Math.abs(judgement.trueValue - judgement.lower) < epsilon) {
            // Exactly at lower bound
            trueValuePosition = 0;
          } else if (Math.abs(judgement.trueValue - judgement.upper) < epsilon) {
            // Exactly at upper bound
            trueValuePosition = 1;
          } else {
            // Between bounds - proportional positioning
            trueValuePosition = (judgement.trueValue - judgement.lower) / range;
          }
        }

        // Convert position to percentage
        const trueValuePercent = lowerPercent + (trueValuePosition * VISUAL_WIDTH);
        const rangeWidth = upperPercent - lowerPercent;

        const rangeColor = judgement.hit ? '#4ecdc4' : '#df1b41';

        return (
          <div
            key={judgement.questionId}
            className={`judgement-card ${judgement.hit ? 'hit' : 'miss'}`}
          >
            <h3 className="judgement-prompt">{judgement.prompt}</h3>

            {/* Visual Range Display */}
            <div className="judgement-visual">
              <div className="judgement-range-visualization">
                <div className="judgement-range-line" />

                {/* Span between bounds */}
                <div
                  className="judgement-range-span"
                  style={{
                    left: `${lowerPercent}%`,
                    width: `${rangeWidth}%`,
                    background: rangeColor,
                  }}
                />

                {/* True value marker */}
                <div
                  className={`judgement-true-answer-marker ${isOutsideBounds ? 'outside-bounds' : ''}`}
                  style={{ left: `${trueValuePercent}%` }}
                  title={`True value: ${judgement.trueValue.toLocaleString()}`}
                >
                  <div className="judgement-true-answer-dot" />
                </div>

                {/* Lower bound */}
                <div
                  className="judgement-range-bound judgement-range-bound-lower"
                  style={{ left: `${lowerPercent}%` }}
                >
                  <div
                    className="judgement-range-bound-dot"
                    style={{ background: rangeColor }}
                  />
                  <div
                    className="judgement-range-bound-label"
                    style={{ background: rangeColor }}
                  >
                    {judgement.lower.toLocaleString()}
                  </div>
                </div>

                {/* Upper bound */}
                <div
                  className="judgement-range-bound judgement-range-bound-upper"
                  style={{ left: `${upperPercent}%` }}
                >
                  <div
                    className="judgement-range-bound-dot"
                    style={{ background: rangeColor }}
                  />
                  <div
                    className="judgement-range-bound-label"
                    style={{ background: rangeColor }}
                  >
                    {judgement.upper.toLocaleString()}
                  </div>
                </div>
              </div>

              {judgement.sourceUrl ? (
                <a
                  href={judgement.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="judgement-guess-display judgement-answer-link"
                  title="Click to view source"
                >
                  <span className="judgement-guess-value">{judgement.trueValue.toLocaleString()}</span>
                  {judgement.unit && <div className="judgement-unit">Unit: {judgement.unit}</div>}
                </a>
              ) : (
                <div className="judgement-guess-display">
                  <span className="judgement-guess-value">{judgement.trueValue.toLocaleString()}</span>
                  {judgement.unit && <div className="judgement-unit">Unit: {judgement.unit}</div>}
                </div>
              )}
            </div>

            {/* Score display in bottom right */}
            <div className={`judgement-score-display-bottom ${judgement.hit ? 'score-hit' : 'score-miss'}`}>
              <div className="judgement-score-value">
                <AnimatedScore finalScore={Math.round(judgement.score)} delay={0} />
              </div>
              <div className="judgement-score-label">
                points
              </div>
            </div>
          </div>
        );
      })}
      </div>

      <button onClick={onRestart} className="explore-button">
        Explore More Questions
      </button>
    </div>
  );
}


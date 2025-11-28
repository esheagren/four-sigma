import { useState, useEffect } from 'react';
import { GaussianLandscape } from './GaussianLandscape';

interface CrowdGuess {
  min: number;
  max: number;
}

interface CrowdData {
  guesses: CrowdGuess[];
  avgMin: number;
  avgMax: number;
  avgHit: boolean;
  hitRate: number;
  totalResponses: number;
}

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
  crowdData?: CrowdData;
}

interface ResultCardProps {
  judgement: Judgement;
  index: number;
}

// Animated score counter
function AnimatedScore({ finalScore, delay = 0 }: { finalScore: number; delay?: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      const duration = 800;
      const steps = 30;
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

export function ResultCard({ judgement, index }: ResultCardProps) {
  const {
    prompt,
    unit,
    lower,
    upper,
    trueValue,
    hit,
    score,
    sourceUrl,
    crowdData,
  } = judgement;

  // Format hit rate as percentage
  const hitRatePercent = crowdData
    ? Math.round(crowdData.hitRate * 100)
    : null;

  return (
    <div
      className={`result-card ${hit ? 'hit' : 'miss'}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Points badge - TOP CENTER overlapping border */}
      <div className={`result-card-points ${hit ? 'hit' : 'miss'}`}>
        {hit ? '+' : ''}<AnimatedScore finalScore={Math.round(score)} delay={index * 150} /> PTS
      </div>

      {/* Light header section */}
      <div className="result-card-header">
        <p className="result-card-question">{prompt}</p>
        <div className="result-card-answer-pill">
          Answer:{' '}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="result-card-answer-link"
            >
              {trueValue.toLocaleString()}
            </a>
          ) : (
            <span>{trueValue.toLocaleString()}</span>
          )}
          {unit && <span className="result-card-answer-unit"> {unit}</span>}
        </div>
      </div>

      {/* Dark body section with visualization */}
      <div className="result-card-body">
        {/* Gaussian Landscape Visualization */}
        <GaussianLandscape
          userMin={lower}
          userMax={upper}
          trueValue={trueValue}
          hit={hit}
          crowdData={crowdData}
        />

        {/* Metadata row */}
        <div className="result-card-metadata">
          <span className="result-card-meta-item">
            <span className="result-card-meta-label">Your range:</span>{' '}
            {lower.toLocaleString()} – {upper.toLocaleString()}
          </span>
          {hitRatePercent !== null && (
            <>
              <span className="result-card-meta-divider">|</span>
              <span className="result-card-meta-item">
                <span className="result-card-meta-label">Crowd:</span>{' '}
                {hitRatePercent}% hit
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

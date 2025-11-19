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

interface ResultsProps {
  judgements: Judgement[];
  score: number;
  onRestart: () => void;
}

export function Results({ judgements, score, onRestart }: ResultsProps) {
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
      <div className="score-display">
        <h1>Session complete</h1>
        <div className="score">
          <span className="score-number">{score.toFixed(2)}</span>
        </div>
        <p className="score-label">Total score</p>
      </div>

      <div className="judgements-list">
        {judgements.map((judgement) => {
        const metrics = getIntervalMetrics(judgement.lower, judgement.upper, judgement.trueValue, judgement.hit);

        return (
          <div
            key={judgement.questionId}
            className={`judgement-card ${judgement.hit ? 'hit' : 'miss'}`}
          >
            <h3 className="judgement-prompt">{judgement.prompt}</h3>
            {judgement.unit && <p className="judgement-unit">{judgement.unit}</p>}

            <div className="judgement-details">
              <div className="interval">
                <span className="label">Your interval:</span>
                <span className="value">[{judgement.lower}, {judgement.upper}]</span>
              </div>

              <div className="true-value">
                <span className="label">True value:</span>
                <span className="value">{judgement.trueValue}</span>
              </div>

              <div className="precision-row">
                <span className="label precision-label-hover">
                  Precision:
                  <span className="precision-tooltip-trigger">ⓘ</span>
                  <span className="precision-tooltip">
                    Narrower range yields higher precision. Only updated with correct answer.
                  </span>
                </span>
                <span className={`value ${judgement.hit ? 'precision-value' : ''}`}>
                  {metrics.precisionScore}%
                </span>
              </div>

              <div className="score-row">
                <span className="label">Your score:</span>
                <span className={`score-value ${judgement.score === 0 ? 'zero' : judgement.score < 0 ? 'negative' : 'positive'}`}>
                  {judgement.score.toFixed(2)}
                </span>
              </div>

              {judgement.communityStats && (
                <>
                  <div className="community-stats-divider" />
                  <div className="community-stats-row">
                    <span className="label">Community average:</span>
                    <span className="value community-value">
                      {judgement.communityStats.averageScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="community-stats-row">
                    <span className="label">Community best:</span>
                    <span className="value community-value">
                      {judgement.communityStats.highestScore.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {judgement.source && (
              <div className="question-source">
                <span className="source-label">Source:</span>
                {judgement.sourceUrl ? (
                  <a
                    href={judgement.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    {judgement.source}
                  </a>
                ) : (
                  <span className="source-text">{judgement.source}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>

      <button onClick={onRestart} className="restart-button">
        Start new session
      </button>
    </div>
  );
}


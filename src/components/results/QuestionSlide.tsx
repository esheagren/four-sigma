import { RangeVisualization } from './RangeVisualization';
import { formatNumber } from './gaussianUtils';

interface CrowdData {
  avgMin: number;
  avgMax: number;
  hitRate: number;
  totalResponses: number;
}

interface QuestionSlideProps {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  sourceUrl?: string;
  crowdData?: CrowdData;
  index: number;
  total: number;
}

export function QuestionSlide({
  prompt,
  unit,
  lower,
  upper,
  trueValue,
  hit,
  score,
  sourceUrl,
  crowdData,
  index,
  total,
}: QuestionSlideProps) {
  return (
    <div className="tiktok-slide question-slide">
      {/* Header - just the counter */}
      <div className="slide-header">
        <span className="slide-counter">
          {index + 1} / {total}
        </span>
      </div>

      {/* Content */}
      <div className="slide-content">
        {/* Score inside card - top right */}
        <div className={`slide-score-badge ${hit ? 'hit' : 'miss'}`}>
          {hit ? '+' : ''}{Math.round(score)}
        </div>

        {/* Question */}
        <div className="slide-question-section">
          <h2 className="slide-question">{prompt}</h2>
          <div className="slide-answer-badge">
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="slide-answer-link">
                {formatNumber(trueValue)}
              </a>
            ) : (
              <span>{formatNumber(trueValue)}</span>
            )}
            {unit && <span className="slide-answer-unit"> {unit}</span>}
          </div>
        </div>

        {/* Visualization */}
        <div className="slide-viz-container">
          <RangeVisualization
            userMin={lower}
            userMax={upper}
            trueValue={trueValue}
            hit={hit}
            crowdData={crowdData}
          />
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="slide-scroll-hint">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

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
  slideIndex: number;
  totalSlides: number;
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
  slideIndex,
  totalSlides,
}: QuestionSlideProps) {
  return (
    <div className="tiktok-slide question-slide">
      <div className="slide-body">
        {/* Dot indicators on the left */}
        <div className="slide-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`slide-dot ${i === slideIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="slide-content">
        {/* Question */}
        <div className="slide-question-section">
          <h2 className="slide-question">{prompt}</h2>
        </div>

        {/* Visualization */}
        <div className="slide-viz-container">
          <RangeVisualization
            userMin={lower}
            userMax={upper}
            trueValue={trueValue}
            hit={hit}
            score={score}
            unit={unit}
          />
        </div>

        {/* Question Context */}
        <div className="question-context">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>
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

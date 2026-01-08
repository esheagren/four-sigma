import { forwardRef } from 'react';
import { formatNumber } from './gaussianUtils';

interface ExplanationSlideProps {
  prompt: string;
  answerContext?: string;
  sourceUrl?: string;
  trueValue: number;
  unit?: string;
}

export const ExplanationSlide = forwardRef<HTMLDivElement, ExplanationSlideProps>(({
  prompt,
  answerContext,
  sourceUrl,
  trueValue,
  unit,
}, ref) => {
  return (
    <div className="tiktok-slide explanation-slide" ref={ref}>
      <div className="slide-body">
        <div className="slide-content explanation-content">
          {/* Question context header */}
          <div className="explanation-header">
            <h3 className="explanation-question">{prompt}</h3>
            <div className="explanation-answer-badge">
              Answer: {formatNumber(trueValue)}{unit && ` ${unit}`}
            </div>
          </div>

          {/* Full explanation */}
          <div className="explanation-body">
            {answerContext ? (
              <p className="explanation-text">{answerContext}</p>
            ) : (
              <p className="explanation-empty">No additional context for this question.</p>
            )}

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="explanation-source-link"
              >
                View Source
              </a>
            )}
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
});

ExplanationSlide.displayName = 'ExplanationSlide';

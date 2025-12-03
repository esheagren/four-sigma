import { useState, useEffect } from 'react';
import { EstimateNumPad } from './EstimateNumPad';
import { isTouchDevice } from '../lib/device';

interface Question {
  id: string;
  prompt: string;
  unit?: string;
}

interface QuestionCardProps {
  question: Question;
  onSubmit: (lower: number, upper: number) => void;
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [isTouch, setIsTouch] = useState(true); // Default to touch to avoid flash

  // Detect device type on mount
  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  return (
    <>
      <div className="question-card">
        <div className="question-header">
          <h2 className="question-prompt">{question.prompt}</h2>
          {question.unit && (
            <div className="unit-badge">
              <span className="unit-label">Unit:</span>
              <span className="unit-value">{question.unit}</span>
            </div>
          )}
        </div>
      </div>

      <EstimateNumPad
        onSubmit={onSubmit}
        isTouch={isTouch}
      />
    </>
  );
}

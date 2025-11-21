import { useState } from 'react';

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
  const [lower, setLower] = useState<string>('');
  const [upper, setUpper] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const lowerNum = parseFloat(lower);
  const upperNum = parseFloat(upper);

  const isLowerValid = lower !== '' && !isNaN(lowerNum);
  const isUpperValid = upper !== '' && !isNaN(upperNum);
  const isRangeValid = isLowerValid && isUpperValid && lowerNum <= upperNum;
  const isSubmitDisabled = !isRangeValid;

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    if (!isSubmitDisabled) {
      onSubmit(lowerNum, upperNum);
      setLower('');
      setUpper('');
      setHasAttemptedSubmit(false);
    }
  };

  return (
    <>
      <div className="question-card">
        <div className="question-section">
          <h2 className="question-prompt">{question.prompt}</h2>
          {question.unit && (
            <div className="unit-badge">
              <span className="unit-label">Unit:</span>
              <span className="unit-value">{question.unit}</span>
            </div>
          )}
        </div>

        <div className="inputs-container">
          <div className="input-group">
            <input
              id="lower-bound"
              type="number"
              value={lower}
              onChange={(e) => setLower(e.target.value)}
              placeholder="0"
              className="bound-input"
            />
          </div>

          <div className="input-separator">to</div>

          <div className="input-group">
            <input
              id="upper-bound"
              type="number"
              value={upper}
              onChange={(e) => setUpper(e.target.value)}
              placeholder="0"
              className="bound-input"
            />
          </div>
        </div>

        {hasAttemptedSubmit && isLowerValid && isUpperValid && lowerNum > upperNum && (
          <p className="validation-error">Lower bound must be ≤ upper bound</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="submit-button"
      >
        Submit answer
      </button>
    </>
  );
}


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

// Format number with commas (e.g., 1000000 -> "1,000,000")
function formatWithCommas(value: string): string {
  // Remove existing commas and non-numeric chars except decimal and minus
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-') return cleaned;

  // Split by decimal point
  const parts = cleaned.split('.');
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

// Parse formatted string back to number (e.g., "1,000,000" -> 1000000)
function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [lower, setLower] = useState<string>('');
  const [upper, setUpper] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const lowerNum = parseFormattedNumber(lower);
  const upperNum = parseFormattedNumber(upper);

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
              type="text"
              inputMode="decimal"
              value={lower}
              onChange={(e) => setLower(formatWithCommas(e.target.value))}
              placeholder="0"
              className="bound-input"
            />
          </div>

          <div className="input-separator">to</div>

          <div className="input-group">
            <input
              id="upper-bound"
              type="text"
              inputMode="decimal"
              value={upper}
              onChange={(e) => setUpper(formatWithCommas(e.target.value))}
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


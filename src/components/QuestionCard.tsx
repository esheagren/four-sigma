import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface Question {
  id: string;
  prompt: string;
  unit?: string;
}

export type FocusedInput = 'lower' | 'upper' | null;

interface QuestionCardProps {
  question: Question;
  onSubmit: (lower: number, upper: number) => void;
  onFocusChange?: (focused: FocusedInput) => void;
  showNumpad?: boolean;
}

export interface QuestionCardRef {
  appendDigit: (digit: string) => void;
  backspace: () => void;
  submit: () => void;
  toggleFocus: () => void;
  isSubmitDisabled: () => boolean;
  isOnUpperBound: () => boolean;
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

// Get dynamic font size based on value length
function getInputFontSize(value: string): string | undefined {
  const len = value.length;
  if (len <= 6) return undefined; // Use default CSS
  if (len <= 8) return '1.1rem';
  if (len <= 10) return '0.95rem';
  return '0.8rem';
}

export const QuestionCard = forwardRef<QuestionCardRef, QuestionCardProps>(
  function QuestionCard({ question, onSubmit, onFocusChange, showNumpad = false }, ref) {
  const [lower, setLower] = useState<string>('');
  const [upper, setUpper] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInput>('lower');

  const lowerInputRef = useRef<HTMLInputElement>(null);
  const upperInputRef = useRef<HTMLInputElement>(null);

  const lowerNum = parseFormattedNumber(lower);
  const upperNum = parseFormattedNumber(upper);

  const isLowerValid = lower !== '' && !isNaN(lowerNum);
  const isUpperValid = upper !== '' && !isNaN(upperNum);
  const areBothInputsValid = isLowerValid && isUpperValid;
  const isRangeValid = areBothInputsValid && lowerNum <= upperNum;
  const isSubmitDisabled = !areBothInputsValid;

  // Auto-focus lower input on mount when numpad is shown
  useEffect(() => {
    if (showNumpad && lowerInputRef.current) {
      lowerInputRef.current.focus();
    }
  }, [showNumpad, question.id]);

  const handleFocus = (input: FocusedInput) => {
    setFocusedInput(input);
    onFocusChange?.(input);
  };

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    if (areBothInputsValid && lowerNum > upperNum) {
      // Show error but don't submit
      return;
    }
    if (isRangeValid) {
      onSubmit(lowerNum, upperNum);
      setLower('');
      setUpper('');
      setHasAttemptedSubmit(false);
      setFocusedInput('lower');
      // Re-focus lower input for next question
      if (showNumpad) {
        setTimeout(() => lowerInputRef.current?.focus(), 0);
      }
    }
  };

  // Expose methods for external control (NumberPanel)
  useImperativeHandle(ref, () => ({
    appendDigit: (digit: string) => {
      if (focusedInput === 'lower') {
        setLower(prev => formatWithCommas(prev.replace(/,/g, '') + digit));
      } else if (focusedInput === 'upper') {
        setUpper(prev => formatWithCommas(prev.replace(/,/g, '') + digit));
      }
    },
    backspace: () => {
      if (focusedInput === 'lower') {
        setLower(prev => {
          const unformatted = prev.replace(/,/g, '');
          return formatWithCommas(unformatted.slice(0, -1));
        });
      } else if (focusedInput === 'upper') {
        setUpper(prev => {
          const unformatted = prev.replace(/,/g, '');
          return formatWithCommas(unformatted.slice(0, -1));
        });
      }
    },
    toggleFocus: () => {
      const newFocus = focusedInput === 'lower' ? 'upper' : 'lower';
      setFocusedInput(newFocus);
      onFocusChange?.(newFocus);
      if (newFocus === 'lower') {
        lowerInputRef.current?.focus();
      } else {
        upperInputRef.current?.focus();
      }
    },
    submit: handleSubmit,
    isSubmitDisabled: () => isSubmitDisabled,
    isOnUpperBound: () => focusedInput === 'upper',
  }));

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

        {hasAttemptedSubmit && areBothInputsValid && lowerNum > upperNum ? (
          <div className="inputs-container-with-error">
            <div className="input-group">
              <label htmlFor="lower-bound" className="bound-label">Lower bound</label>
              <input
                ref={lowerInputRef}
                id="lower-bound"
                type="text"
                inputMode="decimal"
                value={lower}
                onChange={(e) => setLower(formatWithCommas(e.target.value))}
                onFocus={() => handleFocus('lower')}
                placeholder="0"
                className={`bound-input ${focusedInput === 'lower' && showNumpad ? 'input-focused' : ''}`}
                style={{ fontSize: getInputFontSize(lower) }}
              />
            </div>

            <div className="input-group">
              <label htmlFor="upper-bound" className="bound-label">Upper bound</label>
              <input
                ref={upperInputRef}
                id="upper-bound"
                type="text"
                inputMode="decimal"
                value={upper}
                onChange={(e) => setUpper(formatWithCommas(e.target.value))}
                onFocus={() => handleFocus('upper')}
                placeholder="0"
                className={`bound-input ${focusedInput === 'upper' && showNumpad ? 'input-focused' : ''}`}
                style={{ fontSize: getInputFontSize(upper) }}
              />
            </div>

            <p className="validation-error">Lower bound must be ≤ upper bound</p>
          </div>
        ) : (
          <div className="inputs-container">
            <div className="input-group">
              <input
                ref={lowerInputRef}
                id="lower-bound"
                type="text"
                inputMode="decimal"
                value={lower}
                onChange={(e) => setLower(formatWithCommas(e.target.value))}
                onFocus={() => handleFocus('lower')}
                placeholder="0"
                className={`bound-input ${focusedInput === 'lower' && showNumpad ? 'input-focused' : ''}`}
                style={{ fontSize: getInputFontSize(lower) }}
              />
            </div>

            <div className="input-separator">–</div>

            <div className="input-group">
              <input
                ref={upperInputRef}
                id="upper-bound"
                type="text"
                inputMode="decimal"
                value={upper}
                onChange={(e) => setUpper(formatWithCommas(e.target.value))}
                onFocus={() => handleFocus('upper')}
                placeholder="0"
                className={`bound-input ${focusedInput === 'upper' && showNumpad ? 'input-focused' : ''}`}
                style={{ fontSize: getInputFontSize(upper) }}
              />
            </div>
          </div>
        )}
      </div>

      {!showNumpad && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="submit-button"
        >
          Submit
        </button>
      )}
    </>
  );
});


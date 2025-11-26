import { useState, useCallback } from 'react';
import { NumPad } from './NumPad';

interface Question {
  id: string;
  prompt: string;
  unit?: string;
}

interface QuestionCardProps {
  question: Question;
  onSubmit: (lower: number, upper: number) => void;
}

type ActiveField = 'lower' | 'upper';

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

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [lower, setLower] = useState<string>('');
  const [upper, setUpper] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>('lower');

  const lowerNum = parseFormattedNumber(lower);
  const upperNum = parseFormattedNumber(upper);

  const isLowerValid = lower !== '' && !isNaN(lowerNum);
  const isUpperValid = upper !== '' && !isNaN(upperNum);
  const areBothInputsValid = isLowerValid && isUpperValid;
  const isRangeValid = areBothInputsValid && lowerNum <= upperNum;
  const isSubmitDisabled = !areBothInputsValid;

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
      setActiveField('lower');
    }
  };

  // Handle numpad input
  const handleNumPadInput = useCallback((digit: string) => {
    const setValue = activeField === 'lower' ? setLower : setUpper;
    const currentValue = activeField === 'lower' ? lower : upper;

    // Handle multiplier shortcuts
    if (digit === 'K' || digit === 'M' || digit === 'B') {
      const cleanedValue = currentValue.replace(/,/g, '');
      const numValue = parseFloat(cleanedValue) || 0;
      let multiplier = 1;
      if (digit === 'K') multiplier = 1000;
      if (digit === 'M') multiplier = 1000000;
      if (digit === 'B') multiplier = 1000000000;

      const newValue = numValue * multiplier;
      setValue(formatWithCommas(newValue.toString()));
      return;
    }

    // Handle decimal point
    if (digit === '.') {
      if (currentValue.includes('.')) return; // Already has decimal
      if (currentValue === '') {
        setValue('0.');
        return;
      }
    }

    // Append digit
    const newValue = currentValue.replace(/,/g, '') + digit;
    setValue(formatWithCommas(newValue));
  }, [activeField, lower, upper]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    const setValue = activeField === 'lower' ? setLower : setUpper;
    const currentValue = activeField === 'lower' ? lower : upper;

    const cleanedValue = currentValue.replace(/,/g, '');
    const newValue = cleanedValue.slice(0, -1);
    setValue(formatWithCommas(newValue));
  }, [activeField, lower, upper]);

  // Handle clear
  const handleClear = useCallback(() => {
    const setValue = activeField === 'lower' ? setLower : setUpper;
    setValue('');
  }, [activeField]);

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

        <div className="inputs-container">
          <div className="input-group">
            <input
              id="lower-bound"
              type="text"
              readOnly
              value={lower}
              onClick={() => setActiveField('lower')}
              placeholder="0"
              className={`bound-input ${activeField === 'lower' ? 'bound-input-active' : ''}`}
              style={{ fontSize: getInputFontSize(lower) }}
            />
          </div>

          <div className="input-separator">–</div>

          <div className="input-group">
            <input
              id="upper-bound"
              type="text"
              readOnly
              value={upper}
              onClick={() => setActiveField('upper')}
              placeholder="0"
              className={`bound-input ${activeField === 'upper' ? 'bound-input-active' : ''}`}
              style={{ fontSize: getInputFontSize(upper) }}
            />
          </div>
        </div>

        {hasAttemptedSubmit && areBothInputsValid && lowerNum > upperNum && (
          <p className="validation-error">Lower bound must be ≤ upper bound</p>
        )}
      </div>

      <NumPad
        onInput={handleNumPadInput}
        onBackspace={handleBackspace}
        onClear={handleClear}
      />

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="submit-button"
      >
        Submit
      </button>
    </>
  );
}

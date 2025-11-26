import { useState, useCallback, useEffect, useRef } from 'react';
import { NumPad } from './NumPad';
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
  const [isTouch, setIsTouch] = useState(true); // Default to touch to avoid flash
  const lowerInputRef = useRef<HTMLInputElement>(null);
  const upperInputRef = useRef<HTMLInputElement>(null);

  // Detect device type on mount
  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const lowerNum = parseFormattedNumber(lower);
  const upperNum = parseFormattedNumber(upper);

  const isLowerValid = lower !== '' && !isNaN(lowerNum);
  const isUpperValid = upper !== '' && !isNaN(upperNum);
  const areBothInputsValid = isLowerValid && isUpperValid;
  const isRangeValid = areBothInputsValid && lowerNum <= upperNum;
  const isSubmitDisabled = !areBothInputsValid;

  const handleSubmit = useCallback(() => {
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
  }, [areBothInputsValid, isRangeValid, lowerNum, upperNum, onSubmit]);

  // Handle numpad input
  const handleNumPadInput = useCallback((digit: string) => {
    const setValue = activeField === 'lower' ? setLower : setUpper;
    const currentValue = activeField === 'lower' ? lower : upper;

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

  // Toggle between lower and upper field
  const handleToggleField = useCallback(() => {
    setActiveField(prev => prev === 'lower' ? 'upper' : 'lower');
  }, []);

  // Use calculator result
  const handleUseCalculatorResult = useCallback((result: string) => {
    const setValue = activeField === 'lower' ? setLower : setUpper;
    setValue(formatWithCommas(result));
  }, [activeField]);

  // Handle direct keyboard input (desktop only)
  const handleKeyboardInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: ActiveField) => {
    const rawValue = e.target.value;
    // Only allow numbers, decimal point, and minus sign
    const cleaned = rawValue.replace(/[^0-9.-]/g, '');

    // Validate the cleaned value
    if (cleaned === '' || cleaned === '-' || cleaned === '.') {
      if (field === 'lower') setLower(cleaned);
      else setUpper(cleaned);
      return;
    }

    // Check for valid number format (only one decimal, minus only at start)
    const parts = cleaned.split('.');
    if (parts.length > 2) return; // Multiple decimals
    if (cleaned.indexOf('-') > 0) return; // Minus not at start

    const formatted = formatWithCommas(cleaned);
    if (field === 'lower') setLower(formatted);
    else setUpper(formatted);
  }, []);

  // Handle keyboard shortcuts (Tab to switch fields, Enter to submit)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitDisabled) {
      e.preventDefault();
      handleSubmit();
    }
  }, [isSubmitDisabled, handleSubmit]);

  // Focus the appropriate input when activeField changes (desktop only)
  useEffect(() => {
    if (!isTouch) {
      if (activeField === 'lower') {
        lowerInputRef.current?.focus();
      } else {
        upperInputRef.current?.focus();
      }
    }
  }, [activeField, isTouch]);

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
              ref={lowerInputRef}
              id="lower-bound"
              type="text"
              inputMode={isTouch ? 'none' : 'decimal'}
              readOnly={isTouch}
              value={lower}
              onChange={(e) => handleKeyboardInput(e, 'lower')}
              onFocus={() => setActiveField('lower')}
              onClick={() => setActiveField('lower')}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className={`bound-input ${activeField === 'lower' ? 'bound-input-active' : ''}`}
              style={{ fontSize: getInputFontSize(lower) }}
            />
          </div>

          <div className="input-separator">–</div>

          <div className="input-group">
            <input
              ref={upperInputRef}
              id="upper-bound"
              type="text"
              inputMode={isTouch ? 'none' : 'decimal'}
              readOnly={isTouch}
              value={upper}
              onChange={(e) => handleKeyboardInput(e, 'upper')}
              onFocus={() => setActiveField('upper')}
              onClick={() => setActiveField('upper')}
              onKeyDown={handleKeyDown}
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
        activeField={activeField}
        onInput={handleNumPadInput}
        onBackspace={handleBackspace}
        onToggleField={handleToggleField}
        onSubmit={handleSubmit}
        isSubmitDisabled={isSubmitDisabled}
        onUseCalculatorResult={handleUseCalculatorResult}
        isTouch={isTouch}
      />
    </>
  );
}

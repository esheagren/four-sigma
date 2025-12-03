// EstimateNumPad - Unified estimate + uncertainty slider component
import { useState, useCallback, useEffect, useMemo } from 'react';

// Bounds data passed to parent
export interface BoundsData {
  lower: number;
  upper: number;
  estimate: number;
  uncertainty: number;
  hasValidEstimate: boolean;
}

interface EstimateNumPadProps {
  onSubmit: (lower: number, upper: number) => void;
  isTouch: boolean;
  // Callback to notify parent of bound changes
  onBoundsChange?: (bounds: BoundsData | null) => void;
  // Optional overrides from parent (when user edits bounds directly)
  lowerOverride?: number | null;
  upperOverride?: number | null;
  // Callback when overrides should be cleared (e.g., slider moved)
  onClearOverrides?: () => void;
}

// Format number with commas (e.g., 1000000 -> "1,000,000")
function formatWithCommas(value: string): string {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-') return cleaned;

  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Parse formatted string back to number
function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}

// Format for display (with abbreviations for large numbers)
function formatDisplay(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '-';

  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return (value / 1e12).toFixed(2) + 'T';
  } else if (absValue >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  } else if (absValue >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  } else if (absValue >= 1e3) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

// Compute lower/upper bounds from estimate and uncertainty
function computeBounds(estimate: string, uncertainty: number): { lower: number; upper: number } {
  const value = parseFormattedNumber(estimate);
  if (isNaN(value) || !isFinite(value)) {
    return { lower: 0, upper: 0 };
  }

  const margin = Math.abs(value) * (uncertainty / 100);
  return {
    lower: value - margin,
    upper: value + margin,
  };
}

// Export formatDisplay for use in QuestionCard
export { formatDisplay };

export function EstimateNumPad({
  onSubmit,
  isTouch,
  onBoundsChange,
  lowerOverride,
  upperOverride,
  onClearOverrides
}: EstimateNumPadProps) {
  // Core state
  const [estimate, setEstimate] = useState<string>('');
  const [uncertainty, setUncertainty] = useState<number>(0);

  // Calculator state
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [pendingOperand, setPendingOperand] = useState<string | null>(null);
  const [isNewEntry, setIsNewEntry] = useState<boolean>(false);

  // Computed bounds
  const bounds = useMemo(() => computeBounds(estimate, uncertainty), [estimate, uncertainty]);

  // Check if we have a valid estimate for submission
  const hasValidEstimate = estimate !== '' && !isNaN(parseFormattedNumber(estimate));

  // Notify parent of bounds changes
  useEffect(() => {
    if (onBoundsChange) {
      if (hasValidEstimate) {
        const estimateValue = parseFormattedNumber(estimate);
        onBoundsChange({
          lower: bounds.lower,
          upper: bounds.upper,
          estimate: estimateValue,
          uncertainty,
          hasValidEstimate: true
        });
      } else {
        onBoundsChange(null);
      }
    }
  }, [bounds, uncertainty, hasValidEstimate, estimate, onBoundsChange]);

  // Scratchpad display (shows pending operation)
  const scratchpad = useMemo(() => {
    if (pendingOperator && pendingOperand) {
      return `${formatWithCommas(pendingOperand)} ${pendingOperator}`;
    }
    return '';
  }, [pendingOperator, pendingOperand]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    if (isNewEntry) {
      setEstimate(digit);
      setIsNewEntry(false);
    } else {
      const currentRaw = estimate.replace(/,/g, '');
      const newValue = currentRaw + digit;
      setEstimate(formatWithCommas(newValue));
    }
  }, [estimate, isNewEntry]);

  // Handle decimal point
  const handleDecimal = useCallback(() => {
    if (isNewEntry) {
      setEstimate('0.');
      setIsNewEntry(false);
    } else if (!estimate.includes('.')) {
      if (estimate === '') {
        setEstimate('0.');
      } else {
        setEstimate(estimate + '.');
      }
    }
  }, [estimate, isNewEntry]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isNewEntry) return;
    const currentRaw = estimate.replace(/,/g, '');
    const newValue = currentRaw.slice(0, -1);
    setEstimate(formatWithCommas(newValue));
  }, [estimate, isNewEntry]);

  // Handle clear
  const handleClear = useCallback(() => {
    setEstimate('');
    setPendingOperator(null);
    setPendingOperand(null);
    setIsNewEntry(false);
  }, []);

  // Perform calculation
  const calculate = useCallback((a: number, op: string, b: number): number => {
    let result = 0;
    switch (op) {
      case '+': result = a + b; break;
      case '−': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b !== 0 ? a / b : 0; break;
      default: result = b;
    }
    // Round to avoid floating point issues
    return Math.round(result * 1e9) / 1e9;
  }, []);

  // Handle operator
  const handleOperator = useCallback((op: string) => {
    const currentValue = parseFormattedNumber(estimate);

    if (pendingOperator && pendingOperand && !isNewEntry) {
      // Chain calculation: compute previous, then set new operator
      const prevValue = parseFormattedNumber(pendingOperand);
      const result = calculate(prevValue, pendingOperator, currentValue);
      setEstimate(formatWithCommas(String(result)));
      setPendingOperand(String(result));
    } else if (estimate !== '' && !isNaN(currentValue)) {
      setPendingOperand(estimate.replace(/,/g, ''));
    }

    setPendingOperator(op);
    setIsNewEntry(true);
  }, [estimate, pendingOperator, pendingOperand, isNewEntry, calculate]);

  // Handle equals
  const handleEquals = useCallback(() => {
    if (!pendingOperator || !pendingOperand) return;

    const prevValue = parseFormattedNumber(pendingOperand);
    const currentValue = parseFormattedNumber(estimate);
    const result = calculate(prevValue, pendingOperator, currentValue);

    setEstimate(formatWithCommas(String(result)));
    setPendingOperator(null);
    setPendingOperand(null);
    setIsNewEntry(true);
  }, [estimate, pendingOperator, pendingOperand, calculate]);

  // Handle slider change - clear overrides when slider moves
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUncertainty(Number(e.target.value));
    // Clear any manual overrides when slider is adjusted
    if (onClearOverrides) {
      onClearOverrides();
    }
  }, [onClearOverrides]);

  // Handle submit - use overrides if provided
  const handleSubmit = useCallback(() => {
    if (!hasValidEstimate) return;

    // Use overrides if provided, otherwise use computed bounds
    const finalLower = lowerOverride !== null && lowerOverride !== undefined ? lowerOverride : bounds.lower;
    const finalUpper = upperOverride !== null && upperOverride !== undefined ? upperOverride : bounds.upper;

    onSubmit(finalLower, finalUpper);
    // Reset for next question
    setEstimate('');
    setUncertainty(0);
    setPendingOperator(null);
    setPendingOperand(null);
    setIsNewEntry(false);
  }, [hasValidEstimate, bounds, onSubmit, lowerOverride, upperOverride]);


  return (
    <div className="estimate-numpad-container">
      {/* Compact Estimate Display */}
      <div className="estimate-display-compact">
        <div className="estimate-value-compact">
          {estimate ? formatWithCommas(estimate) : '0'}
        </div>
        {scratchpad && (
          <div className="estimate-scratchpad-compact">{scratchpad}</div>
        )}
      </div>

      {/* Uncertainty Slider with draggable thumb */}
      <div className="uncertainty-row-compact">
        <div className="uncertainty-slider-wrapper">
          <div className="uncertainty-slider-track" />
          <div
            className="uncertainty-slider-fill-compact"
            style={{ width: `${uncertainty}%` }}
          />
          <div
            className="uncertainty-slider-thumb"
            style={{ left: `${uncertainty}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={uncertainty}
            onChange={handleSliderChange}
            className="uncertainty-slider-input"
          />
        </div>
        <span className="uncertainty-percent">±{uncertainty}%</span>
      </div>

      {/* Calculator Grid */}
      <div className="calc-grid-unified">
        {/* Row 1 */}
        <button className="calc-key-unified" onClick={() => handleDigit('7')}>7</button>
        <button className="calc-key-unified" onClick={() => handleDigit('8')}>8</button>
        <button className="calc-key-unified" onClick={() => handleDigit('9')}>9</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${pendingOperator === '÷' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('÷')}
        >÷</button>

        {/* Row 2 */}
        <button className="calc-key-unified" onClick={() => handleDigit('4')}>4</button>
        <button className="calc-key-unified" onClick={() => handleDigit('5')}>5</button>
        <button className="calc-key-unified" onClick={() => handleDigit('6')}>6</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${pendingOperator === '×' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('×')}
        >×</button>

        {/* Row 3 */}
        <button className="calc-key-unified" onClick={() => handleDigit('1')}>1</button>
        <button className="calc-key-unified" onClick={() => handleDigit('2')}>2</button>
        <button className="calc-key-unified" onClick={() => handleDigit('3')}>3</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${pendingOperator === '−' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('−')}
        >−</button>

        {/* Row 4 */}
        <button className="calc-key-unified" onClick={handleDecimal}>.</button>
        <button className="calc-key-unified" onClick={() => handleDigit('0')}>0</button>
        <button className="calc-key-unified calc-key-backspace-unified" onClick={handleBackspace}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
            <line x1="18" y1="9" x2="12" y2="15"></line>
            <line x1="12" y1="9" x2="18" y2="15"></line>
          </svg>
        </button>
        <button
          className={`calc-key-unified calc-key-op-unified ${pendingOperator === '+' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('+')}
        >+</button>

        {/* Row 5: CLR, =, Submit */}
        <button className="calc-key-unified calc-key-clear-unified" onClick={handleClear}>CLR</button>
        <button className="calc-key-unified calc-key-equals-unified" onClick={handleEquals}>=</button>
        <button
          className="calc-key-unified calc-key-submit-unified"
          onClick={handleSubmit}
          disabled={!hasValidEstimate}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}

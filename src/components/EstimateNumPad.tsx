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

// Evaluate expression with PEMDAS using JavaScript's native operator precedence
function evaluateExpression(tokens: string[]): number {
  if (tokens.length === 0) return 0;

  // Convert display operators to JS operators and remove commas
  const jsExpr = tokens.join(' ')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, ''); // Remove commas from numbers

  // Use Function constructor for safe math evaluation
  // This handles PEMDAS automatically
  try {
    const result = new Function(`return (${jsExpr})`)();
    if (typeof result === 'number' && isFinite(result)) {
      // Round to avoid floating point issues
      return Math.round(result * 1e9) / 1e9;
    }
    return 0;
  } catch {
    return 0;
  }
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
  // Core state - the final estimate value (result after =)
  const [estimate, setEstimate] = useState<string>('');
  const [uncertainty, setUncertainty] = useState<number>(0);

  // Expression builder state
  const [expression, setExpression] = useState<string[]>([]); // e.g., ['12', '×', '12', '+']
  const [currentInput, setCurrentInput] = useState<string>(''); // Current number being typed

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // The effective estimate is either currentInput (while typing) or estimate (after =)
  const effectiveEstimate = currentInput || estimate;

  // Computed bounds - use effective estimate
  const bounds = useMemo(() => computeBounds(effectiveEstimate, uncertainty), [effectiveEstimate, uncertainty]);

  // Check if we have a valid estimate for submission (need finalized estimate)
  const hasValidEstimate = estimate !== '' && !isNaN(parseFormattedNumber(estimate));

  // Check if we have any valid number to show bounds for (including currentInput)
  const hasValidNumber = effectiveEstimate !== '' && !isNaN(parseFormattedNumber(effectiveEstimate));

  // Notify parent of bounds changes
  useEffect(() => {
    if (onBoundsChange) {
      if (hasValidNumber) {
        const estimateValue = parseFormattedNumber(effectiveEstimate);
        onBoundsChange({
          lower: bounds.lower,
          upper: bounds.upper,
          estimate: estimateValue,
          uncertainty,
          hasValidEstimate: hasValidNumber
        });
      } else {
        onBoundsChange(null);
      }
    }
  }, [bounds, uncertainty, hasValidNumber, effectiveEstimate, onBoundsChange]);

  // Display value: show currentInput while typing, or estimate if finalized
  const displayValue = currentInput || estimate || '0';

  // History bar content: show the full expression being built
  const historyDisplay = useMemo(() => {
    const parts = [...expression];
    if (currentInput) {
      parts.push(formatWithCommas(currentInput));
    }
    return parts.join(' ');
  }, [expression, currentInput]);

  // Check if last token in expression is an operator
  const isOperator = (token: string) => ['+', '−', '×', '÷'].includes(token);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    const newInput = currentInput + digit;
    setCurrentInput(formatWithCommas(newInput.replace(/,/g, '')));
  }, [currentInput]);

  // Handle decimal point
  const handleDecimal = useCallback(() => {
    if (!currentInput.includes('.')) {
      if (currentInput === '') {
        setCurrentInput('0.');
      } else {
        setCurrentInput(currentInput + '.');
      }
    }
  }, [currentInput]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (currentInput) {
      // Remove last character from current input
      const raw = currentInput.replace(/,/g, '');
      const newValue = raw.slice(0, -1);
      setCurrentInput(formatWithCommas(newValue));
    } else if (expression.length > 0) {
      // Remove last token from expression
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        // Remove operator
        setExpression(prev => prev.slice(0, -1));
      } else {
        // Put the number back into currentInput for editing
        setCurrentInput(lastToken);
        setExpression(prev => prev.slice(0, -1));
      }
    }
  }, [currentInput, expression]);

  // Handle clear
  const handleClear = useCallback(() => {
    setEstimate('');
    setExpression([]);
    setCurrentInput('');
  }, []);

  // Handle operator
  const handleOperator = useCallback((op: string) => {
    if (currentInput) {
      // Add current input and operator to expression
      setExpression(prev => [...prev, formatWithCommas(currentInput.replace(/,/g, '')), op]);
      setCurrentInput('');
    } else if (expression.length > 0) {
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        // Replace last operator if user changes their mind
        setExpression(prev => [...prev.slice(0, -1), op]);
      } else {
        // Add operator after number
        setExpression(prev => [...prev, op]);
      }
    } else if (estimate) {
      // Start new expression with previous result
      setExpression([estimate, op]);
      setEstimate('');
    }
  }, [currentInput, expression, estimate]);

  // Handle equals
  const handleEquals = useCallback(() => {
    // Build full expression
    let fullExpr = [...expression];
    if (currentInput) {
      fullExpr.push(formatWithCommas(currentInput.replace(/,/g, '')));
    }

    // Remove trailing operator if present
    if (fullExpr.length > 0 && isOperator(fullExpr[fullExpr.length - 1])) {
      fullExpr = fullExpr.slice(0, -1);
    }

    if (fullExpr.length === 0) return;

    const result = evaluateExpression(fullExpr);
    setEstimate(formatWithCommas(String(result)));
    setExpression([]);
    setCurrentInput('');
  }, [expression, currentInput]);

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

    // If uncertainty is 0, show confirmation modal
    if (uncertainty === 0) {
      setShowConfirmModal(true);
      return;
    }

    // Use overrides if provided, otherwise use computed bounds
    const finalLower = lowerOverride !== null && lowerOverride !== undefined ? lowerOverride : bounds.lower;
    const finalUpper = upperOverride !== null && upperOverride !== undefined ? upperOverride : bounds.upper;

    onSubmit(finalLower, finalUpper);
    // Reset for next question
    setEstimate('');
    setUncertainty(0);
    setExpression([]);
    setCurrentInput('');
  }, [hasValidEstimate, bounds, onSubmit, lowerOverride, upperOverride, uncertainty]);

  // Confirm submission without uncertainty
  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmModal(false);

    const finalLower = lowerOverride !== null && lowerOverride !== undefined ? lowerOverride : bounds.lower;
    const finalUpper = upperOverride !== null && upperOverride !== undefined ? upperOverride : bounds.upper;

    onSubmit(finalLower, finalUpper);
    // Reset for next question
    setEstimate('');
    setUncertainty(0);
    setExpression([]);
    setCurrentInput('');
  }, [bounds, onSubmit, lowerOverride, upperOverride]);

  // Cancel submission
  const handleCancelSubmit = useCallback(() => {
    setShowConfirmModal(false);
  }, []);


  // Are we mid-calculation? Only when we have operators in the expression
  const isCalculating = expression.length > 0;

  // Increment/decrement uncertainty by 1%
  const handleIncrementUncertainty = useCallback(() => {
    setUncertainty(prev => Math.min(100, prev + 1));
    if (onClearOverrides) onClearOverrides();
  }, [onClearOverrides]);

  const handleDecrementUncertainty = useCallback(() => {
    setUncertainty(prev => Math.max(0, prev - 1));
    if (onClearOverrides) onClearOverrides();
  }, [onClearOverrides]);

  return (
    <div className="estimate-numpad-container">
      {/* Estimate Display - always same size, just hide slider elements when calculating */}
      <div className="estimate-display-row">
        {/* Up/down arrows for fine-grained uncertainty adjustment */}
        <div
          className="uncertainty-arrows"
          style={{ visibility: isCalculating ? 'hidden' : 'visible' }}
        >
          <button
            className="uncertainty-arrow-btn"
            onClick={handleIncrementUncertainty}
            aria-label="Increase uncertainty"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button
            className="uncertainty-arrow-btn"
            onClick={handleDecrementUncertainty}
            aria-label="Decrease uncertainty"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <div className="estimate-display-unified">
          {/* Background fill layer - only show when NOT calculating */}
          {!isCalculating && (
            <div
              className={`estimate-uncertainty-fill ${uncertainty === 0 ? 'estimate-uncertainty-fill-initial' : ''}`}
              style={{ width: uncertainty === 0 ? '12px' : `${uncertainty}%` }}
            />
          )}

          {/* Number display (on top of fill) */}
          <div className="estimate-value-unified">
            {isCalculating ? historyDisplay : displayValue}
          </div>

          {/* Hidden range input for drag interaction - only when NOT calculating */}
          {!isCalculating && (
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={uncertainty}
              onChange={handleSliderChange}
              className="estimate-uncertainty-input"
            />
          )}
        </div>

        {/* Percentage label - always present for consistent width, but invisible when calculating */}
        <span
          className="uncertainty-percent-label"
          style={{ visibility: isCalculating ? 'hidden' : 'visible' }}
        >
          ±{Math.round(uncertainty)}%
        </span>
      </div>

      {/* Calculator Grid */}
      <div className="calc-grid-unified">
        {/* Row 1 */}
        <button className="calc-key-unified" onClick={() => handleDigit('7')}>7</button>
        <button className="calc-key-unified" onClick={() => handleDigit('8')}>8</button>
        <button className="calc-key-unified" onClick={() => handleDigit('9')}>9</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${expression.length > 0 && expression[expression.length - 1] === '÷' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('÷')}
        >÷</button>

        {/* Row 2 */}
        <button className="calc-key-unified" onClick={() => handleDigit('4')}>4</button>
        <button className="calc-key-unified" onClick={() => handleDigit('5')}>5</button>
        <button className="calc-key-unified" onClick={() => handleDigit('6')}>6</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${expression.length > 0 && expression[expression.length - 1] === '×' ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('×')}
        >×</button>

        {/* Row 3 */}
        <button className="calc-key-unified" onClick={() => handleDigit('1')}>1</button>
        <button className="calc-key-unified" onClick={() => handleDigit('2')}>2</button>
        <button className="calc-key-unified" onClick={() => handleDigit('3')}>3</button>
        <button
          className={`calc-key-unified calc-key-op-unified ${expression.length > 0 && expression[expression.length - 1] === '−' ? 'calc-key-op-active' : ''}`}
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
          className={`calc-key-unified calc-key-op-unified ${expression.length > 0 && expression[expression.length - 1] === '+' ? 'calc-key-op-active' : ''}`}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* Confirmation Modal - shown when submitting with 0% uncertainty */}
      {showConfirmModal && (
        <div className="uncertainty-modal-overlay" onClick={handleCancelSubmit}>
          <div className="uncertainty-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="uncertainty-modal-title">No Uncertainty Set</h3>
            <p className="uncertainty-modal-text">
              You're submitting with 0% uncertainty, meaning your lower and upper bounds are the same.
            </p>

            {/* Visual guide showing how to drag */}
            <div className="uncertainty-modal-demo">
              <div className="demo-bar">
                <div className="demo-fill">
                  <div className="demo-fill-animated"></div>
                </div>
                <div className="demo-value">100</div>
              </div>
              <div className="demo-arrow">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                  <path d="M5 12 L35 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M25 6 L35 12 L25 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="demo-hint">Drag across the bar to set your confidence range</p>
            </div>

            <div className="uncertainty-modal-buttons">
              <button className="uncertainty-modal-btn uncertainty-modal-btn-cancel" onClick={handleCancelSubmit}>
                Go Back
              </button>
              <button className="uncertainty-modal-btn uncertainty-modal-btn-confirm" onClick={handleConfirmSubmit}>
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

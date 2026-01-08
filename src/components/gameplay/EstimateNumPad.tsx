// EstimateNumPad - Unified estimate + uncertainty slider component
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

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
  // Bound editing props - when user clicks on a bound to edit it directly
  editingBound?: 'lower' | 'upper' | null;
  boundEditValue?: string;
  hasStartedTypingBound?: boolean;
  onBoundEditChange?: (value: string) => void;
  onBoundEditComplete?: () => void;
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

  // Round uncertainty to match displayed value (avoids confusing decimals like 10.1 instead of 10)
  const roundedUncertainty = Math.round(uncertainty);
  const margin = Math.abs(value) * (roundedUncertainty / 100);
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
    .replace(/\^/g, '**') // Power operator
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
  onClearOverrides,
  editingBound,
  boundEditValue,
  hasStartedTypingBound,
  onBoundEditChange,
  onBoundEditComplete
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

  // Check if we have a valid estimate for submission (any valid number, not just finalized)
  const hasValidEstimate = effectiveEstimate !== '' && !isNaN(parseFormattedNumber(effectiveEstimate));

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
  const isOperator = (token: string) => ['+', '−', '×', '÷', '^'].includes(token);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    // Route to bound editing if active
    if (editingBound && onBoundEditChange) {
      // If user hasn't started typing yet, replace the displayed value entirely
      if (!hasStartedTypingBound) {
        onBoundEditChange(digit);
      } else {
        const currentVal = (boundEditValue || '').replace(/,/g, '');
        const newVal = currentVal + digit;
        onBoundEditChange(formatWithCommas(newVal));
      }
      return;
    }
    const newInput = currentInput + digit;
    setCurrentInput(formatWithCommas(newInput.replace(/,/g, '')));
  }, [currentInput, editingBound, boundEditValue, hasStartedTypingBound, onBoundEditChange]);

  // Handle decimal point
  const handleDecimal = useCallback(() => {
    // Route to bound editing if active
    if (editingBound && onBoundEditChange) {
      // If user hasn't started typing yet, start fresh with "0."
      if (!hasStartedTypingBound) {
        onBoundEditChange('0.');
        return;
      }
      const currentVal = boundEditValue || '';
      if (!currentVal.includes('.')) {
        if (currentVal === '') {
          onBoundEditChange('0.');
        } else {
          onBoundEditChange(currentVal + '.');
        }
      }
      return;
    }
    if (!currentInput.includes('.')) {
      if (currentInput === '') {
        setCurrentInput('0.');
      } else {
        setCurrentInput(currentInput + '.');
      }
    }
  }, [currentInput, editingBound, boundEditValue, hasStartedTypingBound, onBoundEditChange]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    // Route to bound editing if active
    if (editingBound && onBoundEditChange) {
      const currentVal = (boundEditValue || '').replace(/,/g, '');
      const newVal = currentVal.slice(0, -1);
      onBoundEditChange(formatWithCommas(newVal));
      return;
    }
    if (currentInput) {
      // Remove last character from current input
      const raw = currentInput.replace(/,/g, '');
      const newValue = raw.slice(0, -1);
      setCurrentInput(formatWithCommas(newValue));
    } else if (expression.length > 0) {
      // Remove last token from expression
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        // Remove operator and put previous number back into currentInput for editing
        const newExpression = expression.slice(0, -1);
        if (newExpression.length > 0) {
          const prevNumber = newExpression[newExpression.length - 1];
          if (!isOperator(prevNumber)) {
            // Move the number to currentInput so user can edit it
            setCurrentInput(prevNumber);
            setExpression(newExpression.slice(0, -1));
          } else {
            setExpression(newExpression);
          }
        } else {
          setExpression(newExpression);
        }
      } else {
        // Put the number back into currentInput for editing
        setCurrentInput(lastToken);
        setExpression(prev => prev.slice(0, -1));
      }
    }
  }, [currentInput, expression, editingBound, boundEditValue, onBoundEditChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    // Route to bound editing if active
    if (editingBound && onBoundEditChange) {
      onBoundEditChange('');
      return;
    }
    setEstimate('');
    setExpression([]);
    setCurrentInput('');
  }, [editingBound, onBoundEditChange]);

  // Handle operator
  const handleOperator = useCallback((op: string) => {
    if (currentInput) {
      // Add current input and operator to expression
      setExpression(prev => [...prev, formatWithCommas(currentInput.replace(/,/g, '')), op]);
      setCurrentInput('');
    } else if (expression.length > 0) {
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        // Special case: × + × = ^ (power)
        if (lastToken === '×' && op === '×') {
          setExpression(prev => [...prev.slice(0, -1), '^']);
        } else {
          // Replace last operator if user changes their mind
          setExpression(prev => [...prev.slice(0, -1), op]);
        }
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
    // Complete bound editing if active
    if (editingBound && onBoundEditComplete) {
      onBoundEditComplete();
      return;
    }

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
  }, [expression, currentInput, editingBound, onBoundEditComplete]);

  // Ref for the slider container
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Handle slider change from range input
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setUncertainty(Number(target.value));
    // Clear any manual overrides when slider is adjusted
    if (onClearOverrides) {
      onClearOverrides();
    }
  }, [onClearOverrides]);

  // Calculate uncertainty from pointer position
  const calculateUncertaintyFromPointer = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setUncertainty(Math.round(percentage * 2) / 2); // Round to 0.5
    if (onClearOverrides) {
      onClearOverrides();
    }
  }, [onClearOverrides]);

  // Pointer event handlers for smoother drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateUncertaintyFromPointer(e.clientX);
  }, [calculateUncertaintyFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    calculateUncertaintyFromPointer(e.clientX);
  }, [calculateUncertaintyFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

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

  // Calculate dynamic font size based on text length
  const dynamicFontSize = useMemo(() => {
    const text = isCalculating ? historyDisplay : displayValue;
    const charCount = text.length;

    // Base font size is 1.35rem
    const baseFontSize = 1.35;
    const minFontSize = 0.75; // Minimum before wrapping

    // Start shrinking after ~12 characters
    const shrinkStartChars = 12;
    const shrinkRate = 0.04; // rem per character over threshold

    if (charCount <= shrinkStartChars) {
      return baseFontSize;
    }

    const reduction = (charCount - shrinkStartChars) * shrinkRate;
    return Math.max(minFontSize, baseFontSize - reduction);
  }, [isCalculating, historyDisplay, displayValue]);

  // Increment/decrement uncertainty by 1%
  const handleIncrementUncertainty = useCallback(() => {
    setUncertainty(prev => Math.min(100, prev + 1));
    if (onClearOverrides) onClearOverrides();
  }, [onClearOverrides]);

  const handleDecrementUncertainty = useCallback(() => {
    setUncertainty(prev => Math.max(0, prev - 1));
    if (onClearOverrides) onClearOverrides();
  }, [onClearOverrides]);

  // Keyboard support for desktop users
  useEffect(() => {
    if (isTouch) return; // Only enable keyboard on desktop

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard events when user is typing in an input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const key = e.key;

      // Digits 0-9
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigit(key);
      }
      // Decimal point
      else if (key === '.') {
        e.preventDefault();
        handleDecimal();
      }
      // Operators
      else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      }
      else if (key === '-') {
        e.preventDefault();
        handleOperator('−'); // Unicode minus
      }
      else if (key === '*') {
        e.preventDefault();
        handleOperator('×'); // Unicode multiplication
      }
      else if (key === '/') {
        e.preventDefault();
        handleOperator('÷'); // Unicode division
      }
      else if (key === '^') {
        e.preventDefault();
        handleOperator('^');
      }
      // Evaluate
      else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      }
      // Backspace
      else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
      // Clear (Escape or C)
      else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
      // Arrow keys for uncertainty adjustment
      else if (key === 'ArrowUp' || key === 'ArrowRight') {
        e.preventDefault();
        handleIncrementUncertainty();
      }
      else if (key === 'ArrowDown' || key === 'ArrowLeft') {
        e.preventDefault();
        handleDecrementUncertainty();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTouch,
    handleDigit,
    handleDecimal,
    handleOperator,
    handleEquals,
    handleBackspace,
    handleClear,
    handleIncrementUncertainty,
    handleDecrementUncertainty
  ]);

  // Show uncertainty controls only when there's a valid estimate and not calculating
  const showUncertaintyControls = hasValidEstimate && !isCalculating;

  return (
    <div className="estimate-numpad-container">
      {/* Estimate Display - always same size, just hide slider elements when calculating or no estimate */}
      <div className="estimate-display-row">
        <div
          ref={sliderRef}
          className="estimate-display-unified"
          onPointerDown={showUncertaintyControls ? handlePointerDown : undefined}
          onPointerMove={showUncertaintyControls ? handlePointerMove : undefined}
          onPointerUp={showUncertaintyControls ? handlePointerUp : undefined}
          onPointerCancel={showUncertaintyControls ? handlePointerUp : undefined}
          style={{ touchAction: showUncertaintyControls ? 'none' : 'auto' }}
        >
          {/* Background fill layer - only show when uncertainty controls are visible */}
          {showUncertaintyControls && (
            <div
              className={`estimate-uncertainty-fill ${uncertainty === 0 ? 'estimate-uncertainty-fill-initial' : ''}`}
              style={{ width: uncertainty === 0 ? '12px' : `${uncertainty}%` }}
            />
          )}

          {/* Uncertainty bulb - floating above the slider at the current position */}
          {showUncertaintyControls && (
            <div
              className={`uncertainty-bulb-container ${uncertainty === 0 ? 'uncertainty-bulb-initial' : ''}`}
              style={{ left: `clamp(23px, ${uncertainty === 0 ? '6px' : `${uncertainty}%`}, calc(100% - 23px))` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="uncertainty-bulb">
                ±{Math.round(uncertainty)}%
              </div>
              <div className="uncertainty-stem" />
            </div>
          )}

          {/* Number display (on top of fill) */}
          <div
            className="estimate-value-unified"
            style={{ fontSize: `${dynamicFontSize}rem` }}
          >
            {isCalculating ? historyDisplay : displayValue}
          </div>
        </div>
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
          className={`calc-key-unified calc-key-op-unified ${expression.length > 0 && (expression[expression.length - 1] === '×' || expression[expression.length - 1] === '^') ? 'calc-key-op-active' : ''}`}
          onClick={() => handleOperator('×')}
        >{expression.length > 0 && expression[expression.length - 1] === '×' ? '^' : '×'}</button>

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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

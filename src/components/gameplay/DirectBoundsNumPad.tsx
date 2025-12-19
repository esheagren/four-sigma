// DirectBoundsNumPad - Direct lower/upper bound entry component
import { useState, useCallback, useEffect, useMemo } from 'react';

interface DirectBoundsNumPadProps {
  onSubmit: (lower: number, upper: number) => void;
  isTouch: boolean;
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
  if (isNaN(value) || !isFinite(value)) return '0';

  const absValue = Math.abs(value);
  // Use exponential for extremely large numbers (>= 1 quadrillion)
  if (absValue >= 1e15) {
    return value.toExponential(2);
  } else if (absValue >= 1e12) {
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

// Calculate dynamic font size for bound buttons based on text length
function calculateBoundFontSize(text: string): number {
  const charCount = text.length;
  const baseFontSize = 1.1; // rem (matches CSS)
  const minFontSize = 0.65;
  const shrinkStartChars = 8;
  const shrinkRate = 0.05;

  if (charCount <= shrinkStartChars) return baseFontSize;
  return Math.max(minFontSize, baseFontSize - (charCount - shrinkStartChars) * shrinkRate);
}

// Evaluate expression with PEMDAS using JavaScript's native operator precedence
function evaluateExpression(tokens: string[]): number {
  if (tokens.length === 0) return 0;

  // Convert display operators to JS operators and remove commas
  const jsExpr = tokens.join(' ')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^/g, '**')
    .replace(/,/g, '');

  try {
    const result = new Function(`return (${jsExpr})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return Math.round(result * 1e9) / 1e9;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function DirectBoundsNumPad({ onSubmit, isTouch }: DirectBoundsNumPadProps) {
  // Bound values
  const [lowerValue, setLowerValue] = useState<string>('');
  const [upperValue, setUpperValue] = useState<string>('');

  // Which bound is selected for input
  const [selectedBound, setSelectedBound] = useState<'lower' | 'upper'>('lower');

  // Expression builder state (for calculator functionality)
  const [expression, setExpression] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');

  // Get current value and setter based on selected bound
  const currentValue = selectedBound === 'lower' ? lowerValue : upperValue;
  const setCurrentValue = selectedBound === 'lower' ? setLowerValue : setUpperValue;

  // Check if last token in expression is an operator
  const isOperator = (token: string) => ['+', '−', '×', '÷', '^'].includes(token);

  // Are we mid-calculation?
  const isCalculating = expression.length > 0;

  // Display value for the current expression or input
  const displayValue = useMemo(() => {
    if (isCalculating) {
      const parts = [...expression];
      if (currentInput) {
        parts.push(formatWithCommas(currentInput));
      }
      return parts.join(' ');
    }
    return currentInput || currentValue || '0';
  }, [expression, currentInput, currentValue, isCalculating]);

  // Calculate dynamic font size based on text length (for expression display)
  const dynamicFontSize = useMemo(() => {
    const text = displayValue;
    const charCount = text.length;
    const baseFontSize = 1.35;
    const minFontSize = 0.75;
    const shrinkStartChars = 12;
    const shrinkRate = 0.04;

    if (charCount <= shrinkStartChars) {
      return baseFontSize;
    }

    const reduction = (charCount - shrinkStartChars) * shrinkRate;
    return Math.max(minFontSize, baseFontSize - reduction);
  }, [displayValue]);

  // Compute display text for each bound independently
  const lowerDisplayText = useMemo(() => {
    if (selectedBound === 'lower') {
      // This bound is active - show current typing/expression
      if (isCalculating) {
        const parts = [...expression];
        if (currentInput) {
          parts.push(formatWithCommas(currentInput));
        }
        return parts.join(' ');
      }
      if (currentInput) {
        return currentInput;
      }
    }
    // Not active or no input - show saved value
    return lowerValue ? formatDisplay(parseFormattedNumber(lowerValue)) : '0';
  }, [selectedBound, isCalculating, expression, currentInput, lowerValue]);

  const upperDisplayText = useMemo(() => {
    if (selectedBound === 'upper') {
      // This bound is active - show current typing/expression
      if (isCalculating) {
        const parts = [...expression];
        if (currentInput) {
          parts.push(formatWithCommas(currentInput));
        }
        return parts.join(' ');
      }
      if (currentInput) {
        return currentInput;
      }
    }
    // Not active or no input - show saved value
    return upperValue ? formatDisplay(parseFormattedNumber(upperValue)) : '0';
  }, [selectedBound, isCalculating, expression, currentInput, upperValue]);

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
      const raw = currentInput.replace(/,/g, '');
      const newValue = raw.slice(0, -1);
      setCurrentInput(formatWithCommas(newValue));
    } else if (expression.length > 0) {
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        const newExpression = expression.slice(0, -1);
        if (newExpression.length > 0) {
          const prevNumber = newExpression[newExpression.length - 1];
          if (!isOperator(prevNumber)) {
            setCurrentInput(prevNumber);
            setExpression(newExpression.slice(0, -1));
          } else {
            setExpression(newExpression);
          }
        } else {
          setExpression(newExpression);
        }
      } else {
        setCurrentInput(lastToken);
        setExpression(prev => prev.slice(0, -1));
      }
    }
  }, [currentInput, expression]);

  // Handle clear
  const handleClear = useCallback(() => {
    setExpression([]);
    setCurrentInput('');
  }, []);

  // Handle operator
  const handleOperator = useCallback((op: string) => {
    if (currentInput) {
      setExpression(prev => [...prev, formatWithCommas(currentInput.replace(/,/g, '')), op]);
      setCurrentInput('');
    } else if (expression.length > 0) {
      const lastToken = expression[expression.length - 1];
      if (isOperator(lastToken)) {
        if (lastToken === '×' && op === '×') {
          setExpression(prev => [...prev.slice(0, -1), '^']);
        } else {
          setExpression(prev => [...prev.slice(0, -1), op]);
        }
      } else {
        setExpression(prev => [...prev, op]);
      }
    } else if (currentValue) {
      // Start new expression with current bound value
      setExpression([currentValue, op]);
    }
  }, [currentInput, expression, currentValue]);

  // Handle equals - finalize expression into selected bound
  const handleEquals = useCallback(() => {
    let fullExpr = [...expression];
    if (currentInput) {
      fullExpr.push(formatWithCommas(currentInput.replace(/,/g, '')));
    }

    // Remove trailing operator if present
    if (fullExpr.length > 0 && isOperator(fullExpr[fullExpr.length - 1])) {
      fullExpr = fullExpr.slice(0, -1);
    }

    if (fullExpr.length === 0) {
      // If just typing a number without expression, save it
      if (currentInput) {
        setCurrentValue(formatWithCommas(currentInput.replace(/,/g, '')));
        setCurrentInput('');
      }
      return;
    }

    const result = evaluateExpression(fullExpr);
    setCurrentValue(formatWithCommas(String(result)));
    setExpression([]);
    setCurrentInput('');
  }, [expression, currentInput, setCurrentValue]);

  // Handle bound selection
  const handleSelectBound = useCallback((bound: 'lower' | 'upper') => {
    // First, save current input if any
    if (currentInput || expression.length > 0) {
      let fullExpr = [...expression];
      if (currentInput) {
        fullExpr.push(formatWithCommas(currentInput.replace(/,/g, '')));
      }
      if (fullExpr.length > 0 && isOperator(fullExpr[fullExpr.length - 1])) {
        fullExpr = fullExpr.slice(0, -1);
      }
      if (fullExpr.length > 0) {
        const result = evaluateExpression(fullExpr);
        setCurrentValue(formatWithCommas(String(result)));
      } else if (currentInput) {
        setCurrentValue(formatWithCommas(currentInput.replace(/,/g, '')));
      }
    }

    // Reset expression state
    setExpression([]);
    setCurrentInput('');
    setSelectedBound(bound);
  }, [currentInput, expression, setCurrentValue]);

  // Check if we can submit
  const canSubmit = useMemo(() => {
    const lower = parseFormattedNumber(lowerValue);
    const upper = parseFormattedNumber(upperValue);
    return !isNaN(lower) && !isNaN(upper) && lowerValue !== '' && upperValue !== '';
  }, [lowerValue, upperValue]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    // First finalize any pending input
    if (currentInput || expression.length > 0) {
      let fullExpr = [...expression];
      if (currentInput) {
        fullExpr.push(formatWithCommas(currentInput.replace(/,/g, '')));
      }
      if (fullExpr.length > 0 && isOperator(fullExpr[fullExpr.length - 1])) {
        fullExpr = fullExpr.slice(0, -1);
      }
      if (fullExpr.length > 0) {
        const result = evaluateExpression(fullExpr);
        setCurrentValue(formatWithCommas(String(result)));
      } else if (currentInput) {
        setCurrentValue(formatWithCommas(currentInput.replace(/,/g, '')));
      }
      setExpression([]);
      setCurrentInput('');
      // Wait for state to update before checking submission
      return;
    }

    const lower = parseFormattedNumber(lowerValue);
    const upper = parseFormattedNumber(upperValue);

    if (isNaN(lower) || isNaN(upper)) return;

    // Auto-swap if lower > upper
    if (lower > upper) {
      onSubmit(upper, lower);
    } else {
      onSubmit(lower, upper);
    }

    // Reset for next question
    setLowerValue('');
    setUpperValue('');
    setExpression([]);
    setCurrentInput('');
    setSelectedBound('lower');
  }, [lowerValue, upperValue, currentInput, expression, onSubmit, setCurrentValue]);

  // Keyboard support
  useEffect(() => {
    if (isTouch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigit(key);
      } else if (key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('−');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (key === '=' || key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey || (canSubmit && !isCalculating && currentInput === '')) {
          handleSubmit();
        } else {
          handleEquals();
        }
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (key === 'Tab') {
        e.preventDefault();
        handleSelectBound(selectedBound === 'lower' ? 'upper' : 'lower');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTouch, handleDigit, handleDecimal, handleOperator, handleEquals,
    handleBackspace, handleClear, handleSubmit, handleSelectBound,
    selectedBound, canSubmit, isCalculating, currentInput
  ]);

  return (
    <div className="direct-bounds-numpad-container">
      {/* Bounds Display Row */}
      <div className="direct-bounds-row">
        <div className="direct-bound-wrapper">
          <span className="direct-bound-label">Lower</span>
          <button
            className={`direct-bound-input direct-bound-input-lower ${selectedBound === 'lower' ? 'selected' : ''}`}
            onClick={() => handleSelectBound('lower')}
            style={{ fontSize: `${calculateBoundFontSize(lowerDisplayText)}rem` }}
          >
            {lowerDisplayText}
          </button>
        </div>

        <span className="direct-bounds-separator">–</span>

        <div className="direct-bound-wrapper">
          <span className="direct-bound-label">Upper</span>
          <button
            className={`direct-bound-input direct-bound-input-upper ${selectedBound === 'upper' ? 'selected' : ''}`}
            onClick={() => handleSelectBound('upper')}
            style={{ fontSize: `${calculateBoundFontSize(upperDisplayText)}rem` }}
          >
            {upperDisplayText}
          </button>
        </div>
      </div>

      {/* Expression display when calculating */}
      {isCalculating && (
        <div className="direct-bounds-expression" style={{ fontSize: `${dynamicFontSize * 0.8}rem` }}>
          {displayValue}
        </div>
      )}

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
          disabled={!canSubmit}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}

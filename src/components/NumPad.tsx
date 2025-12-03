// NumPad component with liquid glass design
import { useState, useCallback, useEffect } from 'react';

interface NumPadProps {
  activeField: 'lower' | 'upper';
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onToggleField: () => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  onUseCalculatorResult: (result: string) => void;
  onSetBothBounds: (lower: string, upper: string) => void;
  onSetSpecificBound: (field: 'lower' | 'upper', value: string) => void;
  isTouch: boolean;
}

export function NumPad({
  activeField,
  onInput,
  onBackspace,
  onToggleField,
  onSubmit,
  isSubmitDisabled,
  onUseCalculatorResult,
  onSetBothBounds,
  onSetSpecificBound,
  isTouch
}: NumPadProps) {
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [tolerance, setTolerance] = useState(0);
  const [previewLower, setPreviewLower] = useState('-');
  const [previewUpper, setPreviewUpper] = useState('-');
  const [isRangeMode, setIsRangeMode] = useState(true); // true = range mode, false = specific guess mode

  // Get the display value (result or expression)
  const displayValue = calcResult || calcExpression;

  // Auto-calculate bounds when displayValue or tolerance changes
  useEffect(() => {
    const val = parseFloat(displayValue);

    if (!isNaN(val) && isFinite(val)) {
      const variance = val * (tolerance / 100);
      const lower = Math.round((val - variance) * 100) / 100;
      const upper = Math.round((val + variance) * 100) / 100;
      setPreviewLower(String(lower));
      setPreviewUpper(String(upper));
    } else {
      setPreviewLower('-');
      setPreviewUpper('-');
    }
  }, [displayValue, tolerance]);

  // Transfer both bounds to main inputs (range mode)
  const handleTransferBounds = useCallback(() => {
    if (previewLower === '-' || previewUpper === '-') return;
    onSetBothBounds(previewLower, previewUpper);
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('');
    setTolerance(0);
  }, [previewLower, previewUpper, onSetBothBounds]);

  // Transfer to specific bound (specific guess mode)
  const handleTransferToLower = useCallback(() => {
    const valueToUse = calcResult || calcExpression;
    if (!valueToUse || valueToUse === 'Error') return;
    onSetSpecificBound('lower', valueToUse);
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('');
  }, [calcResult, calcExpression, onSetSpecificBound]);

  const handleTransferToUpper = useCallback(() => {
    const valueToUse = calcResult || calcExpression;
    if (!valueToUse || valueToUse === 'Error') return;
    onSetSpecificBound('upper', valueToUse);
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('');
  }, [calcResult, calcExpression, onSetSpecificBound]);

  // Evaluate expression when equals is pressed
  const handleEquals = useCallback(() => {
    if (!calcExpression) {
      return;
    }

    try {
      // Replace display operators with JS operators
      let expr = calcExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**');

      // Handle square root: √number -> Math.sqrt(number)
      expr = expr.replace(/√(\d+\.?\d*)/g, 'Math.sqrt($1)');

      // Safely evaluate
      const result = Function('"use strict"; return (' + expr + ')')();

      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        // Round to avoid floating point issues
        const rounded = Math.round(result * 1000000000) / 1000000000;
        setCalcResult(String(rounded));
        setCalcExpression(String(rounded)); // Allow continuing from result
      }
    } catch {
      setCalcResult('Error');
    }
  }, [calcExpression]);

  const handleCalcDigit = useCallback((digit: string) => {
    // Clear result when starting new input
    if (calcResult) {
      setCalcResult('');
    }
    setCalcExpression(prev => prev + digit);
  }, [calcResult]);

  const handleCalcDecimal = useCallback(() => {
    // Check if current number already has decimal
    const parts = calcExpression.split(/[+\-×÷^√]/);
    const currentNum = parts[parts.length - 1];
    if (!currentNum.includes('.')) {
      setCalcExpression(prev => prev + '.');
    }
  }, [calcExpression]);

  const handleCalcOperator = useCallback((op: string) => {
    // Don't allow operator at start (except minus for negative)
    if (!calcExpression && op !== '−') return;

    // Clear result when adding operator (continuing calculation)
    if (calcResult) {
      setCalcResult('');
    }

    // Replace last operator if there is one
    const lastChar = calcExpression.slice(-1);
    if (['+', '−', '×', '÷', '^', '√'].includes(lastChar)) {
      setCalcExpression(prev => prev.slice(0, -1) + op);
    } else {
      setCalcExpression(prev => prev + op);
    }
  }, [calcExpression, calcResult]);

  const handleCalcBackspace = useCallback(() => {
    setCalcExpression(prev => prev.slice(0, -1));
  }, []);

  const handleCalcClear = useCallback(() => {
    setCalcExpression('');
    setCalcResult('');
  }, []);

  const handleUseResult = useCallback(() => {
    const valueToUse = calcResult || calcExpression;
    if (valueToUse && valueToUse !== 'Error') {
      onUseCalculatorResult(valueToUse);
    }
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('');
  }, [calcResult, calcExpression, onUseCalculatorResult]);

  const handleExitCalculator = useCallback(() => {
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('');
  }, []);

  // Format display number with commas
  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // Handle very large or small numbers with scientific notation
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(4);
    }

    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Format expression for display
  const formatExpression = (expr: string) => {
    if (!expr) return '';
    // Add spaces around operators for readability
    return expr.replace(/([+\-×÷^√])/g, ' $1 ').trim();
  };

  // Desktop mode: show compact action bar with just submit and calculator
  if (!isTouch && !isCalculatorMode) {
    return (
      <div className="desktop-actions-container">
        <div className="desktop-actions">
          <button
            className="numpad-calc-btn"
            onClick={() => setIsCalculatorMode(true)}
            title="Open calculator"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"></rect>
              <line x1="8" y1="6" x2="16" y2="6"></line>
              <line x1="8" y1="10" x2="8" y2="10.01"></line>
              <line x1="12" y1="10" x2="12" y2="10.01"></line>
              <line x1="16" y1="10" x2="16" y2="10.01"></line>
              <line x1="8" y1="14" x2="8" y2="14.01"></line>
              <line x1="12" y1="14" x2="12" y2="14.01"></line>
              <line x1="16" y1="14" x2="16" y2="14.01"></line>
              <line x1="8" y1="18" x2="8" y2="18.01"></line>
              <line x1="12" y1="18" x2="12" y2="18.01"></line>
              <line x1="16" y1="18" x2="16" y2="18.01"></line>
            </svg>
          </button>
          <button
            className="desktop-submit-btn"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
          >
            Submit
          </button>
          <span className="desktop-hint">Press Enter to submit</span>
        </div>
      </div>
    );
  }

  if (isCalculatorMode) {
    // Desktop: horizontal calculator bar + submit bar below
    if (!isTouch) {
      return (
        <>
          <div className="desktop-calc-bar">
            <button className="desktop-calc-close" onClick={handleExitCalculator}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="desktop-calc-display">
              {calcResult ? formatNumber(calcResult) : (calcExpression || '0')}
            </div>
            <button className="desktop-calc-paste" onClick={handleUseResult}>Paste</button>
            <div className="desktop-calc-divider"></div>
            <div className="desktop-calc-digits">
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('7')}>7</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('8')}>8</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('9')}>9</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('4')}>4</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('5')}>5</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('6')}>6</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('1')}>1</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('2')}>2</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('3')}>3</button>
              <button className="desktop-calc-key" onClick={() => handleCalcDigit('0')}>0</button>
              <button className="desktop-calc-key" onClick={handleCalcDecimal}>.</button>
              <button className="desktop-calc-key desktop-calc-backspace" onClick={handleCalcBackspace}>⌫</button>
            </div>
            <div className="desktop-calc-divider"></div>
            <div className="desktop-calc-ops">
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('+')}>+</button>
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('−')}>−</button>
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('×')}>×</button>
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('÷')}>÷</button>
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('^')}>^</button>
              <button className="desktop-calc-key desktop-calc-op" onClick={() => handleCalcOperator('√')}>√</button>
            </div>
            <div className="desktop-calc-divider"></div>
            <button className="desktop-calc-key desktop-calc-clear" onClick={handleCalcClear}>C</button>
            <button className="desktop-calc-key desktop-calc-equals" onClick={handleEquals}>=</button>
          </div>
          <div className="desktop-actions-container">
            <div className="desktop-actions">
              <button
                className="desktop-submit-btn"
                onClick={onSubmit}
                disabled={isSubmitDisabled}
              >
                Submit
              </button>
              <span className="desktop-hint">Press Enter to submit</span>
            </div>
          </div>
        </>
      );
    }

    // Mobile: full-screen vertical calculator with split bounds
    const hasValue = (calcResult || calcExpression) && calcExpression !== '' && calcResult !== 'Error';

    return (
      <div className="numpad-container">
        <div className="numpad numpad-calculator">
          {/* Header: Mode Toggle and Close */}
          <div className="calc-header">
            <div className="calc-mode-toggle">
              <button
                className={`calc-mode-btn ${isRangeMode ? 'calc-mode-btn-active' : ''}`}
                onClick={() => setIsRangeMode(true)}
                title="Range mode"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M5 12l4-4"></path>
                  <path d="M5 12l4 4"></path>
                  <path d="M19 12l-4-4"></path>
                  <path d="M19 12l-4 4"></path>
                </svg>
              </button>
              <button
                className={`calc-mode-btn ${!isRangeMode ? 'calc-mode-btn-active' : ''}`}
                onClick={() => setIsRangeMode(false)}
                title="Specific guess mode"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </button>
            </div>
            <button className="calc-close-btn" onClick={handleExitCalculator}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Range Mode UI */}
          {isRangeMode ? (
            <>
              <div className="calc-bounds-row">
                <div className="calc-bound-box">
                  <span className="calc-bound-label">LOWER</span>
                  <span className="calc-bound-value">{previewLower}</span>
                </div>
                <button
                  className="calc-transfer-btn"
                  onClick={handleTransferBounds}
                  disabled={previewLower === '-' || previewUpper === '-'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5"></path>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
                <div className="calc-bound-box">
                  <span className="calc-bound-label">UPPER</span>
                  <span className="calc-bound-value">{previewUpper}</span>
                </div>
              </div>

              <div className="calc-tolerance-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="calc-tolerance-slider"
                />
                <span className="calc-tolerance-label">± {tolerance}%</span>
              </div>
            </>
          ) : (
            /* Specific Guess Mode UI */
            <div className="calc-specific-row">
              <button
                className="calc-specific-btn"
                onClick={handleTransferToLower}
                disabled={!hasValue}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <polyline points="12 5 5 12 12 19"></polyline>
                </svg>
                <span className="calc-specific-label">TO LOWER</span>
                <span className="calc-specific-value">{hasValue ? formatNumber(calcResult || calcExpression) : '0'}</span>
              </button>
              <button
                className="calc-specific-btn"
                onClick={handleTransferToUpper}
                disabled={!hasValue}
              >
                <span className="calc-specific-label">TO UPPER</span>
                <span className="calc-specific-value">{hasValue ? formatNumber(calcResult || calcExpression) : '0'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          )}

          {/* Calculator Display */}
          <div className="calc-display">
            <div className="calc-result-row">
              <button className="calc-paste-btn" onClick={handleUseResult}>
                Paste
              </button>
              <div className="calc-result">{calcResult ? formatNumber(calcResult) : (calcExpression || '0')}</div>
            </div>
          </div>

          {/* Calculator Grid */}
          <div className="calc-grid-new">
            {/* Row 1: C ^ √ ÷ */}
            <button className="calc-key calc-key-clear" onClick={handleCalcClear}>C</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('^')}>^</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('√')}>√</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('÷')}>÷</button>

            {/* Row 2: 7 8 9 × */}
            <button className="calc-key" onClick={() => handleCalcDigit('7')}>7</button>
            <button className="calc-key" onClick={() => handleCalcDigit('8')}>8</button>
            <button className="calc-key" onClick={() => handleCalcDigit('9')}>9</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('×')}>×</button>

            {/* Row 3: 4 5 6 - */}
            <button className="calc-key" onClick={() => handleCalcDigit('4')}>4</button>
            <button className="calc-key" onClick={() => handleCalcDigit('5')}>5</button>
            <button className="calc-key" onClick={() => handleCalcDigit('6')}>6</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('−')}>−</button>

            {/* Row 4: 1 2 3 + */}
            <button className="calc-key" onClick={() => handleCalcDigit('1')}>1</button>
            <button className="calc-key" onClick={() => handleCalcDigit('2')}>2</button>
            <button className="calc-key" onClick={() => handleCalcDigit('3')}>3</button>
            <button className="calc-key calc-key-op" onClick={() => handleCalcOperator('+')}>+</button>

            {/* Row 5: 0 (wide) . = */}
            <button className="calc-key calc-key-zero" onClick={() => handleCalcDigit('0')}>0</button>
            <button className="calc-key" onClick={handleCalcDecimal}>.</button>
            <button className="calc-key calc-key-equals" onClick={handleEquals}>=</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="numpad-container">
      <div className="numpad">
        <div className="numpad-grid">
          <button className="numpad-key" onClick={() => onInput('1')}>1</button>
          <button className="numpad-key" onClick={() => onInput('2')}>2</button>
          <button className="numpad-key" onClick={() => onInput('3')}>3</button>
          <button className="numpad-key" onClick={() => onInput('4')}>4</button>
          <button className="numpad-key" onClick={() => onInput('5')}>5</button>
          <button className="numpad-key" onClick={() => onInput('6')}>6</button>
          <button className="numpad-key" onClick={() => onInput('7')}>7</button>
          <button className="numpad-key" onClick={() => onInput('8')}>8</button>
          <button className="numpad-key" onClick={() => onInput('9')}>9</button>
          <button className="numpad-key" onClick={() => onInput('.')}>.</button>
          <button className="numpad-key" onClick={() => onInput('0')}>0</button>
          <button className="numpad-key numpad-key-backspace" onClick={onBackspace}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          </button>
        </div>
        <div className="numpad-actions">
          <button
            className="numpad-calc-btn"
            onClick={() => setIsCalculatorMode(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"></rect>
              <line x1="8" y1="6" x2="16" y2="6"></line>
              <line x1="8" y1="10" x2="8" y2="10.01"></line>
              <line x1="12" y1="10" x2="12" y2="10.01"></line>
              <line x1="16" y1="10" x2="16" y2="10.01"></line>
              <line x1="8" y1="14" x2="8" y2="14.01"></line>
              <line x1="12" y1="14" x2="12" y2="14.01"></line>
              <line x1="16" y1="14" x2="16" y2="14.01"></line>
              <line x1="8" y1="18" x2="8" y2="18.01"></line>
              <line x1="12" y1="18" x2="12" y2="18.01"></line>
              <line x1="16" y1="18" x2="16" y2="18.01"></line>
            </svg>
          </button>
          <button
            className="numpad-submit-btn"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

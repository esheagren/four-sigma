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
  isTouch
}: NumPadProps) {
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState('0');

  // Evaluate expression dynamically
  useEffect(() => {
    if (!calcExpression) {
      setCalcResult('0');
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

      // Don't evaluate if ends with operator
      if (/[+\-*/^]$/.test(expr) || /√$/.test(expr)) {
        return;
      }

      // Safely evaluate
      const result = Function('"use strict"; return (' + expr + ')')();

      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        // Round to avoid floating point issues
        const rounded = Math.round(result * 1000000000) / 1000000000;
        setCalcResult(String(rounded));
      }
    } catch {
      // Invalid expression, keep previous result
    }
  }, [calcExpression]);

  const handleCalcDigit = useCallback((digit: string) => {
    setCalcExpression(prev => prev + digit);
  }, []);

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

    // Replace last operator if there is one
    const lastChar = calcExpression.slice(-1);
    if (['+', '−', '×', '÷', '^', '√'].includes(lastChar)) {
      setCalcExpression(prev => prev.slice(0, -1) + op);
    } else {
      setCalcExpression(prev => prev + op);
    }
  }, [calcExpression]);

  const handleCalcBackspace = useCallback(() => {
    setCalcExpression(prev => prev.slice(0, -1));
  }, []);

  const handleCalcClear = useCallback(() => {
    setCalcExpression('');
    setCalcResult('0');
  }, []);

  const handleUseResult = useCallback(() => {
    onUseCalculatorResult(calcResult);
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('0');
  }, [calcResult, onUseCalculatorResult]);

  const handleExitCalculator = useCallback(() => {
    setIsCalculatorMode(false);
    setCalcExpression('');
    setCalcResult('0');
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
    return (
      <div className={isTouch ? "numpad-container" : "numpad-container numpad-container-desktop"}>
        <div className="numpad numpad-calculator">
          <button className="calc-back-btn" onClick={handleExitCalculator}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="calc-display">
            <div className="calc-result-row">
              <button className="calc-paste-btn" onClick={handleUseResult}>
                Paste
              </button>
              <div className="calc-result">{formatNumber(calcResult)}</div>
            </div>
          </div>
          <div className="calc-grid">
            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('+')}>+</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('7')}>7</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('8')}>8</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('9')}>9</button>

            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('−')}>-</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('4')}>4</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('5')}>5</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('6')}>6</button>

            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('×')}>x</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('1')}>1</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('2')}>2</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('3')}>3</button>

            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('÷')}>÷</button>
            <button className="numpad-key" onClick={() => handleCalcDigit('0')}>0</button>
            <button className="numpad-key" onClick={handleCalcDecimal}>.</button>
            <button className="numpad-key calc-key-backspace" onClick={handleCalcBackspace}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                <line x1="18" y1="9" x2="12" y2="15"></line>
                <line x1="12" y1="9" x2="18" y2="15"></line>
              </svg>
            </button>

            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('^')}>^</button>
            <button className="numpad-key calc-key-op" onClick={() => handleCalcOperator('√')}>√</button>
            <button className="numpad-key calc-key-clear" onClick={handleCalcClear}>C</button>
            <button className="numpad-key calc-key-equals" onClick={() => {}}>
              =
            </button>
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
            className="numpad-toggle-btn"
            onClick={onToggleField}
          >
            {activeField === 'lower' ? 'Upper Bound' : 'Lower Bound'}
          </button>
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

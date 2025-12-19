// SimpleDirectBoundsNumPad - Direct lower/upper bound entry WITHOUT calculator operations
import { useState, useCallback, useEffect, useMemo } from 'react';

interface SimpleDirectBoundsNumPadProps {
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
  const baseFontSize = 1.1;
  const minFontSize = 0.65;
  const shrinkStartChars = 8;
  const shrinkRate = 0.05;

  if (charCount <= shrinkStartChars) return baseFontSize;
  return Math.max(minFontSize, baseFontSize - (charCount - shrinkStartChars) * shrinkRate);
}

export function SimpleDirectBoundsNumPad({ onSubmit, isTouch }: SimpleDirectBoundsNumPadProps) {
  // Bound values
  const [lowerValue, setLowerValue] = useState<string>('');
  const [upperValue, setUpperValue] = useState<string>('');

  // Which bound is selected for input
  const [selectedBound, setSelectedBound] = useState<'lower' | 'upper'>('lower');

  // Current input being typed
  const [currentInput, setCurrentInput] = useState<string>('');

  // Get current value setter based on selected bound
  const setCurrentValue = selectedBound === 'lower' ? setLowerValue : setUpperValue;

  // Compute display text for each bound
  const lowerDisplayText = useMemo(() => {
    if (selectedBound === 'lower' && currentInput) {
      return currentInput;
    }
    return lowerValue ? formatDisplay(parseFormattedNumber(lowerValue)) : '0';
  }, [selectedBound, currentInput, lowerValue]);

  const upperDisplayText = useMemo(() => {
    if (selectedBound === 'upper' && currentInput) {
      return currentInput;
    }
    return upperValue ? formatDisplay(parseFormattedNumber(upperValue)) : '0';
  }, [selectedBound, currentInput, upperValue]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    // If current input is just "0" and we're typing a non-zero digit, replace it
    if (currentInput === '0' && digit !== '0') {
      setCurrentInput(digit);
      return;
    }
    // Don't allow multiple leading zeros
    if (currentInput === '0' && digit === '0') {
      return;
    }
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
    }
  }, [currentInput]);

  // Handle bound selection
  const handleSelectBound = useCallback((bound: 'lower' | 'upper') => {
    if (bound === selectedBound) return;

    // Save current input if any
    if (currentInput) {
      setCurrentValue(formatWithCommas(currentInput.replace(/,/g, '')));
    }

    // Load the new bound's existing value into currentInput for editing
    if (bound === 'lower') {
      setCurrentInput(lowerValue);
      setLowerValue('');
    } else {
      setCurrentInput(upperValue);
      setUpperValue('');
    }

    setSelectedBound(bound);
  }, [currentInput, setCurrentValue, selectedBound, lowerValue, upperValue]);

  // Check if we can submit
  const canSubmit = useMemo(() => {
    const effectiveLower = selectedBound === 'lower' && currentInput ? currentInput : lowerValue;
    const effectiveUpper = selectedBound === 'upper' && currentInput ? currentInput : upperValue;

    const lower = parseFormattedNumber(effectiveLower);
    const upper = parseFormattedNumber(effectiveUpper);

    return !isNaN(lower) && !isNaN(upper) && effectiveLower !== '' && effectiveUpper !== '';
  }, [lowerValue, upperValue, selectedBound, currentInput]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    // First finalize any pending input
    if (currentInput) {
      setCurrentValue(formatWithCommas(currentInput.replace(/,/g, '')));
      setCurrentInput('');
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
    setCurrentInput('');
    setSelectedBound('lower');
  }, [lowerValue, upperValue, currentInput, onSubmit, setCurrentValue]);

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
      } else if (key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Tab') {
        e.preventDefault();
        handleSelectBound(selectedBound === 'lower' ? 'upper' : 'lower');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTouch, handleDigit, handleDecimal,
    handleBackspace, handleSubmit, handleSelectBound,
    selectedBound
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
            <span key={`lower-${lowerDisplayText}`}>{lowerDisplayText}</span>
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
            <span key={`upper-${upperDisplayText}`}>{upperDisplayText}</span>
          </button>
        </div>
      </div>

      {/* Simple Calculator Grid - 3 columns */}
      <div className="calc-grid-unified" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
        {/* Row 1 */}
        <button className="calc-key-unified" onClick={() => handleDigit('7')}>7</button>
        <button className="calc-key-unified" onClick={() => handleDigit('8')}>8</button>
        <button className="calc-key-unified" onClick={() => handleDigit('9')}>9</button>

        {/* Row 2 */}
        <button className="calc-key-unified" onClick={() => handleDigit('4')}>4</button>
        <button className="calc-key-unified" onClick={() => handleDigit('5')}>5</button>
        <button className="calc-key-unified" onClick={() => handleDigit('6')}>6</button>

        {/* Row 3 */}
        <button className="calc-key-unified" onClick={() => handleDigit('1')}>1</button>
        <button className="calc-key-unified" onClick={() => handleDigit('2')}>2</button>
        <button className="calc-key-unified" onClick={() => handleDigit('3')}>3</button>

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

        {/* Row 5 - Submit spans full width */}
        <button
          className="calc-key-unified calc-key-submit-unified"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{gridColumn: '1 / -1'}}
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

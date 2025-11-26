import { useCallback } from 'react';

interface NumPadProps {
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export function NumPad({ onInput, onBackspace, onClear }: NumPadProps) {
  const handleDigit = useCallback((digit: string) => {
    onInput(digit);
  }, [onInput]);

  const handleBackspace = useCallback(() => {
    onBackspace();
  }, [onBackspace]);

  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  // Multiplier buttons for convenience
  const handleMultiplier = useCallback((multiplier: string) => {
    onInput(multiplier);
  }, [onInput]);

  return (
    <div className="numpad">
      <div className="numpad-row">
        <button className="numpad-key" onClick={() => handleDigit('1')}>1</button>
        <button className="numpad-key" onClick={() => handleDigit('2')}>2</button>
        <button className="numpad-key" onClick={() => handleDigit('3')}>3</button>
        <button className="numpad-key numpad-key-action" onClick={() => handleMultiplier('K')}>K</button>
      </div>
      <div className="numpad-row">
        <button className="numpad-key" onClick={() => handleDigit('4')}>4</button>
        <button className="numpad-key" onClick={() => handleDigit('5')}>5</button>
        <button className="numpad-key" onClick={() => handleDigit('6')}>6</button>
        <button className="numpad-key numpad-key-action" onClick={() => handleMultiplier('M')}>M</button>
      </div>
      <div className="numpad-row">
        <button className="numpad-key" onClick={() => handleDigit('7')}>7</button>
        <button className="numpad-key" onClick={() => handleDigit('8')}>8</button>
        <button className="numpad-key" onClick={() => handleDigit('9')}>9</button>
        <button className="numpad-key numpad-key-action" onClick={() => handleMultiplier('B')}>B</button>
      </div>
      <div className="numpad-row">
        <button className="numpad-key" onClick={() => handleDigit('.')}>.</button>
        <button className="numpad-key" onClick={() => handleDigit('0')}>0</button>
        <button className="numpad-key" onClick={handleBackspace}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
            <line x1="18" y1="9" x2="12" y2="15"></line>
            <line x1="12" y1="9" x2="18" y2="15"></line>
          </svg>
        </button>
        <button className="numpad-key numpad-key-clear" onClick={handleClear}>C</button>
      </div>
    </div>
  );
}

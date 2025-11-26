// NumPad component with liquid glass design
interface NumPadProps {
  activeField: 'lower' | 'upper';
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onToggleField: () => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
}

export function NumPad({
  activeField,
  onInput,
  onBackspace,
  onToggleField,
  onSubmit,
  isSubmitDisabled
}: NumPadProps) {
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

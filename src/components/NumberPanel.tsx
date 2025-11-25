interface NumberPanelProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onToggleFocus: () => void;
  isSubmitDisabled: boolean;
  isOnUpperBound: boolean;
}

export function NumberPanel({ onDigit, onBackspace, onSubmit, onToggleFocus, isSubmitDisabled, isOnUpperBound }: NumberPanelProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="number-panel">
      <div className="number-panel-grid">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className="number-panel-button"
            onClick={() => onDigit(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="number-panel-button number-panel-backspace"
          onClick={onBackspace}
        >
          ⌫
        </button>
        <div className="number-panel-actions">
          <button
            type="button"
            className="number-panel-button number-panel-toggle"
            onClick={onToggleFocus}
          >
            {isOnUpperBound ? 'Back' : 'Next'}
          </button>
          <button
            type="button"
            className="number-panel-button number-panel-submit"
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

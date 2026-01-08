// SimpleEstimateNumPad - Estimate + uncertainty slider WITHOUT calculator operations
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// Bounds data passed to parent
export interface BoundsData {
  lower: number;
  upper: number;
  estimate: number;
  uncertainty: number;
  hasValidEstimate: boolean;
}

interface SimpleEstimateNumPadProps {
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

// Compute lower/upper bounds from estimate and uncertainty
function computeBounds(estimate: string, uncertainty: number): { lower: number; upper: number } {
  const value = parseFormattedNumber(estimate);
  if (isNaN(value) || !isFinite(value)) {
    return { lower: 0, upper: 0 };
  }

  const roundedUncertainty = Math.round(uncertainty);
  const margin = Math.abs(value) * (roundedUncertainty / 100);
  return {
    lower: value - margin,
    upper: value + margin,
  };
}

export function SimpleEstimateNumPad({
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
}: SimpleEstimateNumPadProps) {
  // Core state - the estimate value
  const [estimate, setEstimate] = useState<string>('');
  const [uncertainty, setUncertainty] = useState<number>(0);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Computed bounds
  const bounds = useMemo(() => computeBounds(estimate, uncertainty), [estimate, uncertainty]);

  // Check if we have a valid estimate
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
          hasValidEstimate
        });
      } else {
        onBoundsChange(null);
      }
    }
  }, [bounds, uncertainty, hasValidEstimate, estimate, onBoundsChange]);

  // Display value
  const displayValue = estimate || '0';

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    // Route to bound editing if active
    if (editingBound && onBoundEditChange) {
      if (!hasStartedTypingBound) {
        onBoundEditChange(digit);
      } else {
        const currentVal = (boundEditValue || '').replace(/,/g, '');
        const newVal = currentVal + digit;
        onBoundEditChange(formatWithCommas(newVal));
      }
      return;
    }
    const newInput = estimate + digit;
    setEstimate(formatWithCommas(newInput.replace(/,/g, '')));
  }, [estimate, editingBound, boundEditValue, hasStartedTypingBound, onBoundEditChange]);

  // Handle decimal point
  const handleDecimal = useCallback(() => {
    if (editingBound && onBoundEditChange) {
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
    if (!estimate.includes('.')) {
      if (estimate === '') {
        setEstimate('0.');
      } else {
        setEstimate(estimate + '.');
      }
    }
  }, [estimate, editingBound, boundEditValue, hasStartedTypingBound, onBoundEditChange]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (editingBound && onBoundEditChange) {
      const currentVal = (boundEditValue || '').replace(/,/g, '');
      const newVal = currentVal.slice(0, -1);
      onBoundEditChange(formatWithCommas(newVal));
      return;
    }
    const raw = estimate.replace(/,/g, '');
    const newValue = raw.slice(0, -1);
    setEstimate(formatWithCommas(newValue));
  }, [estimate, editingBound, boundEditValue, onBoundEditChange]);

  // Ref for the slider container
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Handle slider change from range input
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setUncertainty(Number(target.value));
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
    setUncertainty(Math.round(percentage * 2) / 2);
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

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!hasValidEstimate) return;

    // If uncertainty is 0, show confirmation modal
    if (uncertainty === 0) {
      setShowConfirmModal(true);
      return;
    }

    const finalLower = lowerOverride !== null && lowerOverride !== undefined ? lowerOverride : bounds.lower;
    const finalUpper = upperOverride !== null && upperOverride !== undefined ? upperOverride : bounds.upper;

    onSubmit(finalLower, finalUpper);
    // Reset for next question
    setEstimate('');
    setUncertainty(0);
  }, [hasValidEstimate, bounds, onSubmit, lowerOverride, upperOverride, uncertainty]);

  // Confirm submission without uncertainty
  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmModal(false);

    const finalLower = lowerOverride !== null && lowerOverride !== undefined ? lowerOverride : bounds.lower;
    const finalUpper = upperOverride !== null && upperOverride !== undefined ? upperOverride : bounds.upper;

    onSubmit(finalLower, finalUpper);
    setEstimate('');
    setUncertainty(0);
  }, [bounds, onSubmit, lowerOverride, upperOverride]);

  // Cancel submission
  const handleCancelSubmit = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  // Calculate dynamic font size based on text length
  const dynamicFontSize = useMemo(() => {
    const charCount = displayValue.length;
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
    if (isTouch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
      // Backspace
      else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
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
      // Enter to submit
      else if (key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTouch,
    handleDigit,
    handleDecimal,
    handleBackspace,
    handleIncrementUncertainty,
    handleDecrementUncertainty,
    handleSubmit
  ]);

  // Show uncertainty controls only when there's a valid estimate
  const showUncertaintyControls = hasValidEstimate;

  return (
    <div className="estimate-numpad-container">
      {/* Estimate Display */}
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
          {/* Background fill layer */}
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

          {/* Number display */}
          <div
            className="estimate-value-unified"
            style={{ fontSize: `${dynamicFontSize}rem` }}
          >
            {displayValue}
          </div>
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
          disabled={!hasValidEstimate}
          style={{gridColumn: '1 / -1'}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="uncertainty-modal-overlay" onClick={handleCancelSubmit}>
          <div className="uncertainty-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="uncertainty-modal-title">No Uncertainty Set</h3>
            <p className="uncertainty-modal-text">
              You're submitting with 0% uncertainty, meaning your lower and upper bounds are the same.
            </p>

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

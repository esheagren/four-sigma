import { useState, useEffect, useCallback, useRef } from 'react';
import { EstimateNumPad, BoundsData, formatDisplay } from './EstimateNumPad';
import { ProgressDots } from './ProgressDots';
import { isTouchDevice } from '../lib/device';

interface Question {
  id: string;
  prompt: string;
  unit?: string;
}

interface QuestionCardProps {
  question: Question;
  onSubmit: (lower: number, upper: number) => void;
  currentQuestionIndex: number;
  totalQuestions: number;
}

// Format number with commas for editing
function formatWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(value);
}

// Parse formatted string back to number
function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}

export function QuestionCard({ question, onSubmit, currentQuestionIndex, totalQuestions }: QuestionCardProps) {
  const [isTouch, setIsTouch] = useState(true);

  // Bounds state from EstimateNumPad
  const [bounds, setBounds] = useState<BoundsData | null>(null);

  // Override state for manually edited bounds
  const [lowerOverride, setLowerOverride] = useState<number | null>(null);
  const [upperOverride, setUpperOverride] = useState<number | null>(null);

  // Editing state
  const [editingBound, setEditingBound] = useState<'lower' | 'upper' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect device type on mount
  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingBound && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingBound]);

  // Handle bounds change from EstimateNumPad
  const handleBoundsChange = useCallback((newBounds: BoundsData | null) => {
    setBounds(newBounds);
  }, []);

  // Clear overrides when slider is adjusted
  const handleClearOverrides = useCallback(() => {
    setLowerOverride(null);
    setUpperOverride(null);
  }, []);

  // Start editing a bound
  const handleBoundClick = useCallback((which: 'lower' | 'upper') => {
    if (!bounds) return;

    const currentValue = which === 'lower'
      ? (lowerOverride ?? bounds.lower)
      : (upperOverride ?? bounds.upper);

    setEditingBound(which);
    setEditValue(formatWithCommas(currentValue));
  }, [bounds, lowerOverride, upperOverride]);

  // Validate and save edited bound
  const handleEditComplete = useCallback(() => {
    if (!editingBound || !bounds) {
      setEditingBound(null);
      return;
    }

    const parsed = parseFormattedNumber(editValue);

    // Validate the value
    if (isNaN(parsed)) {
      // Invalid, revert
      setEditingBound(null);
      return;
    }

    // Validate constraints: lower <= estimate <= upper
    if (editingBound === 'lower') {
      if (parsed > bounds.estimate) {
        // Lower bound can't be greater than estimate, revert
        setEditingBound(null);
        return;
      }
      setLowerOverride(parsed);
    } else {
      if (parsed < bounds.estimate) {
        // Upper bound can't be less than estimate, revert
        setEditingBound(null);
        return;
      }
      setUpperOverride(parsed);
    }

    setEditingBound(null);
  }, [editingBound, editValue, bounds]);

  // Handle key press in edit input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingBound(null);
    }
  }, [handleEditComplete]);

  // Determine what to display for each bound
  const displayLower = bounds ? (lowerOverride ?? bounds.lower) : 0;
  const displayUpper = bounds ? (upperOverride ?? bounds.upper) : 0;

  // Show bounds only when there's a valid estimate AND uncertainty > 0
  const showBounds = bounds?.hasValidEstimate && bounds.uncertainty > 0;

  return (
    <>
      <div className="question-card">
        <ProgressDots currentIndex={currentQuestionIndex} total={totalQuestions} />
        <div className="question-header">
          <h2 className="question-prompt">{question.prompt}</h2>
          {question.unit && (
            <div className="unit-badge">
              <span className="unit-label">Unit:</span>
              <span className="unit-value">{question.unit}</span>
            </div>
          )}
        </div>

        {/* Bounds display - shown below question when uncertainty > 0 */}
        {showBounds && (
          <div className="bounds-display-question">
            {/* Lower bound */}
            {editingBound === 'lower' ? (
              <input
                ref={inputRef}
                type="text"
                className="bound-input-question"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditComplete}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <button
                className={`bound-card-question bound-card-question-lower ${lowerOverride !== null ? 'bound-card-question-override' : ''}`}
                onClick={() => handleBoundClick('lower')}
              >
                {formatDisplay(displayLower)}
              </button>
            )}

            <div className="bound-separator-question">–</div>

            {/* Upper bound */}
            {editingBound === 'upper' ? (
              <input
                ref={inputRef}
                type="text"
                className="bound-input-question"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditComplete}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <button
                className={`bound-card-question bound-card-question-upper ${upperOverride !== null ? 'bound-card-question-override' : ''}`}
                onClick={() => handleBoundClick('upper')}
              >
                {formatDisplay(displayUpper)}
              </button>
            )}
          </div>
        )}
      </div>

      <EstimateNumPad
        onSubmit={onSubmit}
        isTouch={isTouch}
        onBoundsChange={handleBoundsChange}
        lowerOverride={lowerOverride}
        upperOverride={upperOverride}
        onClearOverrides={handleClearOverrides}
      />
    </>
  );
}

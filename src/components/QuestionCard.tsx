import { useState, useEffect, useCallback } from 'react';
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

  // Detect device type on mount
  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);


  // Handle bounds change from EstimateNumPad
  const handleBoundsChange = useCallback((newBounds: BoundsData | null) => {
    setBounds(newBounds);
  }, []);

  // Clear overrides when slider is adjusted
  const handleClearOverrides = useCallback(() => {
    setLowerOverride(null);
    setUpperOverride(null);
  }, []);

  // Start editing a bound - keep current value so user can edit with backspace/digits
  const handleBoundClick = useCallback((which: 'lower' | 'upper') => {
    if (!bounds) return;

    // If already editing this bound, do nothing
    if (editingBound === which) return;

    // Get the current value to start editing from
    const currentValue = which === 'lower'
      ? (lowerOverride ?? bounds.lower)
      : (upperOverride ?? bounds.upper);

    setEditingBound(which);
    // Format without abbreviations so user sees full number
    setEditValue(new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(currentValue));
  }, [bounds, editingBound, lowerOverride, upperOverride]);

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

  // Finish bound editing when clicking outside (saves current value)
  const handleClickOutside = useCallback(() => {
    if (editingBound) {
      handleEditComplete();
    }
  }, [editingBound, handleEditComplete]);

  // Determine what to display for each bound
  const displayLower = bounds ? (lowerOverride ?? bounds.lower) : 0;
  const displayUpper = bounds ? (upperOverride ?? bounds.upper) : 0;

  // Show bounds only when there's a valid estimate AND uncertainty > 0
  const showBounds = bounds?.hasValidEstimate && bounds.uncertainty > 0;

  return (
    <>
      <div className="question-card" onClick={handleClickOutside}>
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
            <button
              className={`bound-card-question bound-card-question-lower ${lowerOverride !== null ? 'bound-card-question-override' : ''} ${editingBound === 'lower' ? 'bound-card-question-editing' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleBoundClick('lower'); }}
            >
              {editingBound === 'lower' ? (editValue || '0') : formatDisplay(displayLower)}
            </button>

            <div className="bound-separator-question">–</div>

            {/* Upper bound */}
            <button
              className={`bound-card-question bound-card-question-upper ${upperOverride !== null ? 'bound-card-question-override' : ''} ${editingBound === 'upper' ? 'bound-card-question-editing' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleBoundClick('upper'); }}
            >
              {editingBound === 'upper' ? (editValue || '0') : formatDisplay(displayUpper)}
            </button>
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
        editingBound={editingBound}
        boundEditValue={editValue}
        onBoundEditChange={setEditValue}
        onBoundEditComplete={handleEditComplete}
      />
    </>
  );
}

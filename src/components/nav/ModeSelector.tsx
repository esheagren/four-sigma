import { useRef, useState, useCallback, useEffect } from 'react';
import { NumPadMode } from '../../hooks/useNumPadMode';
import { CalculatorMode } from '../../hooks/useCalculatorMode';

interface ModeSelectorProps {
  numPadMode: NumPadMode;
  calculatorMode: CalculatorMode;
  onModeChange: (numPadMode: NumPadMode, calculatorMode: CalculatorMode) => void;
}

// Info icon for the help popup
function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// Icons for row/column labels
function PlusMinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Plus */}
      <line x1="4" y1="7" x2="10" y2="7" />
      <line x1="7" y1="4" x2="7" y2="10" />
      {/* Slash */}
      <line x1="10" y1="18" x2="14" y2="6" />
      {/* Minus */}
      <line x1="14" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function TwoBoxesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Left box */}
      <rect x="2" y="6" width="9" height="12" rx="1" />
      {/* Right box */}
      <rect x="13" y="6" width="9" height="12" rx="1" />
    </svg>
  );
}

function NumPadTitleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* 3x3 grid of dots representing numpad */}
      <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CalcOnIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function CalcOffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="4" y1="22" x2="20" y2="2" strokeWidth="2.5" />
    </svg>
  );
}

// Quadrant position type
type Quadrant = { col: 0 | 1; row: 0 | 1 };

// Map quadrant to modes
function quadrantToModes(q: Quadrant): { numPadMode: NumPadMode; calculatorMode: CalculatorMode } {
  return {
    numPadMode: q.row === 0 ? 'slider' : 'direct',
    calculatorMode: q.col === 0 ? 'off' : 'on',
  };
}

// Map modes to quadrant
function modesToQuadrant(numPadMode: NumPadMode, calculatorMode: CalculatorMode): Quadrant {
  return {
    col: calculatorMode === 'off' ? 0 : 1,
    row: numPadMode === 'slider' ? 0 : 1,
  };
}

// Get center position of a quadrant (as percentage)
function getQuadrantCenter(q: Quadrant): { x: number; y: number } {
  return {
    x: q.col === 0 ? 25 : 75,
    y: q.row === 0 ? 25 : 75,
  };
}

export function ModeSelector({ numPadMode, calculatorMode, onModeChange }: ModeSelectorProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const infoPopupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const currentQuadrant = modesToQuadrant(numPadMode, calculatorMode);

  // Close popup when clicking outside
  useEffect(() => {
    if (!showInfoPopup) return;

    function handleClickOutside(e: MouseEvent) {
      if (infoPopupRef.current && !infoPopupRef.current.contains(e.target as Node)) {
        setShowInfoPopup(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfoPopup]);
  const currentCenter = getQuadrantCenter(currentQuadrant);

  // Get position for the node (drag position or snapped to quadrant center)
  const nodePosition = dragPosition || currentCenter;

  const getQuadrantFromPosition = useCallback((x: number, y: number): Quadrant => {
    return {
      col: x < 50 ? 0 : 1,
      row: y < 50 ? 0 : 1,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDragPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);

    if (dragPosition) {
      const newQuadrant = getQuadrantFromPosition(dragPosition.x, dragPosition.y);
      const { numPadMode: newNumPadMode, calculatorMode: newCalcMode } = quadrantToModes(newQuadrant);
      onModeChange(newNumPadMode, newCalcMode);
    }

    setDragPosition(null);
  }, [isDragging, dragPosition, getQuadrantFromPosition, onModeChange]);

  const handleQuadrantClick = useCallback((row: 0 | 1, col: 0 | 1) => {
    if (isDragging) return;
    const { numPadMode: newNumPadMode, calculatorMode: newCalcMode } = quadrantToModes({ row, col });
    onModeChange(newNumPadMode, newCalcMode);
  }, [isDragging, onModeChange]);

  return (
    <div className="mode-selector">
      <div className="mode-selector-title">
        <NumPadTitleIcon />
        <span>Number Pad</span>
        <button
          className="mode-selector-info-btn"
          onClick={() => setShowInfoPopup(!showInfoPopup)}
          aria-label="Learn about numpad modes"
        >
          <InfoIcon />
        </button>
      </div>

      {/* Info popup */}
      {showInfoPopup && (
        <div className="mode-selector-info-popup" ref={infoPopupRef}>
          <div className="mode-selector-info-section">
            <div className="mode-selector-info-header">
              <TwoBoxesIcon />
              <span>Direct Entry</span>
              <span className="mode-selector-info-vs">vs</span>
              <PlusMinusIcon />
              <span>Midpoint ±%</span>
            </div>
            <p><strong>Direct:</strong> Enter your lower and upper bounds separately.</p>
            <p><strong>Midpoint:</strong> Enter your best guess, then drag to set your uncertainty range as a percentage (±%).</p>
          </div>
          <div className="mode-selector-info-divider" />
          <div className="mode-selector-info-section">
            <div className="mode-selector-info-header">
              <CalcOnIcon />
              <span>Calculator</span>
              <span className="mode-selector-info-vs">vs</span>
              <CalcOffIcon />
              <span>Simple</span>
            </div>
            <p><strong>Calculator:</strong> Full calculator with +, −, ×, ÷ operations to compute your answer.</p>
            <p><strong>Simple:</strong> Just digits—no calculator operations, for when you already know your numbers.</p>
          </div>
        </div>
      )}

      <div className="mode-selector-container">
        {/* Column labels (above grid) */}
        <div className="mode-selector-col-labels">
          <div className={`mode-selector-label ${calculatorMode === 'off' ? 'active' : ''}`}>
            <CalcOffIcon />
          </div>
          <div className={`mode-selector-label ${calculatorMode === 'on' ? 'active' : ''}`}>
            <CalcOnIcon />
          </div>
        </div>

        <div className="mode-selector-row">
          {/* Row labels (left of grid) */}
          <div className="mode-selector-row-labels">
            <div className={`mode-selector-label ${numPadMode === 'slider' ? 'active' : ''}`}>
              <PlusMinusIcon />
            </div>
            <div className={`mode-selector-label ${numPadMode === 'direct' ? 'active' : ''}`}>
              <TwoBoxesIcon />
            </div>
          </div>

          {/* The 2x2 grid */}
          <div className="mode-selector-grid" ref={gridRef}>
            <div
              className={`mode-selector-quadrant top-left ${currentQuadrant.row === 0 && currentQuadrant.col === 0 ? 'active' : ''}`}
              onClick={() => handleQuadrantClick(0, 0)}
            />
            <div
              className={`mode-selector-quadrant top-right ${currentQuadrant.row === 0 && currentQuadrant.col === 1 ? 'active' : ''}`}
              onClick={() => handleQuadrantClick(0, 1)}
            />
            <div
              className={`mode-selector-quadrant bottom-left ${currentQuadrant.row === 1 && currentQuadrant.col === 0 ? 'active' : ''}`}
              onClick={() => handleQuadrantClick(1, 0)}
            />
            <div
              className={`mode-selector-quadrant bottom-right ${currentQuadrant.row === 1 && currentQuadrant.col === 1 ? 'active' : ''}`}
              onClick={() => handleQuadrantClick(1, 1)}
            />

            {/* Draggable node */}
            <div
              className={`mode-selector-node ${isDragging ? 'dragging' : ''}`}
              style={{
                left: `${nodePosition.x}%`,
                top: `${nodePosition.y}%`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

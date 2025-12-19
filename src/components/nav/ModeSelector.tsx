import { useRef, useState, useCallback } from 'react';
import { NumPadMode } from '../../hooks/useNumPadMode';
import { CalculatorMode } from '../../hooks/useCalculatorMode';

interface ModeSelectorProps {
  numPadMode: NumPadMode;
  calculatorMode: CalculatorMode;
  onModeChange: (numPadMode: NumPadMode, calculatorMode: CalculatorMode) => void;
}

// Icons for the quadrants
function SliderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function BoundsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4H6a2 2 0 00-2 2v2" />
      <path d="M8 20H6a2 2 0 01-2-2v-2" />
      <path d="M16 4h2a2 2 0 012 2v2" />
      <path d="M16 20h2a2 2 0 002-2v-2" />
      <text x="12" y="14" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">123</text>
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const currentQuadrant = modesToQuadrant(numPadMode, calculatorMode);
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
      <div
        className="mode-selector-grid"
        ref={gridRef}
      >
        {/* Quadrant labels */}
        <div
          className={`mode-selector-quadrant top-left ${currentQuadrant.row === 0 && currentQuadrant.col === 0 ? 'active' : ''}`}
          onClick={() => handleQuadrantClick(0, 0)}
        >
          <SliderIcon />
          <CalcOffIcon />
        </div>
        <div
          className={`mode-selector-quadrant top-right ${currentQuadrant.row === 0 && currentQuadrant.col === 1 ? 'active' : ''}`}
          onClick={() => handleQuadrantClick(0, 1)}
        >
          <SliderIcon />
          <CalcOnIcon />
        </div>
        <div
          className={`mode-selector-quadrant bottom-left ${currentQuadrant.row === 1 && currentQuadrant.col === 0 ? 'active' : ''}`}
          onClick={() => handleQuadrantClick(1, 0)}
        >
          <BoundsIcon />
          <CalcOffIcon />
        </div>
        <div
          className={`mode-selector-quadrant bottom-right ${currentQuadrant.row === 1 && currentQuadrant.col === 1 ? 'active' : ''}`}
          onClick={() => handleQuadrantClick(1, 1)}
        >
          <BoundsIcon />
          <CalcOnIcon />
        </div>

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
  );
}

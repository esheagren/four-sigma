import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import BellCurve from './range/BellCurve';
import Handle from './range/Handle';
import RangeControls from './range/RangeControls';
import RangeDisplay from './range/RangeDisplay';
import ScaleControl from './range/ScaleControl';
import { colors } from '../utils/theme';

function RangeInput({ onRangeChange, question }) {
  const [exponent, setExponent] = useState(8);
  const [range, setRange] = useState([0.3, 0.89]);
  const [displayRange, setDisplayRange] = useState([0, 0]);
  const [activeDragger, setActiveDragger] = useState(null);

  const updateDisplayRange = useCallback(() => {
    const maxValue = Math.pow(10, exponent);
    const actualMin = range[0] * maxValue;
    const actualMax = range[1] * maxValue;
    setDisplayRange([actualMin, actualMax]);
  }, [exponent, range]);

  useEffect(() => {
    updateDisplayRange();
  }, [updateDisplayRange]);

  useEffect(() => {
    onRangeChange(displayRange);
  }, [displayRange, onRangeChange]);

  return (
    <div className="range-input-container">
      <div className="question-display">
        <h2>{question}</h2>
      </div>

      <RangeDisplay displayRange={displayRange} />
      
      <div className="range-slider">
        <BellCurve range={range} />
        <Handle position={range[0]} isActive={activeDragger === 'left'} />
        <Handle position={range[1]} isActive={activeDragger === 'right'} />
        <RangeControls 
          range={range}
          setRange={setRange}
          activeDragger={activeDragger}
          setActiveDragger={setActiveDragger}
        />
      </div>

      <ScaleControl 
        exponent={exponent}
        setExponent={setExponent}
      />
    </div>
  );
}

RangeInput.propTypes = {
  onRangeChange: PropTypes.func,
  question: PropTypes.string
};

RangeInput.defaultProps = {
  onRangeChange: () => {},
  question: ''
};

export default RangeInput; 
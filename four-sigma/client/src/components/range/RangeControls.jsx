import PropTypes from 'prop-types';

function RangeControls({ range, setRange, activeDragger, setActiveDragger }) {
  return (
    <div className="range-controls">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={range[0]}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          if (newValue < range[1] - 0.05) {
            setRange([newValue, range[1]]);
          }
        }}
        onMouseDown={() => setActiveDragger('left')}
        onMouseUp={() => setActiveDragger(null)}
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={range[1]}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          if (newValue > range[0] + 0.05) {
            setRange([range[0], newValue]);
          }
        }}
        onMouseDown={() => setActiveDragger('right')}
        onMouseUp={() => setActiveDragger(null)}
      />
    </div>
  );
}

RangeControls.propTypes = {
  range: PropTypes.arrayOf(PropTypes.number).isRequired,
  setRange: PropTypes.func.isRequired,
  activeDragger: PropTypes.string,
  setActiveDragger: PropTypes.func.isRequired
};

export default RangeControls; 
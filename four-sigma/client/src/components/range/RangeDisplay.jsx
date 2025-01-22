import PropTypes from 'prop-types';

function RangeDisplay({ displayRange }) {
  return (
    <div className="range-display">
      <div className="lower-bound">
        <span className="value">
          {displayRange[0].toLocaleString(undefined, { 
            maximumFractionDigits: 0 
          })}
        </span>
        <span className="label">Lower Bound</span>
      </div>
      <div className="upper-bound">
        <span className="value">
          {displayRange[1].toLocaleString(undefined, { 
            maximumFractionDigits: 0 
          })}
        </span>
        <span className="label">Upper Bound</span>
      </div>
    </div>
  );
}

RangeDisplay.propTypes = {
  displayRange: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default RangeDisplay; 
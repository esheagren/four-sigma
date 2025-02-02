import PropTypes from 'prop-types';

// The component maintains its own state while also trying to sync with parent state through callbacks. 
// This can lead to synchronization issues.

function InputFields({ lowerValue, upperValue, onValueChange }) {
  function handleLowerChange(event) {
    const newValue = event.target.value;
    onValueChange("lower", newValue);
  }

  function handleUpperChange(event) {
    const newValue = event.target.value;
    onValueChange("upper", newValue);
  }

  return (
    <div className="input-container">
      <input 
        type="number"
        className="box"
        value={lowerValue === undefined ? '' : lowerValue}
        onChange={handleLowerChange}
        placeholder="Lower Bound"
      />
      <input 
        type="number"
        className="box"
        value={upperValue === undefined ? '' : upperValue}
        onChange={handleUpperChange}
        placeholder="Upper Bound"
      />
    </div>
  );
}

InputFields.propTypes = {
  onValueChange: PropTypes.func.isRequired,
  lowerValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  upperValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default InputFields;
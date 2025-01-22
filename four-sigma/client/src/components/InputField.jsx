import PropTypes from 'prop-types';

// The component maintains its own state while also trying to sync with parent state through callbacks. 
// This can lead to synchronization issues.

function InputFields({ lowerValue, upperValue, onValueChange} ) {


function handleLowerChange(event) {
    const newValue = Number(event.target.value);
    if (upperValue && newValue > upperValue) {
      // Show error state
      event.target.setCustomValidity('Lower bound must be less than upper bound');
      event.target.reportValidity();
    } else {
      event.target.setCustomValidity('');
      onValueChange("lower", event.target.value);
    }
  }

  function handleUpperChange(event) {
    const newValue = Number(event.target.value);
    if (lowerValue && newValue < lowerValue) {
      // Show error state
      event.target.setCustomValidity('Upper bound must be greater than lower bound');
      event.target.reportValidity();
    } else {
      event.target.setCustomValidity('');
      onValueChange("upper", event.target.value);
    }
  }


  return (
    <div className="input-container">
      <input 
        type="number"
        className="box"
        value={lowerValue}
        onChange={handleLowerChange}
        placeholder="Lower Bound"
      />
      <input 
        type="number"
        className="box"
        value={upperValue}
        onChange={handleUpperChange}
        placeholder="Upper Bound"
      />
    </div>
  );
}

InputFields.propTypes = {
  onValueChange: PropTypes.func.isRequired,
  lowerValue: PropTypes.number,
  upperValue: PropTypes.number
};

export default InputFields;
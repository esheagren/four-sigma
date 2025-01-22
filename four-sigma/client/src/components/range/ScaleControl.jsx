import PropTypes from 'prop-types';

function ScaleControl({ exponent, setExponent }) {
  return (
    <div className="scale-control">
      <span>×10</span>
      <input
        type="number"
        value={exponent}
        onChange={(e) => setExponent(Math.max(0, parseInt(e.target.value) || 0))}
        className="exponent-input"
      />
    </div>
  );
}

ScaleControl.propTypes = {
  exponent: PropTypes.number.isRequired,
  setExponent: PropTypes.func.isRequired
};

export default ScaleControl; 
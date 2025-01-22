import PropTypes from 'prop-types';
import { colors } from '../../utils/theme';

function Handle({ position, isActive }) {
  return (
    <div 
      className={`handle ${isActive ? 'active' : ''}`}
      style={{ 
        left: `${position * 100}%`,
      }}
    >
      <div className="handle-knob" style={{
        backgroundColor: isActive ? colors.accent : colors.secondary
      }}>
        <div className="handle-line"></div>
      </div>
    </div>
  );
}

Handle.propTypes = {
  position: PropTypes.number.isRequired,
  isActive: PropTypes.bool
};

export default Handle; 
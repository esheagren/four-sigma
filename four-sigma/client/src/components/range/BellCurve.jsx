import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { colors } from '../../utils/theme';

function BellCurve({ range }) {
  const generateBellCurve = (start, end) => {
    const width = end - start;
    const points = 50;
    const heightScale = Math.min(40 / width, 45);
    const path = [];
    
    const center = (start + end) / 2;
    const stdDev = width / 4;
    
    for (let i = 0; i <= points; i++) {
      const x = start + (width * i) / points;
      const normalized = (x - center) / stdDev;
      const y = heightScale * Math.exp(-(normalized * normalized) / 2);
      path.push(`${x * 100},${40 - y}`);
    }
    
    return `M${start * 100},40 L` + path.join(' L') + ` L${end * 100},40`;
  };

  const bellCurvePath = useMemo(() => 
    generateBellCurve(range[0], range[1]), [range]
  );

  return (
    <svg className="bell-curve" preserveAspectRatio="none" viewBox="0 0 100 100">
      <path
        d={bellCurvePath}
        fill="rgba(139, 0, 0, 0.15)"
        stroke={colors.secondary}
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

BellCurve.propTypes = {
  range: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default BellCurve; 
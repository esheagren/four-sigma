interface PerformanceHistoryEntry {
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface PerformanceChartProps {
  performanceHistory?: PerformanceHistoryEntry[];
}

export function PerformanceChart({ performanceHistory }: PerformanceChartProps) {
  // Mock data for demonstration - will be replaced with real data from backend
  const historyData = performanceHistory || [
    { day: 'M', userScore: 45, avgScore: 38, calibration: 67 },
    { day: 'T', userScore: 62, avgScore: 52, calibration: 71 },
    { day: 'W', userScore: 58, avgScore: 49, calibration: 75 },
    { day: 'Th', userScore: 71, avgScore: 55, calibration: 80 },
    { day: 'F', userScore: 53, avgScore: 48, calibration: 78 },
    { day: 'S', userScore: 68, avgScore: 51, calibration: 85 },
    { day: 'Su', userScore: 75, avgScore: 54, calibration: 88 },
  ];

  // Calculate chart dimensions
  const maxScore = Math.max(
    ...historyData.map(d => Math.max(d.userScore, d.avgScore)),
    100
  );
  const maxCalibration = 100; // Calibration is always 0-100%
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 50, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate SVG path for score lines (left axis)
  const generateScorePath = (data: number[]) => {
    return data
      .map((score, i) => {
        const x = padding.left + (i / (data.length - 1)) * innerWidth;
        const y = padding.top + innerHeight - (score / maxScore) * innerHeight;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate SVG path for calibration line (right axis)
  const generateCalibrationPath = (data: number[]) => {
    return data
      .map((cal, i) => {
        const x = padding.left + (i / (data.length - 1)) * innerWidth;
        const y = padding.top + innerHeight - (cal / maxCalibration) * innerHeight;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const userPath = generateScorePath(historyData.map(d => d.userScore));
  const avgPath = generateScorePath(historyData.map(d => d.avgScore));
  const calibrationPath = generateCalibrationPath(historyData.map(d => d.calibration));

  return (
    <div className="performance-chart">
      <svg
        width={chartWidth}
        height={chartHeight}
        className="chart-svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding.top + innerHeight - (value / maxScore) * innerHeight;
          return (
            <line
              key={`grid-${value}`}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#e3e8ee"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}

        {/* Left Y-axis (Score) */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#635bff"
          strokeWidth="1"
        />

        {/* Left Y-axis labels (Score) */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding.top + innerHeight - (value / maxScore) * innerHeight;
          return (
            <text
              key={`left-label-${value}`}
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              fontSize="10"
              fill="#635bff"
              fontWeight="500"
              dominantBaseline="middle"
            >
              {value}
            </text>
          );
        })}

        {/* Right Y-axis (Calibration %) */}
        <line
          x1={chartWidth - padding.right}
          y1={padding.top}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#00d924"
          strokeWidth="1"
        />

        {/* Right Y-axis labels (Calibration %) */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding.top + innerHeight - (value / maxCalibration) * innerHeight;
          return (
            <text
              key={`right-label-${value}`}
              x={chartWidth - padding.right + 10}
              y={y}
              textAnchor="start"
              fontSize="10"
              fill="#00d924"
              fontWeight="500"
              dominantBaseline="middle"
            >
              {value}%
            </text>
          );
        })}

        {/* Average score line */}
        <path
          d={avgPath}
          fill="none"
          stroke="#9d98d4"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* User score line */}
        <path
          d={userPath}
          fill="none"
          stroke="#635bff"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Calibration line */}
        <path
          d={calibrationPath}
          fill="none"
          stroke="#00d924"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points for user score */}
        {historyData.map((d, i) => {
          const x = padding.left + (i / (historyData.length - 1)) * innerWidth;
          const yScore = padding.top + innerHeight - (d.userScore / maxScore) * innerHeight;
          return (
            <circle
              key={`user-${i}`}
              cx={x}
              cy={yScore}
              r="4"
              fill="#635bff"
              stroke="#ffffff"
              strokeWidth="2"
            />
          );
        })}

        {/* Data points for calibration */}
        {historyData.map((d, i) => {
          const x = padding.left + (i / (historyData.length - 1)) * innerWidth;
          const yCal = padding.top + innerHeight - (d.calibration / maxCalibration) * innerHeight;
          return (
            <circle
              key={`cal-${i}`}
              cx={x}
              cy={yCal}
              r="4"
              fill="#00d924"
              stroke="#ffffff"
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels */}
        {historyData.map((d, i) => {
          const x = padding.left + (i / (historyData.length - 1)) * innerWidth;
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={chartHeight - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#8898aa"
              fontWeight="600"
            >
              {d.day}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-line legend-line-user"></div>
          <span className="legend-label">Your score</span>
        </div>
        <div className="legend-item">
          <div className="legend-line legend-line-avg"></div>
          <span className="legend-label">Average score</span>
        </div>
        <div className="legend-item">
          <div className="legend-line legend-line-calibration"></div>
          <span className="legend-label">Your Calibration</span>
        </div>
      </div>
    </div>
  );
}

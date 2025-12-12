interface ProgressDotsProps {
  currentIndex: number;
  total: number;
}

export function ProgressDots({ currentIndex, total }: ProgressDotsProps) {
  const progressPercent = ((currentIndex + 1) / total) * 100;

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
}

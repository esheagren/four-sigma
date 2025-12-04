interface ProgressDotsProps {
  currentIndex: number;
  total: number;
}

export function ProgressDots({ currentIndex, total }: ProgressDotsProps) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`progress-dot ${i < currentIndex ? 'completed' : ''} ${i === currentIndex ? 'active' : ''}`}
        />
      ))}
    </div>
  );
}

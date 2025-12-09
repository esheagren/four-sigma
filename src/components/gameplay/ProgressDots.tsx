interface ProgressDotsProps {
  currentIndex: number;
  total: number;
}

export function ProgressDots({ currentIndex, total }: ProgressDotsProps) {
  return (
    <div className="progress-fraction">
      {currentIndex + 1}/{total}
    </div>
  );
}

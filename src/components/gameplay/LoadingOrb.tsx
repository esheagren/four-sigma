import { useState, useEffect, useMemo } from 'react';

interface LoadingOrbProps {
  score?: number;
  showScore?: boolean;
  animateScore?: boolean;
  onScoreClick?: () => void;
  isClickable?: boolean;
}

// Scale limits for orb growth
const MIN_SCALE = 1;
const MAX_SCALE = 1.8;
const MAX_SCORE_FOR_SCALE = 2000; // Score at which orb reaches max size

export function LoadingOrb({ score, showScore = false, animateScore = false, onScoreClick, isClickable = true }: LoadingOrbProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [scale, setScale] = useState(MIN_SCALE);

  // Calculate target scale based on score
  const getScaleForScore = (currentScore: number, maxScore: number) => {
    const ratio = Math.min(currentScore / MAX_SCORE_FOR_SCALE, 1);
    return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * ratio;
  };

  // Tick-up animation for score
  useEffect(() => {
    if (!animateScore || score === undefined) {
      if (showScore && score !== undefined) {
        setDisplayScore(score);
        setScale(getScaleForScore(score, score));
      }
      return;
    }

    const duration = 2500; // ms - slower tick
    const steps = 80; // more steps for smoother animation
    const increment = score / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        setScale(getScaleForScore(score, score));
        clearInterval(interval);
      } else {
        const rounded = Math.round(current);
        setDisplayScore(rounded);
        setScale(getScaleForScore(rounded, score));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [animateScore, score, showScore]);

  // Generate dots in a spherical pattern - memoized to prevent regeneration
  const dots = useMemo(() => {
    const dotsArray = [];
    const radius = 50;

    // Create rings of dots at different latitudes
    const latitudes = [-60, -30, 0, 30, 60];
    const dotsPerRing = [6, 10, 12, 10, 6];

    let dotIndex = 0;
    latitudes.forEach((lat, ringIndex) => {
      const count = dotsPerRing[ringIndex];
      for (let i = 0; i < count; i++) {
        const lng = (360 / count) * i;
        const opacity = 0.4 + Math.random() * 0.4;
        dotsArray.push(
          <div
            key={dotIndex++}
            className="loading-orb-dot"
            style={{
              transform: `rotateY(${lng}deg) rotateX(${lat}deg) translateZ(${radius}px)`,
              opacity: opacity,
            }}
          />
        );
      }
    });

    // Add top and bottom poles
    dotsArray.push(
      <div
        key={dotIndex++}
        className="loading-orb-dot"
        style={{
          transform: `rotateX(90deg) translateZ(${radius}px)`,
          opacity: 0.7,
        }}
      />
    );
    dotsArray.push(
      <div
        key={dotIndex++}
        className="loading-orb-dot"
        style={{
          transform: `rotateX(-90deg) translateZ(${radius}px)`,
          opacity: 0.7,
        }}
      />
    );

    return dotsArray;
  }, []);

  return (
    <div className="loading-orb-container">
      <div
        className="loading-orb-scale-wrapper"
        style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease-out' }}
      >
        <div className="loading-orb">
          {dots}
        </div>
        {showScore && (
          <div
            className={`loading-orb-score ${onScoreClick && isClickable ? 'clickable' : ''}`}
            onClick={onScoreClick && isClickable ? onScoreClick : undefined}
            role={onScoreClick ? 'button' : undefined}
            tabIndex={onScoreClick && isClickable ? 0 : undefined}
            onKeyDown={onScoreClick && isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onScoreClick(); } : undefined}
          >
            {Math.round(displayScore).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

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
const MAX_SCALE = 2.0;
const MAX_SCORE_FOR_SCALE = 1500; // Score at which orb reaches max size

export function LoadingOrb({ score, showScore = false, animateScore = false, onScoreClick, isClickable = true }: LoadingOrbProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [scale, setScale] = useState(MIN_SCALE);

  // Calculate scale based on current score relative to final score
  // This makes the orb grow proportionally as the number ticks up
  const getScaleForScore = (currentScore: number, finalScore: number) => {
    if (finalScore <= 0) return MIN_SCALE;
    // Scale based on progress toward final score, capped at MAX_SCORE_FOR_SCALE
    const effectiveMax = Math.min(finalScore, MAX_SCORE_FOR_SCALE);
    const ratio = Math.min(currentScore / effectiveMax, 1);
    return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * ratio;
  };

  // Tick-up animation for score using requestAnimationFrame for smooth 60fps
  useEffect(() => {
    if (!animateScore || score === undefined) {
      if (showScore && score !== undefined) {
        setDisplayScore(score);
        setScale(getScaleForScore(score, score));
      }
      return;
    }

    const duration = 2500;
    let startTime: number | null = null;
    let animationId: number;

    // Easing function for smooth acceleration/deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;

      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(linearProgress);

      const currentScore = easedProgress * score;
      setDisplayScore(Math.round(currentScore));
      setScale(getScaleForScore(currentScore, score)); // Use non-rounded for smooth scale

      if (linearProgress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
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
        style={{ transform: `scale(${scale})` }}
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

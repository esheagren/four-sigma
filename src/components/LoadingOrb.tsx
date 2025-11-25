interface LoadingOrbProps {
  isBursting?: boolean;
}

export function LoadingOrb({ isBursting = false }: LoadingOrbProps) {
  // Generate dots in a spherical pattern
  const dots = [];
  const radius = 50;
  const burstRadius = 250;

  // Create rings of dots at different latitudes
  const latitudes = [-60, -30, 0, 30, 60];
  const dotsPerRing = [6, 10, 12, 10, 6];

  let dotIndex = 0;
  latitudes.forEach((lat, ringIndex) => {
    const count = dotsPerRing[ringIndex];
    for (let i = 0; i < count; i++) {
      const lng = (360 / count) * i;
      const opacity = 0.4 + Math.random() * 0.4;
      const burstDelay = Math.random() * 100;
      dots.push(
        <div
          key={dotIndex++}
          className="loading-orb-dot"
          style={{
            transform: `rotateY(${lng}deg) rotateX(${lat}deg) translateZ(${isBursting ? burstRadius : radius}px)`,
            opacity: isBursting ? 0 : opacity,
            transitionDelay: isBursting ? `${burstDelay}ms` : '0ms',
          }}
        />
      );
    }
  });

  // Add top and bottom poles
  dots.push(
    <div
      key={dotIndex++}
      className="loading-orb-dot"
      style={{
        transform: `rotateX(90deg) translateZ(${isBursting ? burstRadius : radius}px)`,
        opacity: isBursting ? 0 : 0.7,
      }}
    />
  );
  dots.push(
    <div
      key={dotIndex++}
      className="loading-orb-dot"
      style={{
        transform: `rotateX(-90deg) translateZ(${isBursting ? burstRadius : radius}px)`,
        opacity: isBursting ? 0 : 0.7,
      }}
    />
  );

  return (
    <div className="loading-orb-container">
      <div className={`loading-orb ${isBursting ? 'bursting' : ''}`}>
        {dots}
      </div>
    </div>
  );
}

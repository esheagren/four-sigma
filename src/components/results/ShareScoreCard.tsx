import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import html2canvas from 'html2canvas';

interface ShareScoreCardProps {
  totalScore: number;
  username: string;
  hits: number;
  total: number;
  calibration?: number;
  percentile?: number;
}

export interface ShareScoreCardRef {
  generateImage: () => Promise<Blob | null>;
}

// Generate random color variations while keeping the same feel
function generateColorScheme() {
  // Base hues to pick from (purple-blue-cyan range for consistency)
  const hueOptions = [
    { primary: 250, secondary: 280 }, // Purple-violet
    { primary: 230, secondary: 260 }, // Blue-purple
    { primary: 260, secondary: 220 }, // Violet-blue
    { primary: 245, secondary: 290 }, // Indigo-magenta
    { primary: 220, secondary: 250 }, // Blue-indigo
  ];

  const scheme = hueOptions[Math.floor(Math.random() * hueOptions.length)];

  // Add slight random variation to the hues
  const hueVariation = (Math.random() - 0.5) * 20;
  const primaryHue = scheme.primary + hueVariation;
  const secondaryHue = scheme.secondary + hueVariation;

  // Random saturation and lightness variations
  const saturation = 60 + Math.random() * 20; // 60-80%
  const lightness = 55 + Math.random() * 15; // 55-70%

  return {
    primary: `hsl(${primaryHue}, ${saturation}%, ${lightness}%)`,
    gradientStart: `hsl(${primaryHue}, 30%, 8%)`,
    gradientMid: `hsl(${secondaryHue}, 25%, 12%)`,
    gradientEnd: `hsl(${primaryHue + 20}, 20%, 6%)`,
    accent: `hsl(${primaryHue}, ${saturation - 10}%, ${lightness + 10}%)`,
  };
}

export const ShareScoreCard = forwardRef<ShareScoreCardRef, ShareScoreCardProps>(
  ({ totalScore, username, hits, total, calibration, percentile }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Generate colors once per render (will regenerate each time share is clicked)
    const colors = useMemo(() => generateColorScheme(), []);

    useImperativeHandle(ref, () => ({
      generateImage: async () => {
        if (!cardRef.current) return null;

        try {
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 2, // Higher resolution
            logging: false,
            useCORS: true,
          });

          return new Promise((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png');
          });
        } catch (error) {
          console.error('Error generating image:', error);
          return null;
        }
      },
    }));

    // Generate random gradient angle
    const gradientAngle = 120 + Math.random() * 40; // 120-160 degrees

    return (
      <div
        ref={cardRef}
        className="share-score-card"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          background: `linear-gradient(${gradientAngle}deg, ${colors.gradientStart} 0%, ${colors.gradientMid} 50%, ${colors.gradientEnd} 100%)`,
        }}
      >
        <div className="share-card-content">
          <div className="share-card-header">
            <span className="share-card-logo">4-σ</span>
            <span className="share-card-tagline">Daily Quant Game</span>
          </div>

          <div className="share-card-score">
            <div
              className="share-card-score-value"
              style={{ color: colors.primary }}
            >
              {Math.round(totalScore)}
            </div>
            <div className="share-card-score-label">points</div>
          </div>

          {percentile !== undefined && (
            <div className="share-card-percentile">
              <span
                className="share-card-percentile-value"
                style={{ color: colors.accent }}
              >
                Top {100 - percentile}%
              </span>
            </div>
          )}

          <div className="share-card-stats">
            <div className="share-card-stat">
              <span className="share-card-stat-value">{hits}/{total}</span>
              <span className="share-card-stat-label">hits</span>
            </div>
            {calibration !== undefined && (
              <div className="share-card-stat">
                <span className="share-card-stat-value">{calibration.toFixed(0)}%</span>
                <span className="share-card-stat-label">calibration</span>
              </div>
            )}
          </div>

          <div
            className="share-card-player"
            style={{ background: `${colors.primary}22` }}
          >
            <span
              className="share-card-player-name"
              style={{ color: colors.primary }}
            >
              {username}
            </span>
          </div>

          <div className="share-card-footer">
            <span>Play at 4sig.xyz</span>
          </div>
        </div>
      </div>
    );
  }
);

ShareScoreCard.displayName = 'ShareScoreCard';

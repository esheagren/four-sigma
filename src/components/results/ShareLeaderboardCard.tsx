import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import html2canvas from 'html2canvas';

interface ShareLeaderboardCardProps {
  percentile: number;
  totalPlayers: number;
  username: string;
}

export interface ShareLeaderboardCardRef {
  generateImage: () => Promise<Blob | null>;
}

function generateColorScheme() {
  const hueOptions = [
    { primary: 45, secondary: 30 },   // Gold
    { primary: 150, secondary: 120 }, // Green-emerald
    { primary: 35, secondary: 50 },   // Amber-gold
    { primary: 160, secondary: 140 }, // Teal
    { primary: 40, secondary: 25 },   // Orange-gold
  ];

  const scheme = hueOptions[Math.floor(Math.random() * hueOptions.length)];
  const hueVariation = (Math.random() - 0.5) * 15;
  const primaryHue = scheme.primary + hueVariation;
  const secondaryHue = scheme.secondary + hueVariation;
  const saturation = 65 + Math.random() * 20;
  const lightness = 55 + Math.random() * 15;

  return {
    primary: `hsl(${primaryHue}, ${saturation}%, ${lightness}%)`,
    gradientStart: `hsl(${primaryHue}, 25%, 8%)`,
    gradientMid: `hsl(${secondaryHue}, 20%, 12%)`,
    gradientEnd: `hsl(${primaryHue + 15}, 18%, 6%)`,
    accent: `hsl(${primaryHue}, ${saturation - 10}%, ${lightness + 10}%)`,
  };
}

function getStandingMessage(percentile: number): { headline: string; subtext: string } {
  const topPercent = 100 - percentile;
  if (percentile >= 99) {
    return { headline: "Literally a top player!", subtext: "Top 1% of all players" };
  } else if (percentile >= 95) {
    return { headline: "Elite calibration!", subtext: `Top ${topPercent}% of all players` };
  } else if (percentile >= 90) {
    return { headline: "Excellent standing!", subtext: `Top ${topPercent}% of all players` };
  } else if (percentile >= 80) {
    return { headline: "Great work!", subtext: `Top ${topPercent}% of all players` };
  } else if (percentile >= 70) {
    return { headline: "Solid performance!", subtext: `Top ${topPercent}% of all players` };
  } else if (percentile >= 50) {
    return { headline: "Top half!", subtext: `Top ${topPercent}% of all players` };
  } else {
    return { headline: "On the rise!", subtext: `Top ${topPercent}% of all players` };
  }
}

export const ShareLeaderboardCard = forwardRef<ShareLeaderboardCardRef, ShareLeaderboardCardProps>(
  ({ percentile, totalPlayers, username }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const colors = useMemo(() => generateColorScheme(), []);
    const { headline, subtext } = getStandingMessage(percentile);
    const topPercent = 100 - percentile;
    const gradientAngle = 120 + Math.random() * 40;

    useImperativeHandle(ref, () => ({
      generateImage: async () => {
        if (!cardRef.current) return null;

        try {
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 2,
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

    return (
      <div
        ref={cardRef}
        className="share-leaderboard-card"
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
            <span className="share-card-tagline">Overall Standing</span>
          </div>

          <div className="share-card-standing">
            <div
              className="share-card-percentile-hero"
              style={{ color: colors.primary }}
            >
              Top {topPercent}%
            </div>
            <div className="share-card-standing-headline">{headline}</div>
            <div className="share-card-standing-subtext">{subtext}</div>
          </div>

          <div className="share-card-players-count">
            of {totalPlayers.toLocaleString()} players
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

ShareLeaderboardCard.displayName = 'ShareLeaderboardCard';

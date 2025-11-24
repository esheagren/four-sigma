import { useRef, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';

interface ShareScoreCardProps {
  totalScore: number;
  displayName: string;
  hits: number;
  total: number;
  calibration?: number;
}

export interface ShareScoreCardRef {
  generateImage: () => Promise<Blob | null>;
}

export const ShareScoreCard = forwardRef<ShareScoreCardRef, ShareScoreCardProps>(
  ({ totalScore, displayName, hits, total, calibration }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      generateImage: async () => {
        if (!cardRef.current) return null;

        try {
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: '#0a0a0f',
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

    return (
      <div
        ref={cardRef}
        className="share-score-card"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
      >
        <div className="share-card-content">
          <div className="share-card-header">
            <span className="share-card-logo">4-σ</span>
            <span className="share-card-tagline">Daily Quant Game</span>
          </div>

          <div className="share-card-score">
            <div className="share-card-score-value">{Math.round(totalScore)}</div>
            <div className="share-card-score-label">points</div>
          </div>

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

          <div className="share-card-player">
            <span className="share-card-player-name">{displayName}</span>
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

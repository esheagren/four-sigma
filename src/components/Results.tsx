import { DailyScoreCard } from './DailyScoreCard';
import { ShareScoreCard, type ShareScoreCardRef } from './ShareScoreCard';
import { ResultCard } from './results/ResultCard';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../context/PostHogContext';

interface CrowdGuess {
  min: number;
  max: number;
}

interface CrowdData {
  guesses: CrowdGuess[];
  avgMin: number;
  avgMax: number;
  avgHit: boolean;
  hitRate: number;
  totalResponses: number;
}

interface Judgement {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  source?: string;
  sourceUrl?: string;
  communityStats?: {
    averageScore: number;
    highestScore: number;
  };
  crowdData?: CrowdData;
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface ResultsProps {
  judgements: Judgement[];
  score: number;
  onRestart: () => void;
  dailyRank?: number;
  topScoreGlobal?: number;
  averageScore?: number;
  dailyAverageScore?: number;
  calibration?: number;
  performanceHistory?: PerformanceHistoryEntry[];
  totalParticipants?: number;
}

export function Results({
  judgements,
  score,
  onRestart,
  dailyRank,
  topScoreGlobal,
  dailyAverageScore,
  calibration,
  performanceHistory,
  totalParticipants
}: ResultsProps) {
  const { user } = useAuth();
  const { capture } = useAnalytics();
  const shareCardRef = useRef<ShareScoreCardRef>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const hits = judgements.filter(j => j.hit).length;
  const total = judgements.length;

  // Calculate percentile: if rank is 1 out of 10, you beat 90% of players
  const percentile = (dailyRank && totalParticipants && totalParticipants > 0)
    ? Math.round(((totalParticipants - dailyRank) / totalParticipants) * 100)
    : undefined;

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    setIsSharing(true);
    setShareSuccess(false);

    try {
      const blob = await shareCardRef.current.generateImage();
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      let shareMethod = 'unknown';

      // Try to use Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '4sigma-score.png', { type: 'image/png' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          shareMethod = 'native_share';
          setShareSuccess(true);

          capture('score_shared', {
            score,
            shareMethod,
            hits,
            total,
            calibration,
            percentile,
          });
          return;
        }
      }

      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        shareMethod = 'clipboard';
        setShareSuccess(true);
      } catch (clipboardError) {
        // Final fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '4sigma-score.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        shareMethod = 'download';
        setShareSuccess(true);
      }

      capture('score_shared', {
        score,
        shareMethod,
        hits,
        total,
        calibration,
        percentile,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      capture('share_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        score,
      });
    } finally {
      setIsSharing(false);
      // Reset success message after 3 seconds
      if (shareSuccess) {
        setTimeout(() => setShareSuccess(false), 3000);
      }
    }
  };

  return (
    <div className="results-container">
      {/* Hidden share card for image generation */}
      <ShareScoreCard
        ref={shareCardRef}
        totalScore={score}
        displayName={user?.displayName || 'Player'}
        hits={hits}
        total={total}
        calibration={calibration}
        percentile={percentile}
      />

      <DailyScoreCard
        totalScore={score}
        dailyRank={dailyRank}
        calibration={calibration}
        onShare={handleShare}
        isSharing={isSharing}
      />

      <div className="judgements-list">
        {judgements.map((judgement, index) => (
          <ResultCard
            key={judgement.questionId}
            judgement={judgement}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}


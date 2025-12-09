import { useRef, useState } from 'react';
import { QuestionSlide } from './QuestionSlide';
import { SummarySlide } from './SummarySlide';
import { ShareScoreCard, type ShareScoreCardRef } from '../ShareScoreCard';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

interface CrowdData {
  avgMin: number;
  avgMax: number;
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
  crowdData?: CrowdData;
}

interface TikTokResultsProps {
  judgements: Judgement[];
  score: number;
  calibration?: number;
  dailyRank?: number;
  totalParticipants?: number;
  calibrationHistory?: number[];
}

export function TikTokResults({
  judgements,
  score,
  calibration,
  dailyRank,
  totalParticipants,
  calibrationHistory,
}: TikTokResultsProps) {
  const { user } = useAuth();
  const { capture } = useAnalytics();
  const shareCardRef = useRef<ShareScoreCardRef>(null);
  const [isSharing, setIsSharing] = useState(false);

  const hits = judgements.filter(j => j.hit).length;
  const total = judgements.length;

  // Calculate percentile
  const percentile = (dailyRank && totalParticipants && totalParticipants > 0)
    ? Math.round(((totalParticipants - dailyRank) / totalParticipants) * 100)
    : undefined;

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    setIsSharing(true);

    try {
      const blob = await shareCardRef.current.generateImage();
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      let shareMethod = 'unknown';

      // Try native share first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '4sigma-score.png', { type: 'image/png' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          shareMethod = 'native_share';
          capture('score_shared', { score, shareMethod, hits, total, calibration, percentile });
          return;
        }
      }

      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        shareMethod = 'clipboard';
      } catch {
        // Final fallback: Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '4sigma-score.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        shareMethod = 'download';
      }

      capture('score_shared', { score, shareMethod, hits, total, calibration, percentile });
    } catch (error) {
      console.error('Error sharing:', error);
      capture('share_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        score,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="tiktok-results">
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

      {/* Scroll snap container */}
      <div className="tiktok-scroll-container">
        {judgements.map((judgement, index) => (
          <QuestionSlide
            key={judgement.questionId}
            {...judgement}
            index={index}
            total={total}
          />
        ))}

        <SummarySlide
          totalScore={score}
          calibration={calibration}
          calibrationHistory={calibrationHistory}
          hits={hits}
          total={total}
          percentile={percentile}
          dailyRank={dailyRank}
          onShare={handleShare}
          isSharing={isSharing}
        />
      </div>
    </div>
  );
}

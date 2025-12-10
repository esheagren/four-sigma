import { useRef, useState, useEffect, useCallback } from 'react';
import { QuestionSlide } from './QuestionSlide';
import { DailyStatsSlide } from './DailyStatsSlide';
import { UserStatsSlide } from './UserStatsSlide';
import { ShareScoreCard, type ShareScoreCardRef } from './ShareScoreCard';
import { BackgroundAnimation } from '../BackgroundAnimation';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

interface CrowdData {
  avgMin: number;
  avgMax: number;
  hitRate: number;
  totalResponses: number;
}

interface CommunityStats {
  averageScore: number;
  highestScore: number;
  highestScoreUsername?: string;
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
  communityStats?: CommunityStats;
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface ResultsCarouselProps {
  judgements: Judgement[];
  score: number;
  calibration?: number;
  dailyRank?: number;
  totalParticipants?: number;
  topScoreToday?: number;
  performanceHistory?: PerformanceHistoryEntry[];
}

export function ResultsCarousel({
  judgements,
  score,
  calibration = 0,
  dailyRank,
  totalParticipants,
  topScoreToday,
  performanceHistory,
}: ResultsCarouselProps) {
  const { user } = useAuth();
  const { capture } = useAnalytics();
  const shareCardRef = useRef<ShareScoreCardRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const hits = judgements.filter(j => j.hit).length;
  const total = judgements.length;
  const totalSlides = judgements.length + 2;

  // Track which slide is currently visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setActiveSlideIndex(index);
            }
          }
        });
      },
      { threshold: 0.5, root: scrollContainerRef.current }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [judgements.length]);

  const setSlideRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    slideRefs.current[index] = el;
  }, []);

  // Calculate percentile
  const percentile = (dailyRank && totalParticipants && totalParticipants > 0)
    ? Math.round(((totalParticipants - dailyRank) / totalParticipants) * 100)
    : undefined;

  // Extract question high scores
  const questionHighScores = judgements.map(j => ({
    questionId: j.questionId,
    prompt: j.prompt,
    highestScore: j.communityStats?.highestScore ?? 0,
    username: j.communityStats?.highestScoreUsername,
  }));

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
      {/* Animated background */}
      <BackgroundAnimation />

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

      {/* Flex layout: dots on left, content on right */}
      <div className="results-layout">
        {/* Dot indicators - own column, no overlap */}
        <div className="slide-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`slide-dot ${i === activeSlideIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Scroll snap container */}
        <div className="tiktok-scroll-container" ref={scrollContainerRef}>
          {/* Individual question slides */}
          {judgements.map((judgement, index) => (
            <QuestionSlide
              key={judgement.questionId}
              ref={setSlideRef(index)}
              {...judgement}
            />
          ))}

          {/* Daily Stats Slide (Session Complete) */}
          <DailyStatsSlide
            ref={setSlideRef(judgements.length)}
            totalScore={score}
            topScoreToday={topScoreToday}
            hits={hits}
            total={total}
            questionHighScores={questionHighScores}
            onShare={handleShare}
            isSharing={isSharing}
          />

          {/* User Stats Slide (Long-term stats) */}
          <UserStatsSlide
            ref={setSlideRef(judgements.length + 1)}
            calibration={calibration}
            performanceHistory={performanceHistory}
          />
        </div>
      </div>
    </div>
  );
}

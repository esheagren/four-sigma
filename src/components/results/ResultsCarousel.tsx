import { useRef, useState, useEffect, useCallback } from 'react';
import { QuestionSlide } from './QuestionSlide';
import { DailyStatsSlide } from './DailyStatsSlide';
import { UserStatsSlide } from './UserStatsSlide';
import { ScoreOrbSlide } from './ScoreOrbSlide';
import { QuestionLeadersSlide } from './QuestionLeadersSlide';
import { ShareScoreCard, type ShareScoreCardRef } from './ShareScoreCard';
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
  highestScoreLowerBound?: number;
  highestScoreUpperBound?: number;
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
  answerContext?: string;
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

interface CalibrationMilestone {
  date: string;
  label: string;
  calibration: number;
}

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

interface OverallLeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

interface ResultsCarouselProps {
  judgements: Judgement[];
  score: number;
  calibration?: number;
  dailyRank?: number;
  totalParticipants?: number;
  topScoreToday?: number;
  performanceHistory?: PerformanceHistoryEntry[];
  calibrationMilestones?: CalibrationMilestone[];
  todayLeaderboard?: TodayLeaderboardEntry[];
  overallLeaderboard?: OverallLeaderboardEntry[];
  onScroll?: (progress: number) => void;
}

export function ResultsCarousel({
  judgements,
  score,
  calibration = 0,
  dailyRank,
  totalParticipants,
  topScoreToday,
  performanceHistory,
  calibrationMilestones,
  todayLeaderboard,
  overallLeaderboard,
  onScroll,
}: ResultsCarouselProps) {
  const { user } = useAuth();
  const { capture } = useAnalytics();
  const shareCardRef = useRef<ShareScoreCardRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll position for orb shrinking effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = window.innerHeight;
      // Progress: 0 at top, 1 when scrolled one full slide
      const progress = Math.min(scrollTop / slideHeight, 1);
      setScrollProgress(progress);
      // Notify parent of scroll progress for orb positioning
      onScroll?.(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  // Defensive check: ensure judgements is always an array
  const safeJudgements = judgements ?? [];
  const hits = safeJudgements.filter(j => j.hit).length;
  const total = safeJudgements.length;
  // +4 for ScoreOrbSlide, DailyStatsSlide, UserStatsSlide, QuestionLeadersSlide
  const totalSlides = safeJudgements.length + 4;

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
  }, [safeJudgements.length]);

  const setSlideRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    slideRefs.current[index] = el;
  }, []);

  // Calculate percentile
  const percentile = (dailyRank && totalParticipants && totalParticipants > 0)
    ? Math.round(((totalParticipants - dailyRank) / totalParticipants) * 100)
    : undefined;

  // Extract question high scores with bounds
  const questionHighScores = safeJudgements.map(j => ({
    questionId: j.questionId,
    prompt: j.prompt,
    highestScore: j.communityStats?.highestScore ?? 0,
    username: j.communityStats?.highestScoreUsername,
    lowerBound: j.communityStats?.highestScoreLowerBound,
    upperBound: j.communityStats?.highestScoreUpperBound,
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
          {/* Score Orb Slide - spacer for scroll snap (orb rendered by Game.tsx) */}
          <ScoreOrbSlide
            ref={setSlideRef(0)}
            scrollProgress={scrollProgress}
          />

          {/* Individual question slides */}
          {safeJudgements.map((judgement, index) => (
            <QuestionSlide
              key={judgement.questionId}
              ref={setSlideRef(index + 1)}
              {...judgement}
            />
          ))}

          {/* Daily Stats Slide (Overall Leaderboard) */}
          <DailyStatsSlide
            ref={setSlideRef(safeJudgements.length + 1)}
            overallLeaderboard={overallLeaderboard}
          />

          {/* User Stats Slide (Long-term stats) */}
          <UserStatsSlide
            ref={setSlideRef(safeJudgements.length + 2)}
            calibration={calibration}
            performanceHistory={performanceHistory}
            calibrationMilestones={calibrationMilestones}
            userStats={user ? {
              gamesPlayed: user.gamesPlayed,
              averageScore: user.averageScore,
              bestSingleScore: user.bestSingleScore,
              currentStreak: user.currentStreak,
              bestStreak: user.bestStreak,
            } : undefined}
          />

          {/* Question Leaders Slide (Bottom - top scorer for each question) */}
          <QuestionLeadersSlide
            ref={setSlideRef(safeJudgements.length + 3)}
            questionHighScores={questionHighScores}
          />
        </div>
      </div>
    </div>
  );
}

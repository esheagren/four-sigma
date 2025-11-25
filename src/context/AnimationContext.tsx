import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type AnimationPhaseName = 'idle' | 'fadeOut' | 'intensify' | 'converge' | 'reveal' | 'calm';

interface AnimationContextType {
  animationPhase: AnimationPhaseName;
  intensity: number;
  convergenceProgress: number;
  triggerRevealAnimation: () => Promise<void>;
  isAnimating: boolean;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

// Phase durations in milliseconds
const PHASE_DURATIONS = {
  fadeOut: 300,
  intensify: 900,
  converge: 600,
  reveal: 400,
  calm: 800,
};

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Animate a value over time using requestAnimationFrame
function animateValue(
  setter: (value: number) => void,
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number = easeOutCubic
): Promise<void> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const value = from + (to - from) * easedProgress;

      setter(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhaseName>('idle');
  const [intensity, setIntensity] = useState(0);
  const [convergenceProgress, setConvergenceProgress] = useState(0);

  const isAnimating = animationPhase !== 'idle';

  const triggerRevealAnimation = useCallback(async (): Promise<void> => {
    // Phase 1: Fade Out (300ms) - QuestionCard fades, slight intensity build
    setAnimationPhase('fadeOut');
    await animateValue(setIntensity, 0, 0.2, PHASE_DURATIONS.fadeOut);

    // Phase 2: Intensify (900ms) - Background becomes ferocious
    setAnimationPhase('intensify');
    await animateValue(setIntensity, 0.2, 1.0, PHASE_DURATIONS.intensify, easeInOutQuad);

    // Phase 3: Converge (600ms) - Blobs rush to center, pause, explode
    setAnimationPhase('converge');
    await animateValue(setConvergenceProgress, 0, 1.0, PHASE_DURATIONS.converge, easeInOutQuad);

    // Phase 4: Reveal (400ms) - Results appear, intensity starts dropping
    setAnimationPhase('reveal');
    await animateValue(setIntensity, 1.0, 0.3, PHASE_DURATIONS.reveal);
    setConvergenceProgress(0); // Reset convergence

    // Phase 5: Calm (800ms) - Background returns to normal (runs in background)
    setAnimationPhase('calm');
    animateValue(setIntensity, 0.3, 0, PHASE_DURATIONS.calm).then(() => {
      setAnimationPhase('idle');
    });

    // Return after reveal phase - total time: 300 + 900 + 600 + 400 = 2200ms
  }, []);

  const value: AnimationContextType = {
    animationPhase,
    intensity,
    convergenceProgress,
    triggerRevealAnimation,
    isAnimating,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

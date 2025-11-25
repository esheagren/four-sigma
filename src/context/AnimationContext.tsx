import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type AnimationPhaseName = 'idle' | 'fadeOut' | 'showOrb' | 'burst' | 'reveal';

interface AnimationContextType {
  animationPhase: AnimationPhaseName;
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
  showOrb: 1000,
  burst: 500,
  reveal: 400,
};

// Helper to wait for a duration
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhaseName>('idle');

  const isAnimating = animationPhase !== 'idle';

  const triggerRevealAnimation = useCallback(async (): Promise<void> => {
    // Phase 1: Fade Out (300ms) - QuestionCard fades, orb appears
    setAnimationPhase('fadeOut');
    await wait(PHASE_DURATIONS.fadeOut);

    // Phase 2: Show Orb (1000ms) - Orb spins
    setAnimationPhase('showOrb');
    await wait(PHASE_DURATIONS.showOrb);

    // Phase 3: Burst (500ms) - Particles scatter outward
    setAnimationPhase('burst');
    await wait(PHASE_DURATIONS.burst);

    // Phase 4: Reveal (400ms) - Results appear
    setAnimationPhase('reveal');
    await wait(PHASE_DURATIONS.reveal);

    // Return to idle
    setAnimationPhase('idle');

    // Total time: 300 + 1000 + 500 + 400 = 2200ms
  }, []);

  const value: AnimationContextType = {
    animationPhase,
    triggerRevealAnimation,
    isAnimating,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

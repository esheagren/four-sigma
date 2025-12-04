/**
 * Interval Visualization Utility Functions
 *
 * Provides viewport calculation and coordinate conversion for the
 * confidence interval visualization.
 */

// SVG coordinate constants
export const BASELINE_Y = 90;
export const SVG_WIDTH = 300;
export const SVG_HEIGHT = 100;

/**
 * Viewport configuration for the visualization
 */
export interface ViewportConfig {
  viewportMin: number;
  viewportMax: number;
  viewportRange: number;
  isWildMissLeft: boolean;
  isWildMissRight: boolean;
}

/**
 * Calculate the viewport bounds for the visualization
 * Uses user-centric zoom logic that prioritizes showing the user's interval
 * while optionally expanding to include the actual answer if it's nearby
 */
export function calculateViewport(
  userMin: number,
  userMax: number,
  trueValue: number
): ViewportConfig {
  const userRange = userMax - userMin;
  const userMid = (userMin + userMax) / 2;

  // Target viewport: user takes ~40% of the view (2.5x multiplier)
  const targetViewportSpan = Math.max(userRange * 2.5, 1);

  // Initial viewport centered on user's interval
  let vizMin = userMid - (targetViewportSpan / 2);
  let vizMax = userMid + (targetViewportSpan / 2);

  // Determine if actual answer is wildly outside our view
  const expansionThreshold = targetViewportSpan * 1.5;
  const isWildMissRight = trueValue > (userMax + expansionThreshold);
  const isWildMissLeft = trueValue < (userMin - expansionThreshold);

  // If actual is within reasonable range, expand viewport to include it
  if (!isWildMissRight && !isWildMissLeft) {
    const pointsOfInterest = [vizMin, vizMax, trueValue];
    const minPoint = Math.min(...pointsOfInterest);
    const maxPoint = Math.max(...pointsOfInterest);
    const span = maxPoint - minPoint;

    // Add 5% padding on each side
    vizMin = minPoint - (span * 0.05);
    vizMax = maxPoint + (span * 0.05);
  }

  // Clamp viewport minimum to zero (values shouldn't be negative)
  if (vizMin < 0) {
    const adjustment = -vizMin;
    vizMin = 0;
    vizMax += adjustment;
  }

  return {
    viewportMin: vizMin,
    viewportMax: vizMax,
    viewportRange: vizMax - vizMin,
    isWildMissLeft,
    isWildMissRight,
  };
}

/**
 * Convert a data value to an X coordinate in SVG space
 */
export function valueToX(
  value: number,
  viewportMin: number,
  viewportRange: number
): number {
  return ((value - viewportMin) / viewportRange) * SVG_WIDTH;
}

/**
 * Format a number for display (with localization and smart precision)
 */
export function formatNumber(value: number): string {
  // For very large or small numbers, use compact notation
  if (Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  // For numbers with decimals, limit precision
  if (!Number.isInteger(value)) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  return value.toLocaleString('en-US');
}

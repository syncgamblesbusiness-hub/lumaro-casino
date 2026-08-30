/**
 * Central casino math.
 *
 * Every game imports these helpers instead of hardcoding multipliers or
 * probabilities, so RTP / House Edge / Multiplier / EV always stay
 * mathematically consistent with each other:
 *
 *   houseEdge = 1 - RTP
 *   multiplier = RTP / winProbability
 *   EV = bet * (winProbability * multiplier - 1) = -bet * houseEdge
 */

/** Default target RTP shared by Dice and Ascent. Plinko derives its own
 *  effective RTP from its (rounded, display-friendly) multiplier table,
 *  but is generated against this same target. */
export const DEFAULT_RTP = 0.99; // 99% RTP
export const DEFAULT_HOUSE_EDGE = 1 - DEFAULT_RTP; // 1%

export function houseEdgeFromRtp(rtp: number): number {
  return 1 - rtp;
}

export function rtpFromHouseEdge(houseEdge: number): number {
  return 1 - houseEdge;
}

/** multiplier = RTP / winProbability (winProbability is 0..1) */
export function multiplierFromProbability(
  winProbability: number,
  rtp: number = DEFAULT_RTP
): number {
  if (winProbability <= 0) return Infinity;
  return rtp / winProbability;
}

/** Inverse: probability implied by a chosen multiplier at a given RTP. */
export function probabilityFromMultiplier(
  multiplier: number,
  rtp: number = DEFAULT_RTP
): number {
  if (multiplier <= 0) return 0;
  return rtp / multiplier;
}

export function potentialPayout(bet: number, multiplier: number): number {
  return bet * multiplier;
}

/** Expected value of a single wager. Should always equal -bet * houseEdge. */
export function expectedValue(
  bet: number,
  winProbability: number,
  multiplier: number
): number {
  return bet * (winProbability * multiplier - 1);
}

/** Weighted-average RTP of a discrete payout table (e.g. Plinko buckets). */
export function rtpFromDistribution(
  probabilities: number[],
  multipliers: number[]
): number {
  return probabilities.reduce((sum, p, i) => sum + p * multipliers[i], 0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/** Probability of landing exactly `k` "right" steps out of `n` fair 50/50 steps. */
export function binomialProbability(n: number, k: number): number {
  return binomialCoefficient(n, k) * Math.pow(0.5, n);
}

export function formatMultiplier(m: number): string {
  if (!isFinite(m)) return "—";
  return `${m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0)}x`;
}

export function formatPercent(p: number, digits = 2): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatCredits(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

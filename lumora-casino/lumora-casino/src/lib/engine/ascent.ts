import { DEFAULT_RTP } from "./math";
import { FairnessInputs, fairFloat } from "./rng";

export const MIN_CRASH = 1.0;
export const MAX_CRASH = 1000;

/**
 * Crash point distribution.
 *
 * We want: for any cash-out target m >= 1, P(crashPoint >= m) = RTP / m.
 * That guarantees EV of auto-cashing out at any multiplier equals
 * bet * RTP, i.e. a constant house edge regardless of strategy.
 *
 * Derivation: let u be uniform in [0,1). Solve u = 1 - RTP/m for m:
 *   m = RTP / (1 - u)
 * Values of u close to 1 push m towards infinity (capped), values of u
 * below (1 - RTP) push m below 1x, which is clamped to an instant 1.00x
 * "bust" — this is exactly what reproduces the house edge as an
 * instant-crash probability of (1 - RTP).
 */
export function crashPointFromFloat(float: number, rtp: number = DEFAULT_RTP): number {
  const raw = rtp / (1 - float);
  const capped = Math.min(raw, MAX_CRASH);
  const rounded = Math.floor(capped * 100) / 100;
  return Math.max(MIN_CRASH, rounded);
}

export async function resolveAscentRound(
  inputs: FairnessInputs,
  rtp: number = DEFAULT_RTP
): Promise<{ crashPoint: number; hash: string }> {
  const { float, hash } = await fairFloat(inputs);
  return { crashPoint: crashPointFromFloat(float, rtp), hash };
}

/** Multiplier curve used purely for the visual growth animation. */
export function multiplierAtTime(elapsedMs: number): number {
  // Smooth exponential-ish growth, ~ reaches 2x at 3.5s, 10x at ~11s.
  const t = elapsedMs / 1000;
  return Math.max(1, Math.pow(1.06, t * 12));
}

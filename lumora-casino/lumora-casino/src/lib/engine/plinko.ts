import { DEFAULT_RTP, binomialProbability, rtpFromDistribution } from "./math";
import { FairnessInputs, fairFloat } from "./rng";

export type PlinkoRisk = "low" | "medium" | "high";

export const MIN_ROWS = 8;
export const MAX_ROWS = 16;

/**
 * Raw, unscaled "shape" of payouts across bucket distance from the centre,
 * before they are normalised to hit the target RTP exactly. Distinct curves
 * per risk level control variance: Low is flat, High is extreme at the
 * edges. Values are for a 0..half-width distance index; the table is
 * mirrored to build the full symmetric row.
 */
function rawShape(risk: PlinkoRisk, halfWidth: number): number[] {
  const steepness = risk === "low" ? 1.35 : risk === "medium" ? 1.85 : 2.6;
  const floorVal = risk === "low" ? 0.4 : risk === "medium" ? 0.25 : 0.1;
  const shape: number[] = [];
  for (let d = 0; d <= halfWidth; d++) {
    const t = d / halfWidth; // 0 at centre, 1 at edge
    shape.push(floorVal + Math.pow(t, steepness) * (risk === "high" ? 900 : risk === "medium" ? 60 : 8));
  }
  return shape;
}

/**
 * Builds the full multiplier table for `rows` pins and a risk level, scaled
 * so the true weighted RTP (computed from real binomial bucket
 * probabilities) equals `targetRtp`. Multipliers are rounded to sensible
 * display precision; the *actual* RTP of the rounded table is also
 * returned so the UI never claims a number the table doesn't back up.
 */
export function buildPlinkoTable(
  rows: number,
  risk: PlinkoRisk,
  targetRtp: number = DEFAULT_RTP
) {
  const buckets = rows + 1;
  const half = Math.floor(rows / 2);
  const shape = rawShape(risk, half);
  // Mirror the half-shape into the full bucket array (odd/even rows both work).
  const raw: number[] = [];
  for (let i = 0; i < buckets; i++) {
    const distFromCentre = Math.abs(i - rows / 2);
    const idx = Math.min(half, Math.round(distFromCentre));
    raw.push(shape[idx]);
  }

  const probabilities = Array.from({ length: buckets }, (_, k) =>
    binomialProbability(rows, k)
  );

  const unscaledRtp = rtpFromDistribution(probabilities, raw);
  const scale = targetRtp / unscaledRtp;
  const multipliers = raw.map((v) => {
    const scaled = v * scale;
    // Round to a clean display precision depending on magnitude.
    if (scaled >= 100) return Math.round(scaled / 5) * 5;
    if (scaled >= 10) return Math.round(scaled * 2) / 2;
    return Math.round(scaled * 100) / 100;
  });

  const actualRtp = rtpFromDistribution(probabilities, multipliers);

  return {
    rows,
    risk,
    buckets,
    multipliers,
    probabilities,
    actualRtp,
    houseEdge: 1 - actualRtp,
  };
}

export interface PlinkoDropResult {
  bucket: number;
  path: (0 | 1)[]; // 0 = left, 1 = right, one entry per row
  multiplier: number;
  hashes: string[];
}

/** Simulates one ball drop deterministically from the fairness inputs. */
export async function dropPlinkoBall(
  inputs: FairnessInputs,
  rows: number,
  multipliers: number[]
): Promise<PlinkoDropResult> {
  const path: (0 | 1)[] = [];
  const hashes: string[] = [];
  let bucket = 0;
  for (let row = 0; row < rows; row++) {
    const { float, hash } = await fairFloat(inputs, row);
    const step: 0 | 1 = float < 0.5 ? 0 : 1;
    path.push(step);
    hashes.push(hash);
    bucket += step;
  }
  return { bucket, path, multiplier: multipliers[bucket], hashes };
}

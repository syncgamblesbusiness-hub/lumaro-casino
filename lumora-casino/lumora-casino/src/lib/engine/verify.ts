import { BetRecord } from "@/lib/store/casino";
import { fairFloat } from "./rng";
import { crashPointFromFloat } from "./ascent";

export interface VerifyResult {
  matches: boolean;
  steps: string[];
  recomputedHash: string;
}

/**
 * Recomputes a past bet purely from its recorded (serverSeed, clientSeed,
 * nonce) triple and compares the result against what was shown to the
 * player at the time. This is the same code path the games themselves use
 * (fairFloat + the per-game transform), so a mismatch here would mean the
 * original result was tampered with.
 */
export async function verifyBetRecord(record: BetRecord): Promise<VerifyResult> {
  const inputs = {
    serverSeed: record.serverSeedUsed,
    clientSeed: record.clientSeedUsed,
    nonce: record.nonce,
  };
  const steps: string[] = [
    `message = serverSeed:clientSeed:nonce:cursor`,
    `"${record.serverSeedUsed.slice(0, 8)}…:${record.clientSeedUsed}:${record.nonce}:0"`,
  ];

  const verify = record.verify;

  if (verify.type === "dice") {
    const { float, hash } = await fairFloat(inputs);
    const roll = Math.floor(float * 10000) / 100;
    steps.push(`SHA-256(message) = ${hash}`);
    steps.push(`float = first 52 bits / 2^52 = ${float.toFixed(10)}`);
    steps.push(`roll = floor(float * 10000) / 100 = ${roll.toFixed(2)}`);
    const matches = roll === verify.roll && hash === record.hash;
    return { matches, steps, recomputedHash: hash };
  }

  if (verify.type === "ascent") {
    const { float, hash } = await fairFloat(inputs);
    const crashPoint = crashPointFromFloat(float, verify.rtp);
    steps.push(`SHA-256(message) = ${hash}`);
    steps.push(`float = ${float.toFixed(10)}`);
    steps.push(`crashPoint = RTP / (1 - float), floored to 2dp = ${crashPoint.toFixed(2)}x`);
    const matches = crashPoint === verify.crashPoint && hash === record.hash;
    return { matches, steps, recomputedHash: hash };
  }

  // plinko
  const path: (0 | 1)[] = [];
  let bucket = 0;
  let firstHash = "";
  for (let row = 0; row < verify.rows; row++) {
    const { float, hash } = await fairFloat(inputs, row);
    if (row === 0) firstHash = hash;
    const step: 0 | 1 = float < 0.5 ? 0 : 1;
    path.push(step);
    bucket += step;
  }
  steps.push(`for each of ${verify.rows} rows: SHA-256(...:cursor=row) → left/right`);
  steps.push(`path = [${path.join(", ")}]`);
  steps.push(`bucket = sum(path) = ${bucket}`);
  const matches =
    bucket === verify.bucket &&
    path.length === verify.path.length &&
    path.every((s, i) => s === verify.path[i]);
  return { matches, steps, recomputedHash: firstHash };
}

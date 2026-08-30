import { DEFAULT_RTP, clamp, multiplierFromProbability } from "./math";
import { FairnessInputs, fairFloat } from "./rng";

export type RollDirection = "under" | "over";

export const MIN_CHANCE = 0.01;
export const MAX_CHANCE = 99.99;
export const ROLL_MIN = 0;
export const ROLL_MAX = 99.99;

export interface DiceConfig {
  target: number; // 0.00 - 99.99, the roll-under/over threshold
  direction: RollDirection;
  rtp?: number;
}

export interface DiceOutcome {
  roll: number; // 0.00 - 99.99
  win: boolean;
  chance: number; // win probability in percent
  multiplier: number;
  hash: string;
}

/** Win chance in percent implied by a target + direction. */
export function chanceForTarget(target: number, direction: RollDirection): number {
  const t = clamp(target, MIN_CHANCE, MAX_CHANCE);
  const chance = direction === "under" ? t : ROLL_MAX - t;
  return clamp(chance, MIN_CHANCE, MAX_CHANCE);
}

/** Given a desired win chance (%), returns the target roll value for a direction. */
export function targetForChance(chance: number, direction: RollDirection): number {
  const c = clamp(chance, MIN_CHANCE, MAX_CHANCE);
  return direction === "under" ? c : clamp(ROLL_MAX - c, MIN_CHANCE, MAX_CHANCE);
}

export function diceMultiplier(chancePercent: number, rtp: number = DEFAULT_RTP): number {
  return multiplierFromProbability(chancePercent / 100, rtp);
}

/** Resolve one dice round from the fairness inputs. Pure & deterministic. */
export async function resolveDiceRoll(
  inputs: FairnessInputs,
  config: DiceConfig
): Promise<DiceOutcome> {
  const rtp = config.rtp ?? DEFAULT_RTP;
  const { float, hash } = await fairFloat(inputs);
  const roll = Math.floor(float * 10000) / 100; // 0.00 - 99.99
  const chance = chanceForTarget(config.target, config.direction);
  const win =
    config.direction === "under" ? roll < config.target : roll > config.target;
  const multiplier = diceMultiplier(chance, rtp);
  return { roll, win, chance, multiplier, hash };
}

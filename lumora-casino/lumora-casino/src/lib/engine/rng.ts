/**
 * Provably Fair RNG core.
 *
 * A demo simulation of the classic "server seed / client seed / nonce"
 * scheme used across the industry. All results are derived deterministically
 * from these three inputs via SHA-256, so any round can be independently
 * re-computed and verified by the player.
 *
 * This module is pure and has zero UI dependencies — it can be unit tested
 * or swapped for a real backend-signed implementation without touching any
 * component code.
 */

export interface FairnessInputs {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

/** SHA-256 hex digest using the Web Crypto API (available in all modern browsers). */
export async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generates a cryptographically random hex seed of the given byte length. */
export function randomSeed(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derives one or more independent uniform floats in [0, 1) from the fairness
 * inputs. `cursor` lets a single (serverSeed, clientSeed, nonce) triple
 * produce several independent numbers (e.g. one per Plinko row) by hashing
 * a different message per cursor position.
 */
export async function fairFloat(
  inputs: FairnessInputs,
  cursor = 0
): Promise<{ float: number; hash: string }> {
  const message = `${inputs.serverSeed}:${inputs.clientSeed}:${inputs.nonce}:${cursor}`;
  const hash = await sha256Hex(message);
  // Take the first 13 hex chars => 52 bits, safely inside Number precision.
  const slice = hash.slice(0, 13);
  const intVal = parseInt(slice, 16);
  const float = intVal / Math.pow(2, 52);
  return { float, hash };
}

/** Convenience: derive `count` independent floats from one fairness triple. */
export async function fairFloats(
  inputs: FairnessInputs,
  count: number
): Promise<{ floats: number[]; hashes: string[] }> {
  const floats: number[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const { float, hash } = await fairFloat(inputs, i);
    floats.push(float);
    hashes.push(hash);
  }
  return { floats, hashes };
}

/** Maps a uniform float in [0,1) onto an integer range [0, max). */
export function floatToInt(float: number, max: number): number {
  return Math.min(max - 1, Math.floor(float * max));
}

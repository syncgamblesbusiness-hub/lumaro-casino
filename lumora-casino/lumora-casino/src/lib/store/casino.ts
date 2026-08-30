"use client";

import { create } from "zustand";
import { randomSeed, sha256Hex } from "@/lib/engine/rng";

export type GameId = "plinko" | "dice" | "ascent";

export interface DiceVerify {
  type: "dice";
  target: number;
  direction: "under" | "over";
  rtp: number;
  roll: number;
}

export interface PlinkoVerify {
  type: "plinko";
  rows: number;
  bucket: number;
  path: (0 | 1)[];
}

export interface AscentVerify {
  type: "ascent";
  rtp: number;
  crashPoint: number;
}

export type VerifyPayload = DiceVerify | PlinkoVerify | AscentVerify;

export interface BetRecord {
  id: string;
  game: GameId;
  time: number;
  betAmount: number;
  payout: number;
  profit: number;
  multiplier: number;
  win: boolean;
  detail: string;
  nonce: number;
  hash: string;
  serverSeedUsed: string;
  clientSeedUsed: string;
  verify: VerifyPayload;
}

export interface SeedRotation {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonceStart: number;
  nonceEnd: number;
  rotatedAt: number;
}

const STARTING_BALANCE = 1000;

interface CasinoState {
  ready: boolean;
  balance: number;
  currency: string;

  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  seedHistory: SeedRotation[];

  history: BetRecord[];

  init: () => Promise<void>;
  setClientSeed: (seed: string) => void;
  rotateServerSeed: () => Promise<void>;
  adjustBalance: (delta: number) => void;
  resetBalance: () => void;
  consumeNonce: () => number;
  recordBet: (record: Omit<BetRecord, "id" | "time">) => void;
  clearHistory: () => void;
}

export const useCasinoStore = create<CasinoState>((set, get) => ({
  ready: false,
  balance: STARTING_BALANCE,
  currency: "FUN",

  clientSeed: "",
  serverSeed: "",
  serverSeedHash: "",
  nonce: 0,
  seedHistory: [],

  history: [],

  init: async () => {
    if (get().ready) return;
    const serverSeed = randomSeed(16);
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = randomSeed(6);
    set({ serverSeed, serverSeedHash, clientSeed, ready: true });
  },

  setClientSeed: (seed: string) => {
    set({ clientSeed: seed || randomSeed(6) });
  },

  rotateServerSeed: async () => {
    const state = get();
    const newServerSeed = randomSeed(16);
    const newHash = await sha256Hex(newServerSeed);
    const rotation: SeedRotation = {
      serverSeed: state.serverSeed,
      serverSeedHash: state.serverSeedHash,
      clientSeed: state.clientSeed,
      nonceStart: state.seedHistory.length
        ? state.seedHistory[0].nonceEnd + 1
        : 0,
      nonceEnd: state.nonce,
      rotatedAt: Date.now(),
    };
    set({
      serverSeed: newServerSeed,
      serverSeedHash: newHash,
      nonce: 0,
      seedHistory: [rotation, ...state.seedHistory].slice(0, 20),
    });
  },

  adjustBalance: (delta: number) => {
    set((s) => ({ balance: Math.max(0, Math.round((s.balance + delta) * 100) / 100) }));
  },

  resetBalance: () => set({ balance: STARTING_BALANCE }),

  consumeNonce: () => {
    const current = get().nonce;
    set({ nonce: current + 1 });
    return current;
  },

  recordBet: (record) => {
    set((s) => ({
      history: [
        { ...record, id: `${record.game}-${record.nonce}-${Date.now()}`, time: Date.now() },
        ...s.history,
      ].slice(0, 200),
    }));
  },

  clearHistory: () => set({ history: [] }),
}));

// ---- Derived global stats (selector helpers, not stored redundantly) ----

export function selectGlobalStats(history: BetRecord[]) {
  const totalBets = history.length;
  const wagered = history.reduce((sum, h) => sum + h.betAmount, 0);
  const profit = history.reduce((sum, h) => sum + h.profit, 0);
  const wins = history.filter((h) => h.win).length;
  const losses = totalBets - wins;
  const biggestWin = history.reduce((max, h) => Math.max(max, h.profit), 0);
  const biggestMultiplier = history.reduce((max, h) => Math.max(max, h.multiplier), 0);
  return { totalBets, wagered, profit, wins, losses, biggestWin, biggestMultiplier };
}

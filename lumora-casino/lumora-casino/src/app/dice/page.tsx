"use client";

import { useEffect, useRef, useState } from "react";
import { GameLayout } from "@/components/layout/GameLayout";
import { Panel } from "@/components/ui/Panel";
import { BetAmountInput } from "@/components/ui/BetAmountInput";
import { Toggle } from "@/components/ui/Toggle";
import { StatRow, StatGrid, StatTile } from "@/components/ui/StatRow";
import { ResultChip } from "@/components/ui/ResultChip";
import { HistoryTable } from "@/components/ui/HistoryTable";
import { FairnessStrip } from "@/components/fairness/FairnessStrip";
import { DiceTrack } from "@/components/games/dice/DiceTrack";
import { useCasinoStore, selectGlobalStats } from "@/lib/store/casino";
import { useToastStore } from "@/lib/store/toast";
import {
  MAX_CHANCE,
  MIN_CHANCE,
  RollDirection,
  chanceForTarget,
  diceMultiplier,
  resolveDiceRoll,
  targetForChance,
} from "@/lib/engine/dice";
import { DEFAULT_RTP, formatMultiplier, formatPercent, potentialPayout } from "@/lib/engine/math";

export default function DicePage() {
  const balance = useCasinoStore((s) => s.balance);
  const adjustBalance = useCasinoStore((s) => s.adjustBalance);
  const consumeNonce = useCasinoStore((s) => s.consumeNonce);
  const recordBet = useCasinoStore((s) => s.recordBet);
  const clientSeed = useCasinoStore((s) => s.clientSeed);
  const serverSeed = useCasinoStore((s) => s.serverSeed);
  const history = useCasinoStore((s) => s.history);
  const push = useToastStore((s) => s.push);

  const diceHistory = history.filter((h) => h.game === "dice");
  const stats = selectGlobalStats(diceHistory);

  const [betAmount, setBetAmount] = useState(1);
  const [direction, setDirection] = useState<RollDirection>("under");
  const [target, setTarget] = useState(50.5);
  const [turbo, setTurbo] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);

  const [autoOpen, setAutoOpen] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [numBets, setNumBets] = useState<number | "">(0); // 0 or "" = infinite
  const [stopOnProfit, setStopOnProfit] = useState<number | "">("");
  const [stopOnLoss, setStopOnLoss] = useState<number | "">("");
  const stopRef = useRef(false);

  const chance = chanceForTarget(target, direction);
  const multiplier = diceMultiplier(chance, DEFAULT_RTP);
  const potentialWin = potentialPayout(betAmount, multiplier);
  const houseEdge = 1 - DEFAULT_RTP;

  useEffect(() => {
    return () => {
      stopRef.current = true;
    };
  }, []);

  async function placeSingleBet(amount: number) {
    if (amount <= 0 || amount > balance) {
      push({ kind: "error", title: "Invalid bet", description: "Bet amount exceeds your balance." });
      return { win: false, profit: 0 };
    }
    const nonce = consumeNonce();
    adjustBalance(-amount);
    setRolling(true);

    const outcome = await resolveDiceRoll(
      { serverSeed, clientSeed, nonce },
      { target, direction }
    );
    const payout = outcome.win ? amount * outcome.multiplier : 0;
    const profit = payout - amount;
    if (outcome.win) adjustBalance(payout);

    recordBet({
      game: "dice",
      betAmount: amount,
      payout,
      profit,
      multiplier: outcome.multiplier,
      win: outcome.win,
      detail: `${direction} ${target.toFixed(2)} · roll ${outcome.roll.toFixed(2)}`,
      nonce,
      hash: outcome.hash,
      serverSeedUsed: serverSeed,
      clientSeedUsed: clientSeed,
      verify: { type: "dice", target, direction, rtp: DEFAULT_RTP, roll: outcome.roll },
    });

    setLastRoll(outcome.roll);
    setLastWin(outcome.win);

    if (!turbo) await wait(550);
    setRolling(false);
    return { win: outcome.win, profit };
  }

  async function handleManualBet() {
    if (rolling || autoRunning) return;
    await placeSingleBet(betAmount);
  }

  async function startAutoBet() {
    if (autoRunning) return;
    stopRef.current = false;
    setAutoRunning(true);
    let count = 0;
    let sessionProfit = 0;
    push({ kind: "info", title: "Auto-bet started" });

    const maxBets = numBets === "" ? 0 : numBets;
    while (!stopRef.current) {
      if (maxBets > 0 && count >= maxBets) break;
      if (betAmount > useCasinoStore.getState().balance) {
        push({ kind: "error", title: "Auto-bet stopped", description: "Insufficient balance." });
        break;
      }
      const { profit } = await placeSingleBet(betAmount);
      sessionProfit += profit;
      count += 1;
      if (stopOnProfit !== "" && sessionProfit >= Number(stopOnProfit)) {
        push({ kind: "success", title: "Stop on profit reached", description: `+$${sessionProfit.toFixed(2)}` });
        break;
      }
      if (stopOnLoss !== "" && sessionProfit <= -Number(stopOnLoss)) {
        push({ kind: "error", title: "Stop on loss reached", description: `-$${Math.abs(sessionProfit).toFixed(2)}` });
        break;
      }
      await wait(turbo ? 60 : 250);
    }
    setAutoRunning(false);
  }

  function stopAutoBet() {
    stopRef.current = true;
    setAutoRunning(false);
  }

  return (
    <GameLayout
      title="Dice"
      subtitle="Pick a target, choose a side, and let a SHA-256-derived roll decide it — mathematically fair, every time."
      controls={
        <div className="space-y-4">
          <Panel>
            <BetAmountInput value={betAmount} onChange={setBetAmount} disabled={rolling || autoRunning} />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection("under")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  direction === "under"
                    ? "border-win/50 bg-win/10 text-win"
                    : "border-surface-line text-text-muted hover:text-text-primary"
                }`}
              >
                Roll Under
              </button>
              <button
                onClick={() => setDirection("over")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  direction === "over"
                    ? "border-win/50 bg-win/10 text-win"
                    : "border-surface-line text-text-muted hover:text-text-primary"
                }`}
              >
                Roll Over
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                <label htmlFor="target">Target</label>
                <span className="mono-tabular text-text-primary">{target.toFixed(2)}</span>
              </div>
              <input
                id="target"
                type="range"
                min={MIN_CHANCE}
                max={MAX_CHANCE}
                step={0.01}
                value={target}
                disabled={rolling || autoRunning}
                onChange={(e) => setTarget(parseFloat(e.target.value))}
                className="mt-2 w-full accent-violet"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="chance" className="text-xs font-medium text-text-muted">
                Win chance (%)
              </label>
              <input
                id="chance"
                type="number"
                min={MIN_CHANCE}
                max={MAX_CHANCE}
                step={0.01}
                value={chance.toFixed(2)}
                disabled={rolling || autoRunning}
                onChange={(e) => {
                  const c = parseFloat(e.target.value);
                  if (!isNaN(c)) setTarget(targetForChance(c, direction));
                }}
                className="mono-tabular mt-1 w-full rounded-xl border border-surface-line bg-surface-raised px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="mt-4">
              <Toggle checked={turbo} onChange={setTurbo} label="Turbo mode" disabled={autoRunning && false} />
            </div>

            <div className="mt-3">
              <Toggle checked={autoOpen} onChange={setAutoOpen} label="Auto-bet" disabled={rolling} />
            </div>

            {autoOpen && (
              <div className="mt-3 space-y-2 rounded-xl border border-surface-line bg-surface-raised/50 p-3">
                <NumberField
                  label="Number of bets (0 = infinite)"
                  value={numBets}
                  onChange={setNumBets}
                  disabled={autoRunning}
                />
                <NumberField
                  label="Stop on profit ($)"
                  value={stopOnProfit}
                  onChange={setStopOnProfit}
                  disabled={autoRunning}
                  optional
                />
                <NumberField
                  label="Stop on loss ($)"
                  value={stopOnLoss}
                  onChange={setStopOnLoss}
                  disabled={autoRunning}
                  optional
                />
                {!autoRunning ? (
                  <button
                    onClick={startAutoBet}
                    className="w-full rounded-xl bg-violet py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft"
                  >
                    Start auto-bet
                  </button>
                ) : (
                  <button
                    onClick={stopAutoBet}
                    className="w-full rounded-xl bg-loss py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Stop auto-bet
                  </button>
                )}
              </div>
            )}

            {!autoOpen && (
              <button
                onClick={handleManualBet}
                disabled={rolling}
                className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-bold text-white transition hover:bg-violet-soft disabled:opacity-50"
              >
                {rolling ? "Rolling…" : "Roll dice"}
              </button>
            )}
          </Panel>

          <Panel title="Round info">
            <StatRow label="Win chance" value={formatPercent(chance / 100)} />
            <StatRow label="Multiplier" value={formatMultiplier(multiplier)} />
            <StatRow label="Potential win" value={`$${potentialWin.toFixed(2)}`} />
            <StatRow label="RTP" value={formatPercent(DEFAULT_RTP)} />
            <StatRow label="House edge" value={formatPercent(houseEdge)} />
          </Panel>

          <FairnessStrip />
        </div>
      }
      stage={
        <div className="flex min-h-[420px] flex-col justify-between rounded-2xl border border-surface-line bg-surface/70 p-6">
          <div className="relative flex flex-1 items-center justify-center">
            <div className="aurora-field opacity-40" />
            <div className="relative z-10 w-full max-w-md">
              <DiceTrack target={target} direction={direction} roll={lastRoll} rolling={rolling} turbo={turbo} />
            </div>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-1.5 border-t border-surface-line pt-4">
            <span className="mr-1 text-xs text-text-muted">Recent rolls</span>
            {diceHistory.slice(0, 14).map((h) => (
              <ResultChip key={h.id} multiplier={h.multiplier} win={h.win} />
            ))}
            {diceHistory.length === 0 && (
              <span className="text-xs text-text-faint">Play a round to see results here.</span>
            )}
          </div>
        </div>
      }
      below={
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Session stats">
            <StatGrid>
              <StatTile label="Bets" value={String(stats.totalBets)} />
              <StatTile label="Wagered" value={`${stats.wagered.toFixed(2)}`} />
              <StatTile
                label="Net profit"
                value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}`}
                tone={stats.profit >= 0 ? "win" : "loss"}
              />
              <StatTile label="Wins" value={String(stats.wins)} tone="win" />
              <StatTile label="Losses" value={String(stats.losses)} tone="loss" />
              <StatTile label="Best multiplier" value={formatMultiplier(stats.biggestMultiplier)} />
            </StatGrid>
          </Panel>
          <Panel title="Bet history">
            <HistoryTable rows={diceHistory} emptyLabel="No dice rounds yet." />
          </Panel>
        </div>
      }
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
  optional,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted">{label}</label>
      <input
        type="number"
        min={0}
        step="0.01"
        disabled={disabled}
        value={value}
        placeholder={optional ? "None" : "0"}
        onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
        className="mono-tabular mt-1 w-full rounded-xl border border-surface-line bg-surface px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

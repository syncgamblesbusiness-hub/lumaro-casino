"use client";

import { useEffect, useRef, useState } from "react";
import { GameLayout } from "@/components/layout/GameLayout";
import { Panel } from "@/components/ui/Panel";
import { BetAmountInput } from "@/components/ui/BetAmountInput";
import { Toggle } from "@/components/ui/Toggle";
import { StatRow, StatGrid, StatTile } from "@/components/ui/StatRow";
import { HistoryTable } from "@/components/ui/HistoryTable";
import { FairnessStrip } from "@/components/fairness/FairnessStrip";
import { AscentStage } from "@/components/games/ascent/AscentStage";
import { useCasinoStore, selectGlobalStats } from "@/lib/store/casino";
import { useToastStore } from "@/lib/store/toast";
import { multiplierAtTime, resolveAscentRound } from "@/lib/engine/ascent";
import { DEFAULT_RTP, formatMultiplier, formatPercent } from "@/lib/engine/math";

type Phase = "waiting" | "running" | "crashed";
const WAIT_SECONDS = 5;

interface RoundHistoryItem {
  crashPoint: number;
  ts: number;
}

export default function AscentPage() {
  const adjustBalance = useCasinoStore((s) => s.adjustBalance);
  const consumeNonce = useCasinoStore((s) => s.consumeNonce);
  const recordBet = useCasinoStore((s) => s.recordBet);
  const clientSeed = useCasinoStore((s) => s.clientSeed);
  const serverSeed = useCasinoStore((s) => s.serverSeed);
  const history = useCasinoStore((s) => s.history);
  const push = useToastStore((s) => s.push);

  const ascentHistory = history.filter((h) => h.game === "ascent");
  const stats = selectGlobalStats(ascentHistory);

  const [betAmount, setBetAmount] = useState(1);
  const [autoCashoutOn, setAutoCashoutOn] = useState(false);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState(2);
  const [autoBet, setAutoBet] = useState(false);
  const [stopOnProfit, setStopOnProfit] = useState<number | "">("");
  const [stopOnLoss, setStopOnLoss] = useState<number | "">("");

  const [phase, setPhase] = useState<Phase>("waiting");
  const [countdown, setCountdown] = useState(WAIT_SECONDS);
  const [liveMultiplier, setLiveMultiplier] = useState(1);
  const [revealedCrash, setRevealedCrash] = useState<number | null>(null);
  const [pendingHash, setPendingHash] = useState("");
  const [betQueued, setBetQueued] = useState(false);
  const [activeBet, setActiveBet] = useState<{ amount: number; cashedOutAt: number | null; nonce: number } | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  const crashRef = useRef(1);
  const roundHashRef = useRef("");
  const roundNonceRef = useRef(0);
  const activeBetRef = useRef<typeof activeBet>(null);
  const betQueuedRef = useRef(false);
  const betAmountRef = useRef(betAmount);
  const autoCashoutRef = useRef({ on: autoCashoutOn, target: autoCashoutTarget });
  const autoBetRef = useRef(autoBet);
  const sessionRef = useRef({ profit: 0 });
  const stopLimitsRef = useRef({ profit: stopOnProfit, loss: stopOnLoss });
  const runningRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    activeBetRef.current = activeBet;
  }, [activeBet]);
  useEffect(() => {
    betQueuedRef.current = betQueued;
  }, [betQueued]);
  useEffect(() => {
    betAmountRef.current = betAmount;
  }, [betAmount]);
  useEffect(() => {
    autoCashoutRef.current = { on: autoCashoutOn, target: autoCashoutTarget };
  }, [autoCashoutOn, autoCashoutTarget]);
  useEffect(() => {
    autoBetRef.current = autoBet;
  }, [autoBet]);
  useEffect(() => {
    stopLimitsRef.current = { profit: stopOnProfit, loss: stopOnLoss };
  }, [stopOnProfit, stopOnLoss]);

  function settleLoss() {
    const bet = activeBetRef.current;
    if (!bet || bet.cashedOutAt !== null) return;
    recordBet({
      game: "ascent",
      betAmount: bet.amount,
      payout: 0,
      profit: -bet.amount,
      multiplier: crashRef.current,
      win: false,
      detail: `Crashed at ${crashRef.current.toFixed(2)}x`,
      nonce: bet.nonce,
      hash: roundHashRef.current,
      serverSeedUsed: serverSeed,
      clientSeedUsed: clientSeed,
      verify: { type: "ascent", rtp: DEFAULT_RTP, crashPoint: crashRef.current },
    });
    sessionRef.current.profit -= bet.amount;
  }

  function cashOut(currentMultiplier: number) {
    const bet = activeBetRef.current;
    if (!bet || bet.cashedOutAt !== null || phase !== "running") return;
    const payout = bet.amount * currentMultiplier;
    const profit = payout - bet.amount;
    adjustBalance(payout);
    recordBet({
      game: "ascent",
      betAmount: bet.amount,
      payout,
      profit,
      multiplier: currentMultiplier,
      win: true,
      detail: `Cashed out at ${currentMultiplier.toFixed(2)}x`,
      nonce: bet.nonce,
      hash: roundHashRef.current,
      serverSeedUsed: serverSeed,
      clientSeedUsed: clientSeed,
      verify: { type: "ascent", rtp: DEFAULT_RTP, crashPoint: crashRef.current },
    });
    sessionRef.current.profit += profit;
    const updated = { ...bet, cashedOutAt: currentMultiplier };
    activeBetRef.current = updated;
    setActiveBet(updated);
    push({ kind: "success", title: "Cashed out", description: `${formatMultiplier(currentMultiplier)} · +$${profit.toFixed(2)}` });
  }

  function placeBet() {
    const amount = betAmountRef.current;
    if (amount <= 0 || amount > useCasinoStore.getState().balance) {
      push({ kind: "error", title: "Invalid bet", description: "Bet amount exceeds your balance." });
      return;
    }
    const nonce = consumeNonce();
    adjustBalance(-amount);
    const bet = { amount, cashedOutAt: null, nonce };
    activeBetRef.current = bet;
    setActiveBet(bet);
    setBetQueued(false);
  }

  // Main round loop
  useEffect(() => {
    runningRef.current = true;

    async function prepareRound() {
      const nonce = consumeNonce();
      const { crashPoint, hash } = await resolveAscentRound({ serverSeed, clientSeed, nonce }, DEFAULT_RTP);
      crashRef.current = crashPoint;
      roundHashRef.current = hash;
      roundNonceRef.current = nonce;
      setPendingHash(hash);
    }

    async function loop() {
      await prepareRound();

      while (runningRef.current) {
        // Waiting phase
        setPhase("waiting");
        setRevealedCrash(null);
        activeBetRef.current = null;
        setActiveBet(null);
        setLiveMultiplier(1);

        for (let t = WAIT_SECONDS; t > 0; t--) {
          setCountdown(t);
          if (!runningRef.current) return;
          if (t === WAIT_SECONDS && (betQueuedRef.current || autoBetRef.current)) {
            placeBet();
          }
          await wait(1000);
        }

        // Running phase
        setPhase("running");
        const start = performance.now();
        await new Promise<void>((resolve) => {
          function frame(now: number) {
            const elapsed = now - start;
            const m = Math.min(multiplierAtTime(elapsed), crashRef.current);
            setLiveMultiplier(m);

            const { on, target } = autoCashoutRef.current;
            if (on && activeBetRef.current && activeBetRef.current.cashedOutAt === null && m >= target) {
              cashOut(target);
            }

            if (m >= crashRef.current - 0.0001) {
              resolve();
              return;
            }
            rafRef.current = requestAnimationFrame(frame);
          }
          rafRef.current = requestAnimationFrame(frame);
        });

        // Crash
        setPhase("crashed");
        setRevealedCrash(crashRef.current);
        setRoundHistory((h) => [{ crashPoint: crashRef.current, ts: Date.now() }, ...h].slice(0, 30));
        settleLoss();

        // Auto-bet stop conditions
        const { profit, loss } = stopLimitsRef.current;
        if (autoBetRef.current) {
          if (profit !== "" && sessionRef.current.profit >= Number(profit)) {
            autoBetRef.current = false;
            setAutoBet(false);
            push({ kind: "success", title: "Stop on profit reached" });
          } else if (loss !== "" && sessionRef.current.profit <= -Number(loss)) {
            autoBetRef.current = false;
            setAutoBet(false);
            push({ kind: "error", title: "Stop on loss reached" });
          }
        }

        await wait(2200);
        await prepareRound();
      }
    }

    loop();

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSeed, clientSeed]);

  const houseEdge = 1 - DEFAULT_RTP;
  const canBet = phase === "waiting" && !activeBet;
  const canCashOut = phase === "running" && activeBet && activeBet.cashedOutAt === null;

  return (
    <GameLayout
      title="Ascent"
      subtitle="A live-rounds climber: the crash point is fixed by SHA-256 before the round starts and only revealed once it ends. Cash out before it does."
      controls={
        <div className="space-y-4">
          <Panel>
            <BetAmountInput value={betAmount} onChange={setBetAmount} disabled={!!activeBet} />

            <div className="mt-4">
              <Toggle checked={autoCashoutOn} onChange={setAutoCashoutOn} label="Auto cash-out" />
              {autoCashoutOn && (
                <input
                  type="number"
                  min={1.01}
                  step={0.01}
                  value={autoCashoutTarget}
                  onChange={(e) => setAutoCashoutTarget(parseFloat(e.target.value) || 1.01)}
                  className="mono-tabular mt-2 w-full rounded-xl border border-surface-line bg-surface-raised px-3 py-2 text-sm outline-none"
                  aria-label="Auto cash-out multiplier"
                />
              )}
            </div>

            <div className="mt-3">
              <Toggle checked={autoBet} onChange={setAutoBet} label="Auto-bet every round" />
            </div>

            {autoBet && (
              <div className="mt-3 space-y-2 rounded-xl border border-surface-line bg-surface-raised/50 p-3">
                <NumberField label="Stop on profit ($)" value={stopOnProfit} onChange={setStopOnProfit} />
                <NumberField label="Stop on loss ($)" value={stopOnLoss} onChange={setStopOnLoss} />
              </div>
            )}

            {!autoBet && (
              <>
                {canCashOut ? (
                  <button
                    onClick={() => cashOut(liveMultiplier)}
                    className="mt-4 w-full rounded-xl bg-win py-3 text-sm font-bold text-void transition hover:opacity-90"
                  >
                    Cash out {formatMultiplier(liveMultiplier)}
                  </button>
                ) : (
                  <button
                    onClick={() => (canBet ? placeBet() : setBetQueued(true))}
                    disabled={!!activeBet || phase === "crashed"}
                    className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-bold text-white transition hover:bg-violet-soft disabled:opacity-50"
                  >
                    {phase === "waiting" ? "Place bet" : betQueued ? "Bet queued for next round" : "Bet next round"}
                  </button>
                )}
              </>
            )}
          </Panel>

          <Panel title="Round info">
            <StatRow label="RTP" value={formatPercent(DEFAULT_RTP)} />
            <StatRow label="House edge" value={formatPercent(houseEdge)} />
            <StatRow label="Round hash (commit)" value={`${pendingHash.slice(0, 12)}…`} />
          </Panel>

          <FairnessStrip />
        </div>
      }
      stage={
        <div className="flex min-h-[420px] flex-col gap-4">
          <AscentStage
            phase={phase}
            multiplier={liveMultiplier}
            countdown={countdown}
            crashed={revealedCrash}
            cashedOutAt={activeBet?.cashedOutAt ?? null}
          />
          <Panel title="Round history" className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {roundHistory.map((r, i) => (
                <span
                  key={r.ts}
                  className={`mono-tabular rounded-lg border px-2 py-1 text-xs font-semibold ${
                    r.crashPoint >= 2
                      ? "border-win/30 bg-win/10 text-win"
                      : "border-loss/30 bg-loss/10 text-loss"
                  }`}
                >
                  {formatMultiplier(r.crashPoint)}
                </span>
              ))}
              {roundHistory.length === 0 && (
                <span className="text-xs text-text-faint">Rounds will appear here as they finish.</span>
              )}
            </div>
          </Panel>
        </div>
      }
      below={
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Session stats">
            <StatGrid>
              <StatTile label="Rounds played" value={String(stats.totalBets)} />
              <StatTile label="Wagered" value={`${stats.wagered.toFixed(2)}`} />
              <StatTile
                label="Net profit"
                value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}`}
                tone={stats.profit >= 0 ? "win" : "loss"}
              />
              <StatTile label="Wins" value={String(stats.wins)} tone="win" />
              <StatTile label="Losses" value={String(stats.losses)} tone="loss" />
              <StatTile label="Best cash-out" value={formatMultiplier(stats.biggestMultiplier)} />
            </StatGrid>
          </Panel>
          <Panel title="Bet history">
            <HistoryTable rows={ascentHistory} emptyLabel="No rounds played yet." />
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
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted">{label}</label>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        placeholder="None"
        onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
        className="mono-tabular mt-1 w-full rounded-xl border border-surface-line bg-surface px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

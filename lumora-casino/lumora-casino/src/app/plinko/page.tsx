"use client";

import { useMemo, useRef, useState } from "react";
import { GameLayout } from "@/components/layout/GameLayout";
import { Panel } from "@/components/ui/Panel";
import { BetAmountInput } from "@/components/ui/BetAmountInput";
import { Toggle } from "@/components/ui/Toggle";
import { StatRow, StatGrid, StatTile } from "@/components/ui/StatRow";
import { ResultChip } from "@/components/ui/ResultChip";
import { HistoryTable } from "@/components/ui/HistoryTable";
import { FairnessStrip } from "@/components/fairness/FairnessStrip";
import { PlinkoBoard, ActiveBall } from "@/components/games/plinko/PlinkoBoard";
import { useCasinoStore, selectGlobalStats } from "@/lib/store/casino";
import { useToastStore } from "@/lib/store/toast";
import { MAX_ROWS, MIN_ROWS, PlinkoRisk, buildPlinkoTable, dropPlinkoBall } from "@/lib/engine/plinko";
import { formatMultiplier, formatPercent } from "@/lib/engine/math";

const RISK_LEVELS: PlinkoRisk[] = ["low", "medium", "high"];

export default function PlinkoPage() {
  const balance = useCasinoStore((s) => s.balance);
  const adjustBalance = useCasinoStore((s) => s.adjustBalance);
  const consumeNonce = useCasinoStore((s) => s.consumeNonce);
  const recordBet = useCasinoStore((s) => s.recordBet);
  const clientSeed = useCasinoStore((s) => s.clientSeed);
  const serverSeed = useCasinoStore((s) => s.serverSeed);
  const history = useCasinoStore((s) => s.history);
  const push = useToastStore((s) => s.push);

  const plinkoHistory = history.filter((h) => h.game === "plinko");
  const stats = selectGlobalStats(plinkoHistory);

  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<PlinkoRisk>("medium");
  const [betAmount, setBetAmount] = useState(1);
  const [ballCount, setBallCount] = useState(1);
  const [turbo, setTurbo] = useState(false);

  const [autoOpen, setAutoOpen] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [stopOnProfit, setStopOnProfit] = useState<number | "">("");
  const [stopOnLoss, setStopOnLoss] = useState<number | "">("");
  const stopRef = useRef(false);

  const [activeBalls, setActiveBalls] = useState<ActiveBall[]>([]);
  const [lastLanded, setLastLanded] = useState<Record<number, number>>({});
  const busyRef = useRef(false);

  const table = useMemo(() => buildPlinkoTable(rows, risk), [rows, risk]);

  async function dropOneBall(amount: number) {
    if (amount <= 0 || amount > useCasinoStore.getState().balance) {
      push({ kind: "error", title: "Invalid bet", description: "Bet amount exceeds your balance." });
      return { profit: 0 };
    }
    const nonce = consumeNonce();
    adjustBalance(-amount);
    const result = await dropPlinkoBall(
      { serverSeed, clientSeed, nonce },
      rows,
      table.multipliers
    );
    const payout = amount * result.multiplier;
    const profit = payout - amount;
    if (payout > 0) adjustBalance(payout);

    recordBet({
      game: "plinko",
      betAmount: amount,
      payout,
      profit,
      multiplier: result.multiplier,
      win: result.multiplier > 1,
      detail: `${rows} rows · ${risk} risk · bucket ${result.bucket}`,
      nonce,
      hash: result.hashes[0],
      serverSeedUsed: serverSeed,
      clientSeedUsed: clientSeed,
      verify: { type: "plinko", rows, bucket: result.bucket, path: result.path },
    });

    const id = `${nonce}-${Math.random().toString(36).slice(2, 6)}`;
    setActiveBalls((b) => [...b, { id, path: result.path, bucket: result.bucket }]);
    return { profit };
  }

  function handleBallDone(id: string, bucket: number) {
    setActiveBalls((b) => b.filter((x) => x.id !== id));
    setLastLanded((m) => ({ ...m, [bucket]: Date.now() }));
  }

  async function handleDropBalls() {
    if (busyRef.current || autoRunning) return;
    busyRef.current = true;
    const n = Math.max(1, Math.min(100, Math.round(ballCount)));
    for (let i = 0; i < n; i++) {
      if (betAmount > useCasinoStore.getState().balance) {
        push({ kind: "error", title: "Stopped", description: "Insufficient balance to continue." });
        break;
      }
      await dropOneBall(betAmount);
      await wait(turbo ? 45 : 160);
    }
    busyRef.current = false;
  }

  async function startAutoBet() {
    if (autoRunning) return;
    stopRef.current = false;
    setAutoRunning(true);
    let sessionProfit = 0;
    let count = 0;
    push({ kind: "info", title: "Auto-bet started" });
    while (!stopRef.current) {
      if (betAmount > useCasinoStore.getState().balance) {
        push({ kind: "error", title: "Auto-bet stopped", description: "Insufficient balance." });
        break;
      }
      const { profit } = await dropOneBall(betAmount);
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
      await wait(turbo ? 70 : 220);
    }
    setAutoRunning(false);
  }

  function stopAutoBet() {
    stopRef.current = true;
    setAutoRunning(false);
  }

  return (
    <GameLayout
      title="Plinko"
      subtitle="Drop balls through a pin field with binomially fair physics. Rows and risk shape the payout curve — the math always resolves to the shown RTP."
      controls={
        <div className="space-y-4">
          <Panel>
            <BetAmountInput value={betAmount} onChange={setBetAmount} disabled={autoRunning} />

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                <label htmlFor="rows">Rows</label>
                <span className="mono-tabular text-text-primary">{rows}</span>
              </div>
              <input
                id="rows"
                type="range"
                min={MIN_ROWS}
                max={MAX_ROWS}
                step={1}
                value={rows}
                disabled={autoRunning}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="mt-2 w-full accent-violet"
              />
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-text-muted">Risk</p>
              <div className="grid grid-cols-3 gap-1.5">
                {RISK_LEVELS.map((r) => (
                  <button
                    key={r}
                    disabled={autoRunning}
                    onClick={() => setRisk(r)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition ${
                      risk === r
                        ? "border-violet/50 bg-violet/15 text-text-primary"
                        : "border-surface-line text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="ballCount" className="text-xs font-medium text-text-muted">
                Balls per drop
              </label>
              <input
                id="ballCount"
                type="number"
                min={1}
                max={100}
                value={ballCount}
                disabled={autoRunning}
                onChange={(e) => setBallCount(parseInt(e.target.value) || 1)}
                className="mono-tabular mt-1 w-full rounded-xl border border-surface-line bg-surface-raised px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-[11px] text-text-faint">Drops sequentially, up to 100 at once.</p>
            </div>

            <div className="mt-4">
              <Toggle checked={turbo} onChange={setTurbo} label="Turbo mode" />
            </div>
            <div className="mt-3">
              <Toggle checked={autoOpen} onChange={setAutoOpen} label="Auto-bet" />
            </div>

            {autoOpen && (
              <div className="mt-3 space-y-2 rounded-xl border border-surface-line bg-surface-raised/50 p-3">
                <NumberField label="Stop on profit ($)" value={stopOnProfit} onChange={setStopOnProfit} disabled={autoRunning} />
                <NumberField label="Stop on loss ($)" value={stopOnLoss} onChange={setStopOnLoss} disabled={autoRunning} />
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
                onClick={handleDropBalls}
                className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-bold text-white transition hover:bg-violet-soft disabled:opacity-50"
              >
                Drop {ballCount > 1 ? `${ballCount} balls` : "ball"}
              </button>
            )}
          </Panel>

          <Panel title="Table info">
            <StatRow label="Buckets" value={String(table.buckets)} />
            <StatRow label="RTP" value={formatPercent(table.actualRtp)} />
            <StatRow label="House edge" value={formatPercent(table.houseEdge)} />
            <StatRow label="Max multiplier" value={formatMultiplier(Math.max(...table.multipliers))} />
          </Panel>

          <FairnessStrip />
        </div>
      }
      stage={
        <div className="flex min-h-[420px] flex-col justify-between rounded-2xl border border-surface-line bg-surface/70 p-6">
          <div className="relative flex-1">
            <div className="aurora-field opacity-30" />
            <div className="relative z-10">
              <PlinkoBoard
                rows={rows}
                multipliers={table.multipliers}
                balls={activeBalls}
                turbo={turbo}
                lastLanded={lastLanded}
                onBallDone={handleBallDone}
              />
            </div>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-1.5 border-t border-surface-line pt-4">
            <span className="mr-1 text-xs text-text-muted">Recent drops</span>
            {plinkoHistory.slice(0, 16).map((h) => (
              <ResultChip key={h.id} multiplier={h.multiplier} win={h.win} />
            ))}
            {plinkoHistory.length === 0 && (
              <span className="text-xs text-text-faint">Drop a ball to see results here.</span>
            )}
          </div>
        </div>
      }
      below={
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Session stats">
            <StatGrid>
              <StatTile label="Balls dropped" value={String(stats.totalBets)} />
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
          <Panel title="Drop history">
            <HistoryTable rows={plinkoHistory} emptyLabel="No drops yet." />
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
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  disabled?: boolean;
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

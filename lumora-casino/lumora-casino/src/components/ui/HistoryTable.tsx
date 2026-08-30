"use client";

import { useState } from "react";
import { BetRecord } from "@/lib/store/casino";
import { formatMultiplier } from "@/lib/engine/math";
import { VerifyModal } from "@/components/fairness/VerifyModal";

export function HistoryTable({ rows, emptyLabel = "No bets yet." }: { rows: BetRecord[]; emptyLabel?: string }) {
  const [verifying, setVerifying] = useState<BetRecord | null>(null);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-surface text-text-muted">
            <tr>
              <th className="py-2 pr-2 font-medium">Time</th>
              <th className="py-2 pr-2 font-medium">Bet</th>
              <th className="py-2 pr-2 font-medium">Multiplier</th>
              <th className="py-2 pr-2 font-medium">Payout</th>
              <th className="py-2 pr-2 font-medium">Profit</th>
              <th className="py-2 font-medium sr-only">Verify</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-surface-line/60">
                <td className="mono-tabular py-2 pr-2 text-text-muted">
                  {new Date(r.time).toLocaleTimeString()}
                </td>
                <td className="mono-tabular py-2 pr-2">{r.betAmount.toFixed(2)}</td>
                <td className={`mono-tabular py-2 pr-2 ${r.win ? "text-win" : "text-loss"}`}>
                  {formatMultiplier(r.multiplier)}
                </td>
                <td className="mono-tabular py-2 pr-2">{r.payout.toFixed(2)}</td>
                <td className={`mono-tabular py-2 pr-2 ${r.profit >= 0 ? "text-win" : "text-loss"}`}>
                  {r.profit >= 0 ? "+" : ""}
                  {r.profit.toFixed(2)}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setVerifying(r)}
                    className="rounded-full border border-surface-line px-2 py-1 text-[11px] text-text-muted transition hover:border-cyan/50 hover:text-cyan"
                  >
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {verifying && <VerifyModal record={verifying} onClose={() => setVerifying(null)} />}
    </>
  );
}

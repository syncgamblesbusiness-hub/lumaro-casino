"use client";

import { useState } from "react";
import { useCasinoStore } from "@/lib/store/casino";
import { formatCredits } from "@/lib/engine/math";
import { useToastStore } from "@/lib/store/toast";

export function Topbar() {
  const balance = useCasinoStore((s) => s.balance);
  const currency = useCasinoStore((s) => s.currency);
  const resetBalance = useCasinoStore((s) => s.resetBalance);
  const push = useToastStore((s) => s.push);
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-surface-line bg-surface/80 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-gradient-aurora font-display text-lg font-bold">LUMORA</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-full border border-surface-line bg-surface-raised px-4 py-2"
          aria-label="Demo wallet balance"
        >
          <span className="h-2 w-2 rounded-full bg-win" aria-hidden />
          <span className="mono-tabular text-sm font-semibold text-text-primary">
            {formatCredits(balance)}
          </span>
          <span className="text-xs font-medium text-text-muted">{currency}</span>
        </div>

        {confirming ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                resetBalance();
                setConfirming(false);
                push({ kind: "success", title: "Balance restored", description: "1,000.00 FUN credited to your demo wallet." });
              }}
              className="rounded-full bg-violet px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-soft"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full border border-surface-line px-3 py-2 text-xs text-text-muted transition hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-full border border-surface-line px-3 py-2 text-xs font-medium text-text-muted transition hover:border-violet/50 hover:text-text-primary"
          >
            Reset balance
          </button>
        )}
      </div>
    </header>
  );
}

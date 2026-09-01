"use client";

import { useCasinoStore } from "@/lib/store/casino";
import { clamp } from "@/lib/engine/math";

const QUICK_BETS = [1, 5, 10, 25, 100];

export function BetAmountInput({
  value,
  onChange,
  disabled,
  id = "bet-amount",
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  const balance = useCasinoStore((s) => s.balance);

  const set = (v: number) => onChange(Math.round(clamp(v, 0.01, Math.max(0.01, balance)) * 100) / 100);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-text-muted">
          Bet amount
        </label>
        <span className="text-[11px] text-text-faint">Balance ${balance.toFixed(2)}</span>
      </div>
      <div className="mt-1.5 flex items-stretch gap-1.5">
        <div className="flex flex-1 items-center rounded-xl border border-surface-line bg-surface-raised px-3">
          <span className="mr-1 text-text-faint">$</span>
          <input
            id={id}
            type="number"
            min={0.01}
            max={balance}
            step={0.01}
            inputMode="decimal"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={(e) => set(parseFloat(e.target.value) || 0.01)}
            className="mono-tabular w-full bg-transparent py-2.5 text-sm font-semibold text-text-primary outline-none disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => set(value / 2)}
          className="rounded-xl border border-surface-line px-3 text-xs font-semibold text-text-muted transition hover:text-text-primary disabled:opacity-40"
        >
          ½
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => set(value * 2)}
          className="rounded-xl border border-surface-line px-3 text-xs font-semibold text-text-muted transition hover:text-text-primary disabled:opacity-40"
        >
          2×
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => set(balance)}
          className="rounded-xl border border-surface-line px-3 text-xs font-semibold text-text-muted transition hover:text-text-primary disabled:opacity-40"
        >
          Max
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_BETS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => set(q)}
            className="rounded-full border border-surface-line px-2.5 py-1 text-[11px] text-text-muted transition hover:border-violet/50 hover:text-text-primary disabled:opacity-40"
          >
            ${q}
          </button>
        ))}
      </div>
    </div>
  );
}

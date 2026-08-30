import { formatMultiplier } from "@/lib/engine/math";

export function ResultChip({ multiplier, win }: { multiplier: number; win: boolean }) {
  return (
    <span
      className={`mono-tabular inline-flex shrink-0 items-center rounded-lg border px-2 py-1 text-xs font-semibold ${
        win ? "border-win/30 bg-win/10 text-win" : "border-loss/30 bg-loss/10 text-loss"
      }`}
    >
      {formatMultiplier(multiplier)}
    </span>
  );
}

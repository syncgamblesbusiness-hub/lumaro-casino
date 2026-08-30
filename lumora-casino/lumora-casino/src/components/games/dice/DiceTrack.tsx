"use client";

import { motion } from "framer-motion";
import { RollDirection } from "@/lib/engine/dice";

export function DiceTrack({
  target,
  direction,
  roll,
  rolling,
  turbo,
}: {
  target: number;
  direction: RollDirection;
  roll: number | null;
  rolling: boolean;
  turbo: boolean;
}) {
  const markerPos = roll !== null ? clampPct(roll) : clampPct(target);

  return (
    <div className="w-full select-none">
      <div className="relative h-4 w-full overflow-visible rounded-full">
        <div className="flex h-full w-full overflow-hidden rounded-full">
          <div
            className={direction === "under" ? "bg-win/70" : "bg-loss/70"}
            style={{ width: `${clampPct(target)}%` }}
          />
          <div
            className={direction === "under" ? "bg-loss/70" : "bg-win/70"}
            style={{ width: `${100 - clampPct(target)}%` }}
          />
        </div>

        <motion.div
          className="absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-void shadow-lg"
          initial={false}
          animate={{ left: `calc(${markerPos}% - 14px)` }}
          transition={{ duration: turbo ? 0.08 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] font-bold text-cyan">▲</span>
        </motion.div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div
          className={`mono-tabular rounded-2xl border px-8 py-4 text-4xl font-bold transition-colors ${
            roll === null
              ? "border-surface-line text-text-muted"
              : rolling
                ? "border-surface-line text-text-primary"
                : (direction === "under" ? roll < target : roll > target)
                  ? "border-win/40 bg-win/10 text-win"
                  : "border-loss/40 bg-loss/10 text-loss"
          }`}
        >
          {roll === null ? "00.00" : roll.toFixed(2)}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-text-faint">
        <span>0.00</span>
        <span>50.00</span>
        <span>99.99</span>
      </div>
    </div>
  );
}

function clampPct(v: number) {
  return Math.min(100, Math.max(0, v));
}

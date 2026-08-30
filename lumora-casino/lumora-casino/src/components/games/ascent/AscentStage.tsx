"use client";

import { motion } from "framer-motion";

export function AscentStage({
  phase,
  multiplier,
  countdown,
  crashed,
  cashedOutAt,
}: {
  phase: "waiting" | "running" | "crashed";
  multiplier: number;
  countdown: number;
  crashed: number | null;
  cashedOutAt: number | null;
}) {
  const progress = Math.min(1, Math.log(multiplier) / Math.log(20));

  return (
    <div className="relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border border-surface-line bg-void/40">
      <div className="aurora-field" style={{ opacity: phase === "running" ? 0.5 : 0.2 }} />

      {/* rising trail */}
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
        <motion.path
          d={`M 20 180 Q ${20 + progress * 180} ${180 - progress * 60} ${20 + progress * 360} ${180 - progress * 150}`}
          fill="none"
          stroke={phase === "crashed" ? "var(--loss)" : "var(--cyan)"}
          strokeWidth={3}
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: phase === "waiting" ? 0.15 : 0.8 }}
        />
      </svg>

      <div className="relative z-10 text-center">
        {phase === "waiting" && (
          <>
            <p className="text-xs uppercase tracking-widest text-text-muted">Next round in</p>
            <p className="font-display text-5xl font-bold text-text-primary">{countdown}s</p>
            <p className="mt-1 text-xs text-text-faint">Place your bet before liftoff</p>
          </>
        )}
        {phase === "running" && (
          <>
            <p className="mono-tabular font-display text-6xl font-bold text-cyan drop-shadow-[0_0_20px_rgba(41,211,199,0.5)]">
              {multiplier.toFixed(2)}x
            </p>
            {cashedOutAt && (
              <p className="mt-2 text-sm font-semibold text-win">Cashed out at {cashedOutAt.toFixed(2)}x</p>
            )}
          </>
        )}
        {phase === "crashed" && (
          <>
            <p className="text-xs uppercase tracking-widest text-loss">Crashed</p>
            <p className="mono-tabular font-display text-6xl font-bold text-loss">
              {crashed?.toFixed(2)}x
            </p>
            {cashedOutAt ? (
              <p className="mt-2 text-sm font-semibold text-win">You cashed out at {cashedOutAt.toFixed(2)}x</p>
            ) : (
              <p className="mt-2 text-sm text-text-muted">Next round starting shortly…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

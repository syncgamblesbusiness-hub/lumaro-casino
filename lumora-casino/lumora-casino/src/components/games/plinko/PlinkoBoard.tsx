"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMultiplier } from "@/lib/engine/math";

export interface ActiveBall {
  id: string;
  path: (0 | 1)[];
  bucket: number;
}

const WIDTH = 640;
const TOP_PAD = 28;
const BOTTOM_PAD = 26;
const SIDE_PAD = 44;

export function PlinkoBoard({
  rows,
  multipliers,
  balls,
  turbo,
  lastLanded,
  onBallDone,
}: {
  rows: number;
  multipliers: number[];
  balls: ActiveBall[];
  turbo: boolean;
  lastLanded: Record<number, number>; // bucket -> ts, for landing pulse
  onBallDone: (id: string, bucket: number) => void;
}) {
  const rowGap = 26;
  const height = TOP_PAD + rows * rowGap + BOTTOM_PAD;
  const centerX = WIDTH / 2;
  const pegGap = (WIDTH - SIDE_PAD * 2) / rows;

  const pegs = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let row = 0; row < rows; row++) {
      const count = row + 1;
      for (let k = 0; k < count; k++) {
        const x = centerX + (2 * k - row) * (pegGap / 2);
        const y = TOP_PAD + row * rowGap;
        list.push({ x, y });
      }
    }
    return list;
  }, [rows, pegGap, centerX]);

  function ballKeyframes(path: (0 | 1)[]) {
    const xs = [centerX];
    const ys = [4];
    let rightCount = 0;
    for (let row = 0; row < path.length; row++) {
      rightCount += path[row];
      const leftCount = row + 1 - rightCount;
      xs.push(centerX + (rightCount - leftCount) * (pegGap / 2));
      ys.push(TOP_PAD + row * rowGap);
    }
    xs.push(xs[xs.length - 1]);
    ys.push(height - 6);
    return { xs, ys };
  }

  const buckets = multipliers.length;
  const intensity = (i: number) => {
    const dist = Math.abs(i - (buckets - 1) / 2) / ((buckets - 1) / 2);
    return dist; // 0 centre .. 1 edge
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label="Plinko board">
        {pegs.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.4} fill="var(--surface-line)" />
        ))}

        <AnimatePresence>
          {balls.map((b) => {
            const { xs, ys } = ballKeyframes(b.path);
            const duration = turbo ? 0.5 : 1.1 + rows * 0.03;
            return (
              <motion.circle
                key={b.id}
                r={6}
                fill="url(#ballGradient)"
                initial={{ cx: xs[0], cy: ys[0], opacity: 1 }}
                animate={{ cx: xs, cy: ys, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration, ease: "easeIn", times: xs.map((_, i) => i / (xs.length - 1)) }}
                onAnimationComplete={() => onBallDone(b.id, b.bucket)}
              />
            );
          })}
        </AnimatePresence>

        <defs>
          <radialGradient id="ballGradient">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </radialGradient>
        </defs>
      </svg>

      <div className="mt-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${buckets}, minmax(0,1fr))` }}>
        {multipliers.map((m, i) => {
          const t = intensity(i);
          const bg =
            t > 0.66
              ? "bg-loss/25 border-loss/40 text-loss"
              : t > 0.33
                ? "bg-amber/20 border-amber/40 text-amber"
                : "bg-win/15 border-win/30 text-win";
          const pulsing = Date.now() - (lastLanded[i] || 0) < 500;
          return (
            <div
              key={i}
              className={`rounded-md border py-1 text-center text-[10px] font-bold transition sm:text-[11px] ${bg} ${
                pulsing ? "scale-110" : ""
              }`}
            >
              {formatMultiplier(m)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatGrid, StatTile } from "@/components/ui/StatRow";
import { useCasinoStore, selectGlobalStats } from "@/lib/store/casino";
import { formatPercent } from "@/lib/engine/math";
import { DEFAULT_RTP } from "@/lib/engine/math";

const GAMES = [
  {
    href: "/plinko",
    name: "Plinko",
    tagline: "Drop balls through a pin field. Rows and risk shape the curve.",
    glyph: "▽",
  },
  {
    href: "/dice",
    name: "Dice",
    tagline: "Set any win chance from 0.01% to 99.99% and roll.",
    glyph: "⚂",
  },
  {
    href: "/ascent",
    name: "Ascent",
    tagline: "Live rounds. Cash out before the climb ends.",
    glyph: "▲",
  },
];

export default function LobbyPage() {
  const balance = useCasinoStore((s) => s.balance);
  const history = useCasinoStore((s) => s.history);
  const stats = selectGlobalStats(history);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-surface-line bg-surface/70 p-8 md:p-12">
        <div className="aurora-field" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-line bg-surface-raised px-3 py-1 text-[11px] font-medium text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-win" /> Demo mode · play money only
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            Provably fair games,<span className="text-gradient-aurora"> zero real money.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-text-muted md:text-base">
            Lumora is a self-contained casino sandbox. Every spin, drop and round runs on
            transparent SHA-256 math you can verify yourself — and every credit is free demo
            currency that can never be deposited or withdrawn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/plinko"
              className="rounded-xl bg-violet px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-soft"
            >
              Start playing
            </Link>
            <Link
              href="/fairness"
              className="rounded-xl border border-surface-line px-5 py-3 text-sm font-semibold text-text-muted transition hover:text-text-primary"
            >
              How fairness works
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Games</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GAMES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group rounded-2xl border border-surface-line bg-surface/70 p-5 transition hover:border-violet/40 hover:bg-surface-raised/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-lg text-violet-soft">
                {g.glyph}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">{g.name}</h3>
              <p className="mt-1 text-xs text-text-muted">{g.tagline}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-cyan opacity-0 transition group-hover:opacity-100">
                Play now →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Global stats</h2>
        <Panel>
          <StatGrid>
            <StatTile label="Demo balance" value={`$${balance.toFixed(2)}`} />
            <StatTile label="Total bets" value={String(stats.totalBets)} />
            <StatTile label="Total wagered" value={stats.wagered.toFixed(2)} />
            <StatTile
              label="Net profit"
              value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}`}
              tone={stats.profit >= 0 ? "win" : "loss"}
            />
            <StatTile label="Target RTP" value={formatPercent(DEFAULT_RTP)} />
            <StatTile label="House edge" value={formatPercent(1 - DEFAULT_RTP)} />
          </StatGrid>
        </Panel>
      </section>
    </div>
  );
}

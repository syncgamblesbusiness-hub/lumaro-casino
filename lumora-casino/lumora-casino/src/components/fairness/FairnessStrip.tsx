"use client";

import Link from "next/link";
import { useCasinoStore } from "@/lib/store/casino";

export function FairnessStrip() {
  const serverSeedHash = useCasinoStore((s) => s.serverSeedHash);
  const clientSeed = useCasinoStore((s) => s.clientSeed);
  const nonce = useCasinoStore((s) => s.nonce);

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-surface-line bg-surface-raised/50 px-3 py-2.5 text-[11px] text-text-muted">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide text-text-faint">Provably fair</span>
        <Link href="/fairness" className="text-cyan hover:underline">
          Manage seeds →
        </Link>
      </div>
      <div className="mono-tabular flex items-center justify-between">
        <span>Server seed hash</span>
        <span className="truncate pl-2 text-text-primary">{serverSeedHash.slice(0, 16)}…</span>
      </div>
      <div className="mono-tabular flex items-center justify-between">
        <span>Client seed</span>
        <span className="text-text-primary">{clientSeed}</span>
      </div>
      <div className="mono-tabular flex items-center justify-between">
        <span>Nonce</span>
        <span className="text-text-primary">{nonce}</span>
      </div>
    </div>
  );
}

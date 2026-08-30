"use client";

import { useEffect, useState } from "react";
import { BetRecord } from "@/lib/store/casino";
import { verifyBetRecord, VerifyResult } from "@/lib/engine/verify";

export function VerifyModal({ record, onClose }: { record: BetRecord; onClose: () => void }) {
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    verifyBetRecord(record).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [record]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-surface-line bg-surface p-5 md:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="verify-title" className="font-display text-lg font-semibold">
            Verify result
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Field label="Game" value={record.game} />
          <Field label="Nonce" value={String(record.nonce)} />
          <Field label="Client seed" value={record.clientSeedUsed} mono />
          <Field label="Server seed (revealed)" value={record.serverSeedUsed} mono />
          <Field label="Result hash shown live" value={record.hash} mono />

          <div className="rounded-xl border border-surface-line bg-surface-raised/70 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Independent recomputation
            </p>
            {!result ? (
              <p className="text-xs text-text-muted">Recomputing…</p>
            ) : (
              <ol className="space-y-1.5">
                {result.steps.map((s, i) => (
                  <li key={i} className="mono-tabular break-all text-[11px] leading-relaxed text-text-muted">
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                result.matches
                  ? "border-win/40 bg-win/10 text-win"
                  : "border-loss/40 bg-loss/10 text-loss"
              }`}
            >
              <span aria-hidden>{result.matches ? "✓" : "✕"}</span>
              {result.matches
                ? "Recomputed result matches exactly what was shown live."
                : "Mismatch detected — result could not be reproduced."}
            </div>
          )}

          <p className="text-xs leading-relaxed text-text-muted">
            Anyone can repeat this calculation offline: hash{" "}
            <span className="mono-tabular">serverSeed:clientSeed:nonce:cursor</span> with SHA-256
            and derive the outcome the same way the game engine does. Because the server seed is
            revealed here, you don&apos;t have to trust Lumora — you can check the math yourself.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`break-all text-sm text-text-primary ${mono ? "mono-tabular" : ""}`}>{value}</p>
    </div>
  );
}

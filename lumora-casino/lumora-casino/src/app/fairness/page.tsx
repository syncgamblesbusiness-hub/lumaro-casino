"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { HistoryTable } from "@/components/ui/HistoryTable";
import { useCasinoStore } from "@/lib/store/casino";
import { useToastStore } from "@/lib/store/toast";
import { randomSeed } from "@/lib/engine/rng";

export default function FairnessPage() {
  const clientSeed = useCasinoStore((s) => s.clientSeed);
  const serverSeedHash = useCasinoStore((s) => s.serverSeedHash);
  const serverSeed = useCasinoStore((s) => s.serverSeed);
  const nonce = useCasinoStore((s) => s.nonce);
  const seedHistory = useCasinoStore((s) => s.seedHistory);
  const setClientSeed = useCasinoStore((s) => s.setClientSeed);
  const rotateServerSeed = useCasinoStore((s) => s.rotateServerSeed);
  const history = useCasinoStore((s) => s.history);
  const push = useToastStore((s) => s.push);

  const [clientSeedInput, setClientSeedInput] = useState(clientSeed);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Provably Fair</h1>
        <p className="text-sm text-text-muted">
          Every round on Lumora is generated from a server seed, a client seed, and a nonce —
          hashed together with SHA-256. Nothing is hidden from you that doesn&apos;t need to be.
        </p>
      </div>

      <Panel title="How it works">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-text-muted">
          <li>
            Before you play, Lumora generates a random <strong className="text-text-primary">server seed</strong> and
            shows you only its SHA-256 hash — a commitment it cannot change afterwards without you noticing.
          </li>
          <li>
            You control the <strong className="text-text-primary">client seed</strong> — change it any time to
            prove you aren&apos;t being targeted with a rigged sequence.
          </li>
          <li>
            Each bet increments a <strong className="text-text-primary">nonce</strong>, so the same seeds never
            produce the same result twice.
          </li>
          <li>
            The engine hashes <span className="mono-tabular">serverSeed:clientSeed:nonce</span> and turns the
            digest into the round&apos;s outcome — the exact same transform Dice, Plinko and Ascent use internally.
          </li>
          <li>
            Open any past bet&apos;s <strong className="text-text-primary">Verify</strong> button to re-run that
            hash yourself and confirm the result couldn&apos;t have been altered.
          </li>
        </ol>
      </Panel>

      <Panel title="Current seeds">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-text-muted">Active server seed hash (committed)</p>
            <p className="mono-tabular mt-1 break-all rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-sm">
              {serverSeedHash}
            </p>
          </div>

          <div>
            <label htmlFor="clientSeedField" className="text-xs font-medium text-text-muted">
              Client seed
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="clientSeedField"
                value={clientSeedInput}
                onChange={(e) => setClientSeedInput(e.target.value)}
                className="mono-tabular flex-1 rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => {
                  setClientSeed(clientSeedInput);
                  push({ kind: "success", title: "Client seed updated" });
                }}
                className="rounded-lg border border-surface-line px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary"
              >
                Save
              </button>
              <button
                onClick={() => {
                  const s = randomSeed(6);
                  setClientSeedInput(s);
                  setClientSeed(s);
                  push({ kind: "info", title: "Random client seed generated" });
                }}
                className="rounded-lg border border-surface-line px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary"
              >
                Randomize
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-surface-line bg-surface-raised/60 px-3 py-2 text-sm">
            <span className="text-text-muted">Current nonce</span>
            <span className="mono-tabular">{nonce}</span>
          </div>

          <button
            onClick={async () => {
              await rotateServerSeed();
              push({ kind: "success", title: "Server seed rotated", description: "Previous seed revealed below." });
            }}
            className="w-full rounded-xl bg-violet py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft"
          >
            Reveal &amp; rotate server seed
          </button>
          <p className="text-xs text-text-faint">
            Rotating reveals the seed you&apos;ve just been playing on (
            <span className="mono-tabular break-all">{serverSeed.slice(0, 20)}…</span>) so you can hash it yourself
            and confirm it matches the commitment above, then swaps in a brand-new hidden seed.
          </p>
        </div>
      </Panel>

      {seedHistory.length > 0 && (
        <Panel title="Revealed seed history">
          <div className="space-y-2">
            {seedHistory.map((s, i) => (
              <div key={i} className="rounded-lg border border-surface-line bg-surface-raised/50 p-3 text-xs">
                <div className="mono-tabular flex flex-wrap justify-between gap-2 text-text-muted">
                  <span>Nonces {s.nonceStart}–{s.nonceEnd}</span>
                  <span>{new Date(s.rotatedAt).toLocaleString()}</span>
                </div>
                <p className="mono-tabular mt-1 break-all text-text-primary">Seed: {s.serverSeed}</p>
                <p className="mono-tabular mt-1 break-all text-text-muted">Hash: {s.serverSeedHash}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="All bet history">
        <HistoryTable rows={history} emptyLabel="No bets placed yet across any game." />
      </Panel>
    </div>
  );
}

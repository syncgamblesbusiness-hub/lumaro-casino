# Lumora — Demo Casino (play-money only)

A self-contained, professional-looking casino web app built with **Next.js (App Router)**,
**TypeScript** and **Tailwind CSS**. Every credit is free demo currency ("FUN"). There is
**no real money anywhere in this project** — no payment integration, no deposits, no
withdrawals, and no code path that could accept one.

Branding, color system, typography and all UI components are original to this project.
Nothing is copied from Stake or any other operator.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

> Fonts (Space Grotesk / Inter / JetBrains Mono) are loaded via a Google Fonts `<link>` tag
> in `src/app/layout.tsx`, so an internet connection is used at *runtime* to fetch them —
> the build itself has no network dependency. Swap in `next/font/local` with your own font
> files if you need a fully offline build.

## Project structure

```
src/
  lib/
    engine/          # Pure game math + provably-fair RNG. No React, no UI imports.
      rng.ts          SHA-256 based fairness primitives (server/client seed + nonce)
      math.ts         Central RTP / House Edge / multiplier / EV formulas
      dice.ts         Dice chance <-> multiplier <-> RTP math + roll resolution
      plinko.ts       Multiplier table generation (rows/risk) + ball-path simulation
      ascent.ts       Crash-point distribution math (commit-then-reveal)
      verify.ts       Independent recomputation of a past bet ("Verify Result")
    store/
      casino.ts       Zustand store: demo wallet, bet history, seed state
      toast.ts        Toast notification store
  components/
    layout/           Sidebar, Topbar, mobile nav, shared two-column game layout
    ui/               Panel, bet input, toggle, stat tiles, history table, toasts
    fairness/         Fairness strip, bootstrap, verify modal
    games/            Per-game presentational pieces (Plinko board, dice track, ascent stage)
  app/
    page.tsx          Lobby
    plinko/page.tsx
    dice/page.tsx
    ascent/page.tsx
    fairness/page.tsx
```

The `lib/engine` folder has zero UI dependencies by design — every number shown anywhere
in the app (RTP, House Edge, multiplier, potential payout, expected value) is derived from
these functions, never hardcoded in a component.

## Math you can check

- `houseEdge = 1 - RTP` everywhere (`src/lib/engine/math.ts`)
- Dice: `multiplier = RTP / winProbability`, so `EV = bet * (RTP - 1) = -bet * houseEdge`
  for every chance from 0.01% to 99.99%.
- Plinko: multiplier tables are generated from real binomial bucket probabilities and then
  uniformly scaled so the **actual, displayed** RTP (not just a target) matches the table —
  what you see in "Table info" is computed from the exact numbers used to pay you out.
- Ascent: the crash-point distribution `P(crash >= m) = RTP / m` is the classic
  house-edge-preserving curve — cashing out at any target multiplier has the same expected
  value, `bet * RTP`.

## Provably fair system

Each round is derived from `SHA256(serverSeed:clientSeed:nonce:cursor)`:

1. A server seed is generated on load; only its hash is shown (`/fairness`).
2. You can set your own client seed at any time.
3. Every bet increments a nonce, so no two rounds share an outcome.
4. Rotating your server seed reveals the seed you were just playing on, so you can hash it
   yourself and confirm it matches the previously-shown commitment.
5. Every row in every bet history table has a **Verify** button that independently
   re-derives that specific result from its stored seeds and nonce and shows every step —
   see `src/lib/engine/verify.ts`.

`Ascent` additionally pre-computes and hashes the *next* round's crash point before betting
opens, and only reveals the actual crash point once the round ends — a real commit/reveal
scheme, not just a label.

## Notes / suggested next steps

- This is a front-end-only demo: all state (balance, history, seeds) lives in memory and
  resets on page reload. Swap `src/lib/store/casino.ts` for a real backend if you want
  persistence — the engine layer is already backend-agnostic.
- No real-money rails exist anywhere in this codebase. If you ever intend to operate this
  as a real-money gambling product, that requires a gambling license in your jurisdiction(s)
  and is out of scope for this project.

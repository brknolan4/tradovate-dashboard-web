# Tradovate TradeDash

Tradovate TradeDash is a local-first trading performance dashboard for reviewing prop-firm accounts, importing Tradovate CSV exports, and monitoring sync health from one workspace.

## What it does

- Dashboard for account balance, P&L, streaks, win rate, drawdown, and consistency rules
- Imports Tradovate report bundles (`Fills.csv`, `Performance.csv`, optional `Cash.csv`)
- Supports single-file imports for fills, balance history, cash reports, and TopstepX data
- Tracks account mappings so one account does not fragment into multiple labels
- Includes a Tradovate sync sidecar for browser-assisted report downloads

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Playwright (sync sidecar)

## Main app

From the repo root:

```bash
npm install
npm run dev
```

Default Vite URL:
- http://127.0.0.1:5173

Useful scripts:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run sync-helper
```

## Main app structure

- `src/App.tsx` — top-level view switching
- `src/context/DataContext.tsx` — account state, imports, mappings, merge logic, rules
- `src/context/SyncContext.tsx` — sync status polling and trigger flow
- `src/components/Dashboard.tsx` — main performance dashboard
- `src/components/DataManager.tsx` — imports, bundle handling, account cleanup tools
- `src/services/syncService.ts` — helper/sidecar sync integration

## Tradovate sync sidecar

The sidecar is a separate local automation package under `sync-sidecar/`. It uses a dedicated persistent browser profile and Playwright to help download Tradovate reports.

Setup:

```bash
cd sync-sidecar
npm install
cp ../.env.sync.example .env.sync.local
```

Key commands:

```bash
npm run status
npm run plan
npm run sync
npm run sync:bootstrap
```

See:
- `sync-sidecar/README.md`
- `docs/tradovate-sync-foundation.md`
- `.env.sync.example`

## Sync helper

There is also a lightweight helper server under `sync-helper/`.

Run it with:

```bash
npm run sync-helper
```

Default helper base URL expected by the dashboard:
- `http://127.0.0.1:43128`

## Notes

- App state is currently persisted in `localStorage`
- Sample CSV files are included under `public/` for local testing
- This repo is intended for local/private use; do not commit real Tradovate credentials

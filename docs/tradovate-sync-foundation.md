# Tradovate Sync Foundation

## What this scaffold now does
- Adds a local `sync-sidecar/` folder for future browser-driven downloads/imports.
- Treats the sidecar's **own dedicated persistent browser profile** as the primary Tradovate session source.
- Keeps env credentials as fallback login assistance rather than the main session-sharing mechanism.
- Documents local-only env keys in `.env.sync.example`.
- Adds app-side `Sync Now` and sync status plumbing without pretending the full automation is already complete.
- Encodes the user-confirmed Tradovate manual flow:
  - **Reports** is the source section
  - **Fills** exports to `fills.csv`
  - **Performance** exports to `performance.csv`
  - export button text is **Download CSV**
  - date preset should be **This Year** via the dropdown under the date field
- Preserves the design assumption that one Tradovate login can contain multiple actual trading accounts, which should remain separate in-app.

## Conservative design choices
- No credentials are embedded in repo code.
- Secret values are redacted in sidecar status output.
- The sidecar should stop depending on Brendan's normal Chromium profile and instead maintain its own durable Tradovate profile state.
- The current app-side sync trigger still records intent/status locally rather than claiming live sidecar connectivity.
- CSV import remains explicit and aligned to the existing parser/context flow.
- Separate-account imports are preserved as a first-class workflow, especially for PA Apex accounts.

## What is now real
1. A real Playwright-based persistent-browser sidecar exists.
2. The sidecar now attempts Reports-based navigation rather than only placeholder direct URLs.
3. The sidecar now attempts the confirmed `This Year` date preset before downloading.
4. The sidecar now records richer authenticated/unathenticated state for its own profile so reuse is easier to inspect.
5. Downloads are staged with stable, import-friendly names:
   - `fills.csv`
   - `performance.csv`
   - `account-balance-history.csv`
6. The dashboard is more import-aware and more explicit about readiness/completeness per account.

## What still remains unverified
1. Exact live selectors for the Reports screen, date dropdown, and `Download CSV` button may still need local tuning.
2. A fully verified end-to-end automated download from a live authenticated Tradovate sidecar profile has not been confirmed here.
3. There is not yet a live automatic handoff from sidecar staging into the React app without a manual import step.

## Suggested handoff contract
- `fills.csv` -> `importFills()`
- `performance.csv` -> `importData()`
- `account-balance-history.csv` -> `importData()` for balance/daily net history supplement

## Clean dedicated-profile-first path
1. Bootstrap the dedicated profile with `cd sync-sidecar && npm run sync:bootstrap`.
2. Log into Tradovate in the browser launched for that sidecar profile.
3. Let the sidecar verify/write `runtime/dedicated-browser-profile/session-state.json`.
4. Run `npm run sync`.
5. If downloads fail after auth is verified, focus next on selector tuning rather than session reuse.

## Clean manual-assisted fallback
If the browser sidecar still misses live selectors, the next honest/manual path is:
1. Download **Fills** using **Reports -> Fills -> This Year -> Download CSV**.
2. Download **Performance** using **Reports -> Performance -> This Year -> Download CSV**.
3. Import each pair into the intended in-app account name.
4. Repeat per Tradovate account so PA accounts remain separate in the dashboard.

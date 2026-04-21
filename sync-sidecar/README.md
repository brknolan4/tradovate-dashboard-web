# Tradovate Sync Sidecar

Local-only browser automation scaffold for downloading the key Tradovate CSV reports from the **Reports** section.

## Dedicated-profile-first strategy
This sidecar should use **its own persistent browser profile** and stop trying to piggyback on Brendan's normal Chromium session.

Default persistent profile path:
- `sync-sidecar/runtime/dedicated-browser-profile`

Why this is now the default strategy:
- avoids Chromium singleton/lock conflicts with a normal daily browser session
- makes Tradovate login/session reuse deterministic for the sidecar itself
- gives the sidecar one place to verify and record authenticated state
- keeps env credentials as fallback login assistance instead of the primary state source

The sidecar will still honor `TRADOVATE_SYNC_SESSION_DIR` if you explicitly set it, and it will continue to recognize the legacy `runtime/browser-session` path if that already exists. But the intended steady state is a **dedicated sidecar-owned profile**.

## Confirmed manual workflow now encoded
User-confirmed Tradovate flow:
- Source area: **Reports**
- Report 1: **Fills** -> downloads as `fills.csv`
- Report 2: **Performance** -> downloads as `performance.csv`
- Export button text: **Download CSV**
- Date control: dropdown under the date field
- Desired preset: **This Year**
- One Tradovate login may contain multiple accounts, so imports should stay account-specific in the dashboard

## Current login strategy
The sidecar is intentionally conservative and explicit:
1. **Prefer reusing the dedicated persistent browser profile** in `runtime/dedicated-browser-profile`.
2. If the reused sidecar profile does not look authenticated and env credentials are present, try a **credential-assisted fallback login**.
3. If that still does not produce an authenticated session, fall back to **manual login bootstrap** with `--manual-login`.

The sidecar does **not** print secret values in status or sync output.

## What is implemented
- Persistent Chromium session reuse via Playwright `launchPersistentContext()`.
- Dedicated local env file support for credential fallback login.
- Explicit manual-login bootstrap mode that keeps the browser open while you log in.
- Conservative login behavior: only attempt env-based login when the page still clearly looks like a login surface.
- Slightly more robust credential flow handling for username-first and password-second login screens.
- Dedicated-profile-first runtime/status reporting.
- Authenticated session marker recording with supporting evidence from URL/title/body snippet plus cookie/local-storage summaries.
- Unauthenticated-state recording when login/bootstrap verification fails.
- Download/runtime directory management.
- Real report-walk automation attempt via the Reports UI when direct report URLs are still unknown.
- Real date-preset application attempt for `This Year`.
- Stable staging filenames for downstream import review:
  - `fills.csv`
  - `performance.csv`
  - `account-balance-history.csv`
- JSON manifest output at `runtime/manifests/last-sync.json`.

## What is still unverified against a live Tradovate session
The sidecar now reflects the confirmed manual flow, but it is still not fully verified end-to-end against a real authenticated Tradovate browser session in this environment.

You may still need to tune locally:
- exact Reports navigation selectors
- exact date dropdown selector behavior
- exact placement of the `Download CSV` button on each report page
- any MFA / captcha / login interruptions
- whether direct report URLs exist and are stable enough to prefer over UI navigation

## Local setup
1. From the repo root, copy `.env.sync.example` to `sync-sidecar/.env.sync.local`.
2. Edit `sync-sidecar/.env.sync.local` and set:
   - `TRADOVATE_USERNAME=...`
   - `TRADOVATE_PASSWORD=...`
   - `TRADOVATE_SYNC_PROFILE_DIR=Default`
   - optionally `TRADOVATE_TOTP_SECRET=...` for future use/documentation only
3. Keep the default dedicated sidecar profile path unless you have a very specific reason to override it:
   - `TRADOVATE_SYNC_SESSION_DIR=./runtime/dedicated-browser-profile`
4. Install dependencies in `sync-sidecar/`:
   - `npm install`
5. Check the current dedicated-profile status:
   - `npm run status`
6. Bootstrap the dedicated reusable browser session:
   - `npm run sync:bootstrap`
   - or `npm run sync -- --manual-login --bootstrap-only`
7. After login is verified and bootstrap exits cleanly, run a normal sync:
   - `npm run sync`
8. Inspect:
   - `runtime/manifests/last-sync.json`
   - `runtime/dedicated-browser-profile/session-state.json`

## Env file resolution
When you run commands from `sync-sidecar/`, the loader checks these local-only files in this order if they exist:
1. `sync-sidecar/.env.sync.local`
2. `sync-sidecar/.env.local`
3. `../.env.sync.local`
4. `../.env.local`

Earlier files win because env vars are only set if they are not already present.

Recommended file: `sync-sidecar/.env.sync.local`

## Commands
- `npm run status`
- `npm run plan`
- `npm run sync`
- `npm run sync -- --report=fills`
- `npm run sync -- --report=performance`
- `npm run sync -- --report=account-balance-history`
- `npm run sync:bootstrap`
- `npm run sync -- --manual-login --bootstrap-only --manual-login-timeout-ms=1800000`

## Recommended next runnable path
Use the dedicated-profile bootstrap first:
1. `cd sync-sidecar`
2. `npm run status`
3. `npm run sync:bootstrap`
4. Complete Tradovate login in the launched browser window for the **sidecar's own profile**.
5. Return to the terminal and press Enter so the sidecar can verify/save authenticated state.
6. Then run `npm run sync`.

## Manual login bootstrap flow
Use this when there is no valid saved sidecar session yet, when Tradovate forces a fresh interactive login, or when MFA/captcha blocks credential fallback.

### Recommended
```bash
npm run sync:bootstrap
```

What it does:
- launches a persistent Chromium context using `runtime/dedicated-browser-profile`
- opens the Tradovate login page
- keeps the browser open while you complete login manually
- waits for you to press Enter in the terminal
- re-checks whether the sidecar profile now looks authenticated
- writes a reusable authenticated marker into `session-state.json`
- exits only after verified authenticated state, timeout, or explicit abort

## Notes
- No credentials are logged.
- Dedicated profile reuse is preferred over env credentials.
- Downloads are staged into `runtime/staging/` using stable filenames expected by the app import flow.
- If bootstrap succeeds but report downloads still fail, the next likely issue is selector tuning rather than session persistence.

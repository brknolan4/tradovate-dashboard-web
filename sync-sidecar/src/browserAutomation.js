import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';
import { resolveBrowserLaunchCandidates } from './browserResolution.js';
import { canAttemptLogin, recordUnauthenticatedSessionState, writeSavedSessionState } from './sessionStrategy.js';

function buildLaunchOptions(config, browserTarget) {
  const options = {
    headless: config.manualLoginMode ? false : config.headless,
    acceptDownloads: true,
  };

  if (browserTarget.channel) {
    options.channel = browserTarget.channel;
  }

  if (browserTarget.executablePath) {
    options.executablePath = browserTarget.executablePath;
  }

  if (config.browserProfileDirectory) {
    options.args = [`--profile-directory=${config.browserProfileDirectory}`];
  }

  return options;
}

function normalizeUrl(baseUrl, fallbackPath = '') {
  if (!fallbackPath) return baseUrl;
  return new URL(fallbackPath, baseUrl).toString();
}

async function firstVisible(page, selectors = [], timeoutMs = 5000) {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: timeoutMs });
      return locator;
    } catch {
      // try next selector
    }
  }

  return null;
}

async function clickFirstVisible(page, selectors = [], timeoutMs = 5000) {
  const locator = await firstVisible(page, selectors, timeoutMs);
  if (!locator) return false;
  await locator.click().catch(() => {});
  return true;
}

function getUsernameSelectors() {
  return [
    'input[type="email"]',
    'input[name="name"]',
    'input[name="username"]',
    'input[autocomplete="username"]',
    'input[placeholder*="Username" i]',
    'input[placeholder*="Email" i]',
  ];
}

function getPasswordSelectors() {
  return ['input[type="password"]'];
}

function getSubmitSelectors() {
  return [
    'button[type="submit"]',
    'button:has-text("Sign in")',
    'button:has-text("Sign In")',
    'button:has-text("Log in")',
    'button:has-text("Login")',
    'button:has-text("Continue")',
    'input[type="submit"]',
  ];
}

async function summarizeCookies(context) {
  const cookies = await context.cookies().catch(() => []);
  return {
    total: cookies.length,
    tradovateCookies: cookies.filter((cookie) => /tradovate/i.test(cookie.domain || '')).length,
    hasSessionLikeCookie: cookies.some((cookie) => /session|auth|token|jwt/i.test(cookie.name || '')),
  };
}

async function inspectAuthState(page, config) {
  const passwordField = page.locator(getPasswordSelectors().join(', ')).first();
  const usernameField = page.locator(getUsernameSelectors().join(', ')).first();
  const passwordVisible = await passwordField.isVisible().catch(() => false);
  const usernameVisible = await usernameField.isVisible().catch(() => false);
  const currentUrl = page.url();
  const title = await page.title().catch(() => '');
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const bodySnippet = bodyText.replace(/\s+/g, ' ').trim().slice(0, 350);
  const looksLikeWelcomeLogin = /welcome back|log in to access tradovate|need help\?|sign in with google|sign in with apple|sign in|login|welcome/i.test(bodyText);
  const looksLoggedOutUrl = /login|signin|auth|\/welcome(?:$|[/?#])/i.test(currentUrl);
  const hasReportsLanguage = /reports|fills|performance|account balance/i.test(bodyText);
  const hasTradingLanguage = /positions|orders|accounts|chart|performance center|trading/i.test(bodyText);
  const localStorageSnapshot = await page.evaluate(() => {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) keys.push(key);
    }

    return {
      keyCount: keys.length,
      authLikeKeys: keys.filter((key) => /auth|token|user|account|session/i.test(key)).slice(0, 20),
    };
  }).catch(() => ({ keyCount: 0, authLikeKeys: [] }));
  const cookieSummary = await summarizeCookies(page.context());

  const authenticated = !passwordVisible
    && !usernameVisible
    && !looksLikeWelcomeLogin
    && !looksLoggedOutUrl
    && (hasReportsLanguage || hasTradingLanguage || !currentUrl.startsWith(config.loginUrl));

  return {
    authenticated,
    currentUrl,
    title,
    passwordVisible,
    usernameVisible,
    looksLikeWelcomeLogin,
    looksLoggedOutUrl,
    hasReportsLanguage,
    hasTradingLanguage,
    bodySnippet,
    localStorageSnapshot,
    cookieSummary,
  };
}

function rememberAuthenticatedSession(runtimePaths, browserTarget, authState, config, mode) {
  writeSavedSessionState(runtimePaths.sessionDir, {
    authenticated: true,
    verifiedAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    verificationMode: mode,
    verificationReason: 'Launch-time inspection found the dedicated sidecar profile on an authenticated Tradovate surface.',
    browser: {
      source: browserTarget.source,
      executablePath: browserTarget.executablePath || null,
      channel: browserTarget.channel || null,
      displayName: browserTarget.displayName,
    },
    profile: {
      sessionDir: runtimePaths.sessionDir,
      profileDirectory: config.browserProfileDirectory || 'Default',
    },
    url: authState.currentUrl,
    title: authState.title,
    authEvidence: {
      hasReportsLanguage: authState.hasReportsLanguage,
      hasTradingLanguage: authState.hasTradingLanguage,
      cookieSummary: authState.cookieSummary,
      localStorageSnapshot: authState.localStorageSnapshot,
      bodySnippet: authState.bodySnippet,
    },
  });
}

function rememberUnauthenticatedSession(runtimePaths, browserTarget, authState, config, mode, reason) {
  recordUnauthenticatedSessionState(runtimePaths.sessionDir, {
    lastFailureMode: mode,
    verificationReason: reason,
    url: authState?.currentUrl || null,
    title: authState?.title || null,
    profile: {
      sessionDir: runtimePaths.sessionDir,
      profileDirectory: config.browserProfileDirectory || 'Default',
    },
    browser: browserTarget ? {
      source: browserTarget.source,
      executablePath: browserTarget.executablePath || null,
      channel: browserTarget.channel || null,
      displayName: browserTarget.displayName,
    } : null,
    authEvidence: authState ? {
      hasReportsLanguage: authState.hasReportsLanguage,
      hasTradingLanguage: authState.hasTradingLanguage,
      cookieSummary: authState.cookieSummary,
      localStorageSnapshot: authState.localStorageSnapshot,
      bodySnippet: authState.bodySnippet,
      passwordVisible: authState.passwordVisible,
      usernameVisible: authState.usernameVisible,
      looksLikeWelcomeLogin: authState.looksLikeWelcomeLogin,
      looksLoggedOutUrl: authState.looksLoggedOutUrl,
    } : null,
  });
}

async function navigateToLogin(page, config) {
  await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded', timeout: config.browserLaunchTimeoutMs });
  await page.waitForTimeout(1500);
  return inspectAuthState(page, config);
}

async function fillIfVisible(page, selectors, value) {
  if (!value) return false;
  const field = await firstVisible(page, selectors, 2500);
  if (!field) return false;
  await field.fill(value);
  return true;
}

async function clickSubmitIfVisible(page) {
  const submit = await firstVisible(page, getSubmitSelectors(), 2500);
  if (!submit) return false;
  await submit.click().catch(() => {});
  return true;
}

async function settleAfterLoginAction(page, config) {
  await page.waitForLoadState('domcontentloaded', { timeout: config.browserLaunchTimeoutMs }).catch(() => {});
  await page.waitForTimeout(config.postLoginWaitMs);
}

async function attemptEnvLogin(page, config, runtimePaths, browserTarget) {
  const initialState = await inspectAuthState(page, config);
  const wasOnLoginSurface = initialState.passwordVisible || initialState.usernameVisible || initialState.looksLikeWelcomeLogin || initialState.looksLoggedOutUrl;

  if (!wasOnLoginSurface) {
    const detail = `Env credential fallback was not attempted because Tradovate did not clearly present a login form at ${initialState.currentUrl}. Use --manual-login if Tradovate is waiting on MFA, captcha, or an unexpected interstitial.`;
    rememberUnauthenticatedSession(runtimePaths, browserTarget, initialState, config, 'env-login-skipped', detail);
    return {
      loggedIn: false,
      mode: 'env-login-skipped',
      detail,
      authState: initialState,
    };
  }

  const usernameFilled = await fillIfVisible(page, getUsernameSelectors(), config.username);
  if (usernameFilled) {
    await clickSubmitIfVisible(page);
    await settleAfterLoginAction(page, config);
  }

  const passwordFilled = await fillIfVisible(page, getPasswordSelectors(), config.password);
  if (!passwordFilled) {
    const stateAfterUsername = await inspectAuthState(page, config);
    const detail = `Env credential fallback could not find a password field after the username step at ${stateAfterUsername.currentUrl}. Manual intervention may still be required for MFA, captcha, SSO, or a changed login flow.`;
    rememberUnauthenticatedSession(runtimePaths, browserTarget, stateAfterUsername, config, 'env-login-blocked', detail);
    return {
      loggedIn: false,
      mode: 'env-login-blocked',
      detail,
      authState: stateAfterUsername,
    };
  }

  await clickSubmitIfVisible(page);
  await settleAfterLoginAction(page, config);

  const authState = await inspectAuthState(page, config);
  if (!authState.authenticated) {
    const detail = `Env credential fallback submitted credentials but Tradovate still appears unauthenticated at ${authState.currentUrl}. Manual intervention may still be required for MFA, captcha, locked account checks, or updated selectors.`;
    rememberUnauthenticatedSession(runtimePaths, browserTarget, authState, config, 'env-login-blocked', detail);
    return {
      loggedIn: false,
      mode: 'env-login-blocked',
      detail,
      authState,
    };
  }

  rememberAuthenticatedSession(runtimePaths, browserTarget, authState, config, 'env-login');

  return {
    loggedIn: true,
    mode: 'env-login',
    detail: 'Credential-based fallback login succeeded and refreshed the authenticated dedicated-profile marker.',
    authState,
  };
}

async function waitForAuthenticatedSession(page, config, runtimePaths, browserTarget) {
  const deadline = config.manualLoginTimeoutMs > 0 ? Date.now() + config.manualLoginTimeoutMs : null;
  const interactive = Boolean(process.stdin.isTTY && !config.nonInteractive);
  let lastState = await inspectAuthState(page, config);

  const renderInstructions = () => {
    console.log('');
    console.log('Tradovate manual login bootstrap');
    console.log(`- Dedicated sidecar profile dir: ${runtimePaths.sessionDir}`);
    console.log(`- Profile directory: ${config.browserProfileDirectory || 'Default'}`);
    console.log(`- Login URL: ${config.loginUrl}`);
    console.log(`- Browser target: ${browserTarget.displayName}`);
    console.log('- Complete the login in the launched browser window.');
    console.log('- This sidecar profile is the intended long-lived Tradovate session; do not rely on your normal Chromium profile here.');
    console.log('- After login completes, come back here and press Enter to verify and save the authenticated marker.');
    console.log('- Type "status" to re-check, or "abort" to stop the bootstrap run.');
    console.log('');
  };

  if (interactive) {
    renderInstructions();
    const rl = readline.createInterface({ input, output });

    try {
      while (true) {
        if (lastState.authenticated) {
          await page.waitForTimeout(config.postLoginWaitMs);
          rememberAuthenticatedSession(runtimePaths, browserTarget, lastState, config, 'manual-login');
          return {
            loggedIn: true,
            mode: 'manual-login-saved',
            detail: `Manual login verified at ${lastState.currentUrl}. Dedicated sidecar profile marker was saved for the next sync run.`,
            authState: lastState,
          };
        }

        if (deadline && Date.now() > deadline) {
          const detail = `Timed out waiting for manual login after ${config.manualLoginTimeoutMs}ms. Browser stayed open for the full wait period.`;
          rememberUnauthenticatedSession(runtimePaths, browserTarget, lastState, config, 'manual-login-timeout', detail);
          return {
            loggedIn: false,
            mode: 'manual-login-timeout',
            detail,
            authState: lastState,
          };
        }

        const answer = (await rl.question('Press Enter once login looks complete (status/abort): ')).trim().toLowerCase();
        if (answer === 'abort' || answer === 'quit' || answer === 'q') {
          const detail = 'Manual login bootstrap was aborted before an authenticated session was verified.';
          rememberUnauthenticatedSession(runtimePaths, browserTarget, lastState, config, 'manual-login-aborted', detail);
          return {
            loggedIn: false,
            mode: 'manual-login-aborted',
            detail,
            authState: lastState,
          };
        }

        lastState = await navigateToLogin(page, config);
        if (!lastState.authenticated) {
          console.log(`Still looks unauthenticated at ${lastState.currentUrl}. Finish login in the browser, then press Enter again.`);
        }
      }
    } finally {
      rl.close();
    }
  }

  console.log(`Waiting up to ${config.manualLoginTimeoutMs}ms for manual login to complete in the browser...`);

  while (true) {
    if (lastState.authenticated) {
      await page.waitForTimeout(config.postLoginWaitMs);
      rememberAuthenticatedSession(runtimePaths, browserTarget, lastState, config, 'manual-login');
      return {
        loggedIn: true,
        mode: 'manual-login-saved',
        detail: `Manual login verified at ${lastState.currentUrl}. Dedicated sidecar profile marker was saved for the next sync run.`,
        authState: lastState,
      };
    }

    if (deadline && Date.now() > deadline) {
      const detail = `Timed out waiting for manual login after ${config.manualLoginTimeoutMs}ms. Browser stayed open for the full wait period.`;
      rememberUnauthenticatedSession(runtimePaths, browserTarget, lastState, config, 'manual-login-timeout', detail);
      return {
        loggedIn: false,
        mode: 'manual-login-timeout',
        detail,
        authState: lastState,
      };
    }

    await page.waitForTimeout(config.manualLoginPollIntervalMs);
    lastState = await navigateToLogin(page, config);
  }
}

async function ensureLoggedIn(page, config, runtimePaths, browserTarget) {
  const authState = await navigateToLogin(page, config);

  if (authState.authenticated) {
    rememberAuthenticatedSession(runtimePaths, browserTarget, authState, config, 'reused-session');
    return {
      loggedIn: true,
      mode: 'reused-session',
      detail: `Existing dedicated sidecar profile appears authenticated at ${authState.currentUrl}.`,
      authState,
    };
  }

  if (canAttemptLogin(config)) {
    const envLoginResult = await attemptEnvLogin(page, config, runtimePaths, browserTarget);
    if (envLoginResult.loggedIn) {
      return envLoginResult;
    }

    if (!config.manualLoginMode) {
      return {
        ...envLoginResult,
        mode: envLoginResult.mode === 'env-login-skipped' ? 'manual-login-required' : envLoginResult.mode,
        detail: `${envLoginResult.detail} Re-run with --manual-login to keep the dedicated sidecar profile browser open for an interactive fallback bootstrap.`,
      };
    }
  }

  if (config.manualLoginMode) {
    return waitForAuthenticatedSession(page, config, runtimePaths, browserTarget);
  }

  const detail = canAttemptLogin(config)
    ? `Env credential fallback did not establish an authenticated session at ${authState.currentUrl}. Re-run with --manual-login to keep the dedicated sidecar profile browser open for interactive fallback bootstrap.`
    : `Tradovate still appears unauthenticated at ${authState.currentUrl} and no env fallback credentials are configured. Re-run with --manual-login to keep the dedicated sidecar profile browser open for interactive bootstrap.`;
  rememberUnauthenticatedSession(runtimePaths, browserTarget, authState, config, 'manual-login-required', detail);
  return {
    loggedIn: false,
    mode: 'manual-login-required',
    detail,
    authState,
  };
}

async function navigateViaReportsUi(page, report, config) {
  await page.goto(config.reportsBaseUrl, { waitUntil: 'domcontentloaded', timeout: config.browserLaunchTimeoutMs });
  await page.waitForTimeout(1000);

  await clickFirstVisible(page, report.selectors.reportsEntry, 4000);
  await page.waitForTimeout(750);

  const reportOpened = await clickFirstVisible(page, report.selectors.reportLink, 5000);
  if (!reportOpened) {
    return {
      reportUrl: config.reportsBaseUrl,
      finalUrl: page.url(),
      title: await page.title().catch(() => ''),
      ready: false,
      bodySnippet: await page.locator('body').innerText().then((text) => text.replace(/\s+/g, ' ').trim().slice(0, 500)).catch(() => ''),
      mode: 'reports-ui',
    };
  }

  await page.waitForTimeout(1500);
  const readyMarker = await firstVisible(page, report.selectors.pageReady, 5000);
  const bodySnippet = await page.locator('body').innerText().then((text) => text.replace(/\s+/g, ' ').trim().slice(0, 500)).catch(() => '');

  return {
    reportUrl: page.url(),
    finalUrl: page.url(),
    title: await page.title().catch(() => ''),
    ready: Boolean(readyMarker),
    bodySnippet,
    mode: 'reports-ui',
  };
}

async function applyReportFilters(page, report) {
  if (!report.filters?.datePresetLabel || !report.selectors?.dateDropdown?.length) {
    return { ok: true, detail: 'No report filter adjustments requested.' };
  }

  const dropdown = await firstVisible(page, report.selectors.dateDropdown, 4000);
  if (!dropdown) {
    return {
      ok: false,
      detail: `Date dropdown not found while trying to select ${report.filters.datePresetLabel}.`,
    };
  }

  const tagName = await dropdown.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');

  if (tagName === 'select') {
    await dropdown.selectOption({ label: report.filters.datePresetLabel }).catch(() => {});
  } else {
    await dropdown.click().catch(() => {});
    const option = await firstVisible(page, report.selectors.datePresetOption, 4000);
    if (!option) {
      return {
        ok: false,
        detail: `Opened date control but could not find preset option ${report.filters.datePresetLabel}.`,
      };
    }
    await option.click().catch(() => {});
  }

  await page.waitForTimeout(1200);
  return {
    ok: true,
    detail: `Applied date preset ${report.filters.datePresetLabel}.`,
  };
}

async function waitForDownloadAndSave(page, report, runtimePaths, config) {
  const exportButton = await firstVisible(page, report.selectors.exportButton, 5000);
  if (!exportButton) {
    throw new Error(`Export button not found for ${report.id}. Update selector config for this report.`);
  }

  const download = await Promise.all([
    page.waitForEvent('download', { timeout: config.downloadsTimeoutMs }),
    exportButton.click(),
  ]).then(([event]) => event);

  const suggestedFileName = download.suggestedFilename();
  const temporaryPath = path.join(runtimePaths.downloadDir, suggestedFileName);
  await download.saveAs(temporaryPath);

  return {
    temporaryPath,
    suggestedFileName,
  };
}

async function navigateToReport(page, report, config) {
  const directReportUrl = report.navigation.reportUrl || (report.navigation.fallbackPath ? normalizeUrl(config.reportsBaseUrl, report.navigation.fallbackPath) : '');

  if (directReportUrl) {
    await page.goto(directReportUrl, { waitUntil: 'domcontentloaded', timeout: config.browserLaunchTimeoutMs });
    const readyMarker = await firstVisible(page, report.selectors.pageReady, 5000);
    const bodySnippet = await page.locator('body').innerText().then((text) => text.replace(/\s+/g, ' ').trim().slice(0, 500)).catch(() => '');
    return {
      reportUrl: directReportUrl,
      finalUrl: page.url(),
      title: await page.title().catch(() => ''),
      ready: Boolean(readyMarker),
      bodySnippet,
      mode: 'direct-url',
    };
  }

  return navigateViaReportsUi(page, report, config);
}

export async function runBrowserSync({ config, runtimePaths, reports }) {
  let context;
  let browserTarget = null;
  const launchAttempts = [];
  const candidates = resolveBrowserLaunchCandidates(config).filter((candidate) => candidate.exists);

  for (const candidate of candidates) {
    browserTarget = candidate;
    try {
      context = await chromium.launchPersistentContext(runtimePaths.sessionDir, buildLaunchOptions(config, candidate));
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      launchAttempts.push({
        browserTarget: candidate,
        message,
      });
    }
  }

  if (!context) {
    const lastAttempt = launchAttempts.at(-1);
    const lastMessage = lastAttempt?.message || 'No browser candidate could be launched.';
    const definitelyLocked = /process_singleton|singletonlock|profile.*in use|singletonsocket|singletoncookie/i.test(lastMessage);
    const sessionDirMessage = runtimePaths.sessionDir;
    return {
      ok: false,
      browserTarget: lastAttempt?.browserTarget || null,
      launchAttempts,
      session: {
        loggedIn: false,
        mode: 'browser-launch-failed',
        detail: lastMessage,
      },
      results: [],
      blocked: definitelyLocked
        ? `Playwright could not launch the dedicated sidecar profile because Chromium reported an in-use singleton/lock under ${sessionDirMessage}. Close any browser already using that dedicated profile, then bootstrap again.`
        : 'Playwright could not launch the current browser/profile combination. Prefer a single dedicated Tradovate sidecar profile here, or set TRADOVATE_SYNC_BROWSER_EXECUTABLE_PATH explicitly.',
    };
  }

  const page = context.pages()[0] || await context.newPage();
  const results = [];

  try {
    const session = await ensureLoggedIn(page, config, runtimePaths, browserTarget);

    if (!session.loggedIn || config.sessionBootstrapOnly) {
      return {
        ok: session.loggedIn,
        browserTarget,
        session,
        results,
        blocked: config.sessionBootstrapOnly
          ? 'Session bootstrap only requested; no report downloads attempted.'
          : session.detail,
      };
    }

    for (const report of reports) {
      const navigation = await navigateToReport(page, report, config);

      if (!navigation.ready) {
        results.push({
          reportId: report.id,
          ok: false,
          stage: 'navigate',
          detail: `Could not confirm ${report.label} page in Tradovate ${report.sourceArea || 'Reports'} via ${navigation.mode}. Final URL: ${navigation.finalUrl}. Snippet: ${navigation.bodySnippet}`,
        });
        continue;
      }

      const filterResult = await applyReportFilters(page, report);
      if (!filterResult.ok) {
        results.push({
          reportId: report.id,
          ok: false,
          stage: 'filter',
          detail: filterResult.detail,
        });
        continue;
      }

      try {
        const downloadInfo = await waitForDownloadAndSave(page, report, runtimePaths, config);
        results.push({
          reportId: report.id,
          ok: true,
          stage: 'downloaded',
          detail: `${filterResult.detail} Report downloaded to runtime/downloads and ready for staging.`,
          download: downloadInfo,
        });
      } catch (error) {
        results.push({
          reportId: report.id,
          ok: false,
          stage: 'download',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      ok: results.length > 0 && results.every((result) => result.ok),
      browserTarget,
      session,
      results,
    };
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

export function writeSyncManifest(runtimePaths, payload) {
  const manifestPath = path.join(runtimePaths.manifestsDir, 'last-sync.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return manifestPath;
}

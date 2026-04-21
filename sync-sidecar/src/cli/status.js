import { getSessionDirDefaults, getSyncConfig, redactSecret } from '../config.js';
import { reportDefinitions } from '../reportDefinitions.js';
import { resolveBrowserTarget } from '../browserResolution.js';
import { detectSessionStrategy } from '../sessionStrategy.js';
import { ensureRuntimeDirectories } from '../runtimePaths.js';

const config = getSyncConfig();
const runtimePaths = ensureRuntimeDirectories(config);
const strategy = detectSessionStrategy({ ...config, sessionDir: runtimePaths.sessionDir });
const browserTarget = resolveBrowserTarget(config);
const sessionDirDefaults = getSessionDirDefaults();

console.log(JSON.stringify({
  strategy,
  paths: runtimePaths,
  dedicatedProfile: {
    strategy: 'dedicated-sidecar-profile-only',
    sessionDirInUse: runtimePaths.sessionDir,
    defaultDedicatedSessionDir: sessionDirDefaults.dedicated,
    legacySessionDir: sessionDirDefaults.legacy,
    profileDirectory: config.browserProfileDirectory || 'Default',
    note: 'This sidecar should maintain its own persistent Tradovate browser profile instead of trying to reuse a normal desktop Chromium session.',
  },
  browser: {
    loginUrl: config.loginUrl,
    reportsBaseUrl: config.reportsBaseUrl,
    browserChannel: config.browserChannel || '(not set)',
    browserExecutablePath: config.browserExecutablePath ? '***set***' : '(not set)',
    browserProfileDirectory: config.browserProfileDirectory || 'Default',
    resolvedTarget: {
      source: browserTarget.source,
      displayName: browserTarget.displayName,
      executablePath: browserTarget.executablePath || null,
      channel: browserTarget.channel || null,
      exists: browserTarget.exists,
    },
    headless: config.headless,
    sessionBootstrapOnly: config.sessionBootstrapOnly,
    manualLoginMode: config.manualLoginMode,
    manualLoginTimeoutMs: config.manualLoginTimeoutMs,
    nonInteractive: config.nonInteractive,
  },
  supportedReports: reportDefinitions.map((report) => ({
    id: report.id,
    label: report.label,
    outputFileName: report.outputFileName,
    hasDirectReportUrl: Boolean(report.navigation.reportUrl),
    hasFallbackPath: Boolean(report.navigation.fallbackPath),
    pageReadySelectorCount: report.selectors.pageReady.length,
    exportSelectorCount: report.selectors.exportButton.length,
  })),
  credentials: {
    username: redactSecret(config.username),
    password: redactSecret(config.password),
    totpSecret: redactSecret(config.totpSecret),
  },
}, null, 2));

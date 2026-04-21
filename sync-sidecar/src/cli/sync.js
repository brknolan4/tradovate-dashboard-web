import path from 'node:path';
import { getSyncConfig } from '../config.js';
import { buildImportPlan } from '../importPlan.js';
import { getReportDefinition, reportDefinitions } from '../reportDefinitions.js';
import { detectSessionStrategy } from '../sessionStrategy.js';
import { runBrowserSync, writeSyncManifest } from '../browserAutomation.js';
import { ensureRuntimeDirectories, stageDownloadedReport } from '../runtimePaths.js';

function parseArgs(argv) {
  const reportArgs = [];
  const overrides = {};

  for (const value of argv) {
    if (value.startsWith('--report=')) {
      reportArgs.push(...value.slice('--report='.length).split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (value === '--manual-login') {
      overrides.manualLoginMode = true;
      continue;
    }

    if (value === '--bootstrap-only') {
      overrides.sessionBootstrapOnly = true;
      continue;
    }

    if (value === '--non-interactive') {
      overrides.nonInteractive = true;
      continue;
    }

    if (value.startsWith('--manual-login-timeout-ms=')) {
      const timeout = Number.parseInt(value.slice('--manual-login-timeout-ms='.length), 10);
      if (Number.isFinite(timeout)) {
        overrides.manualLoginTimeoutMs = timeout;
      }
    }
  }

  return {
    reportArgs,
    overrides,
  };
}

const parsedArgs = parseArgs(process.argv.slice(2));
const config = getSyncConfig(parsedArgs.overrides);
const runtimePaths = ensureRuntimeDirectories(config);
const strategy = detectSessionStrategy({ ...config, sessionDir: runtimePaths.sessionDir });
const requestedReportIds = parsedArgs.reportArgs.length > 0
  ? parsedArgs.reportArgs
  : reportDefinitions.map((report) => report.id);
const reports = requestedReportIds
  .map((reportId) => getReportDefinition(reportId))
  .filter(Boolean);
const unknownReports = requestedReportIds.filter((reportId) => !getReportDefinition(reportId));

if (reports.length === 0) {
  console.error(JSON.stringify({
    ok: false,
    error: 'No valid report ids requested.',
    requestedReportIds,
    validReportIds: reportDefinitions.map((report) => report.id),
  }, null, 2));
  process.exit(1);
}

const startedAt = new Date().toISOString();
const syncResult = await runBrowserSync({ config, runtimePaths, reports });
const stagedReports = [];

for (const result of syncResult.results.filter((item) => item.ok && item.download?.temporaryPath)) {
  const report = getReportDefinition(result.reportId);
  const stagedPath = stageDownloadedReport(result.download.temporaryPath, report.outputFileName, runtimePaths.importStagingDir);
  stagedReports.push({
    reportId: report.id,
    downloadPath: result.download.temporaryPath,
    stagedPath,
  });
}

const payload = {
  ok: syncResult.ok,
  startedAt,
  finishedAt: new Date().toISOString(),
  strategy,
  plan: buildImportPlan(),
  requestedReportIds,
  unknownReports,
  runtimePaths,
  browserTarget: syncResult.browserTarget || null,
  launchAttempts: syncResult.launchAttempts || [],
  session: syncResult.session,
  configSummary: {
    headless: config.headless,
    sessionBootstrapOnly: config.sessionBootstrapOnly,
    manualLoginMode: config.manualLoginMode,
    manualLoginTimeoutMs: config.manualLoginTimeoutMs,
    nonInteractive: config.nonInteractive,
    hasEnvCredentials: Boolean(config.username && config.password),
    hasTotpSecret: Boolean(config.totpSecret),
  },
  results: syncResult.results.map((result) => ({
    reportId: result.reportId,
    ok: result.ok,
    stage: result.stage,
    detail: result.detail,
    suggestedFileName: result.download?.suggestedFileName || null,
  })),
  stagedReports,
  blocked: syncResult.blocked || null,
};

const manifestPath = writeSyncManifest(runtimePaths, payload);

console.log(JSON.stringify({
  ...payload,
  manifestPath,
}, null, 2));

if (!syncResult.ok || unknownReports.length > 0) {
  process.exit(1);
}

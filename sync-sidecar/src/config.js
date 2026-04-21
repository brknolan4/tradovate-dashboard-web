import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

const ENV_CANDIDATES = [
  '.env.sync.local',
  '.env.local',
  '../.env.sync.local',
  '../.env.local',
];

const DEFAULT_SESSION_DIR = './runtime/dedicated-browser-profile';
const LEGACY_SESSION_DIR = './runtime/browser-session';

for (const relativePath of ENV_CANDIDATES) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(absolutePath)) {
    loadEnv({ path: absolutePath, override: false });
  }
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveDefaultSessionDir() {
  if (process.env.TRADOVATE_SYNC_SESSION_DIR) {
    return process.env.TRADOVATE_SYNC_SESSION_DIR;
  }

  const dedicatedExists = fs.existsSync(path.resolve(process.cwd(), DEFAULT_SESSION_DIR));
  if (dedicatedExists) {
    return DEFAULT_SESSION_DIR;
  }

  const legacyExists = fs.existsSync(path.resolve(process.cwd(), LEGACY_SESSION_DIR));
  if (legacyExists) {
    return LEGACY_SESSION_DIR;
  }

  return DEFAULT_SESSION_DIR;
}

export function getSyncConfig(overrides = {}) {
  return {
    username: process.env.TRADOVATE_USERNAME || '',
    password: process.env.TRADOVATE_PASSWORD || '',
    totpSecret: process.env.TRADOVATE_TOTP_SECRET || '',
    loginUrl: process.env.TRADOVATE_LOGIN_URL || 'https://trader.tradovate.com/',
    reportsBaseUrl: process.env.TRADOVATE_REPORTS_BASE_URL || 'https://trader.tradovate.com/',
    browserChannel: process.env.TRADOVATE_SYNC_BROWSER_CHANNEL || '',
    browserExecutablePath: process.env.TRADOVATE_SYNC_BROWSER_EXECUTABLE_PATH || '',
    browserLaunchTimeoutMs: parseInteger(process.env.TRADOVATE_SYNC_BROWSER_TIMEOUT_MS, 30000),
    postLoginWaitMs: parseInteger(process.env.TRADOVATE_SYNC_POST_LOGIN_WAIT_MS, 3000),
    downloadsTimeoutMs: parseInteger(process.env.TRADOVATE_SYNC_DOWNLOAD_TIMEOUT_MS, 45000),
    sessionBootstrapOnly: parseBoolean(process.env.TRADOVATE_SYNC_BOOTSTRAP_ONLY, false),
    manualLoginMode: parseBoolean(process.env.TRADOVATE_SYNC_MANUAL_LOGIN, false),
    manualLoginTimeoutMs: parseInteger(process.env.TRADOVATE_SYNC_MANUAL_LOGIN_TIMEOUT_MS, 900000),
    manualLoginPollIntervalMs: parseInteger(process.env.TRADOVATE_SYNC_MANUAL_LOGIN_POLL_MS, 2000),
    nonInteractive: parseBoolean(process.env.TRADOVATE_SYNC_NON_INTERACTIVE, false),
    downloadDir: process.env.TRADOVATE_SYNC_DOWNLOAD_DIR || './runtime/downloads',
    sessionDir: resolveDefaultSessionDir(),
    browserProfileDirectory: process.env.TRADOVATE_SYNC_PROFILE_DIR || 'Default',
    importStagingDir: process.env.TRADOVATE_SYNC_IMPORT_STAGING_DIR || './runtime/staging',
    headless: parseBoolean(process.env.TRADOVATE_SYNC_HEADLESS, false),
    ...overrides,
  };
}

export function resolveRuntimePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

export function redactSecret(value) {
  if (!value) return '(not set)';
  return '***set***';
}

export function getSessionDirDefaults() {
  return {
    dedicated: DEFAULT_SESSION_DIR,
    legacy: LEGACY_SESSION_DIR,
  };
}

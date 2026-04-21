import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const COMMON_BROWSER_PATHS = [
  '/snap/bin/chromium',
  '/home/linuxbrew/.linuxbrew/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/usr/bin/msedge',
];

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolvePlaywrightBundledBrowser() {
  try {
    const executablePath = chromium.executablePath();
    if (executablePath && isExecutable(executablePath)) {
      return {
        executablePath,
        source: 'playwright-bundled',
        displayName: 'Playwright bundled Chromium',
      };
    }
  } catch {
    // ignore and fall through
  }

  return null;
}

function resolveCommonLocalBrowsers() {
  return COMMON_BROWSER_PATHS
    .filter((executablePath) => isExecutable(executablePath))
    .map((executablePath) => ({
      executablePath,
      source: executablePath.startsWith('/snap/') ? 'system-snap' : 'system-path',
      displayName: path.basename(executablePath),
    }));
}

export function resolveBrowserLaunchCandidates(config) {
  if (config.browserExecutablePath) {
    return [{
      executablePath: config.browserExecutablePath,
      channel: '',
      source: 'env-executable-path',
      displayName: config.browserExecutablePath,
      exists: isExecutable(config.browserExecutablePath),
    }];
  }

  if (config.browserChannel) {
    return [{
      executablePath: '',
      channel: config.browserChannel,
      source: 'env-channel',
      displayName: `channel:${config.browserChannel}`,
      exists: true,
    }];
  }

  const candidates = [];
  const local = resolveCommonLocalBrowsers();
  const bundled = resolvePlaywrightBundledBrowser();

  candidates.push(...local.map((item) => ({ ...item, channel: '', exists: true })));
  if (bundled) {
    candidates.push({ ...bundled, channel: '', exists: true });
  }

  if (candidates.length === 0) {
    candidates.push({
      executablePath: '',
      channel: '',
      source: 'unresolved',
      displayName: 'no-browser-found',
      exists: false,
    });
  }

  return candidates;
}

export function resolveBrowserTarget(config) {
  return resolveBrowserLaunchCandidates(config)[0];
}

import { defaultSyncStatus, loadSyncStatus, saveSyncStatus } from './syncStorage';
import type { SyncBundleFile, SyncRequestPayload, SyncStatus, SyncTriggerResult } from '../types/sync';

const DEFAULT_HELPER_BASE_URL = 'http://127.0.0.1:43128';
const HELPER_STATUS_PATH = '/api/tradovate-sync/status';
const HELPER_TRIGGER_PATH = '/api/tradovate-sync/sync';
const HELPER_HEALTH_PATH = '/api/tradovate-sync/health';
const HELPER_LATEST_BUNDLE_PATH = '/api/tradovate-sync/bundle/latest';
const REQUEST_TIMEOUT_MS = 10000;

function nowIso() {
  return new Date().toISOString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getHelperBaseUrl() {
  const envBaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TRADOVATE_SYNC_HELPER_URL : undefined;
  return (envBaseUrl || DEFAULT_HELPER_BASE_URL).replace(/\/$/, '');
}

function getHelperEndpoints() {
  const baseUrl = getHelperBaseUrl();
  return {
    baseUrl,
    statusUrl: `${baseUrl}${HELPER_STATUS_PATH}`,
    triggerUrl: `${baseUrl}${HELPER_TRIGGER_PATH}`,
    healthUrl: `${baseUrl}${HELPER_HEALTH_PATH}`,
    latestBundleUrl: `${baseUrl}${HELPER_LATEST_BUNDLE_PATH}`,
  };
}

function buildNotes(payload: SyncRequestPayload = {}) {
  return [
    'Designed for persistent browser session reuse first.',
    'Environment credentials are fallback-only and should remain local.',
    'Target auto-import source: /home/brendan/Downloads.',
    payload.accountHint ? `Account hint: ${payload.accountHint}` : 'No account hint provided.',
  ];
}

function normalizeStatus(raw: Partial<SyncStatus> | null | undefined, fallback?: SyncStatus): SyncStatus {
  const endpoints = getHelperEndpoints();
  return {
    ...defaultSyncStatus,
    ...(fallback || {}),
    ...(raw || {}),
    helper: {
      baseUrl: endpoints.baseUrl,
      connectionState: 'unknown',
      lastCheckedAt: nowIso(),
      statusEndpoint: endpoints.statusUrl,
      triggerEndpoint: endpoints.triggerUrl,
      ...(fallback?.helper || {}),
      ...(raw?.helper || {}),
    },
  };
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await withTimeout(fetch(url, init));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function buildUnavailableStatus(reason: string, fallback?: SyncStatus): SyncStatus {
  const endpoints = getHelperEndpoints();
  return normalizeStatus({
    ...(fallback || {}),
    message: 'Local sync helper not reachable yet.',
    helper: {
      baseUrl: endpoints.baseUrl,
      connectionState: 'unavailable',
      lastCheckedAt: nowIso(),
      statusEndpoint: endpoints.statusUrl,
      triggerEndpoint: endpoints.triggerUrl,
      source: 'local-cache',
    },
    summary: {
      notes: [
        'Next step: run a tiny local helper that bridges the browser app to sync-sidecar.',
        `Expected helper base URL: ${endpoints.baseUrl}`,
        'Recommended contract: GET /api/tradovate-sync/status and POST /api/tradovate-sync/sync.',
        'Helper should read sync-sidecar/runtime/manifests/last-sync.json and stage CSVs from /home/brendan/Downloads.',
      ],
    },
    lastError: reason,
  }, fallback);
}

export function getSyncStatus(): SyncStatus {
  return normalizeStatus(loadSyncStatus());
}

export async function refreshSyncStatus(): Promise<SyncStatus> {
  const current = loadSyncStatus();
  const endpoints = getHelperEndpoints();

  const checking = normalizeStatus({
    ...current,
    helper: {
      ...(current.helper || {}),
      baseUrl: endpoints.baseUrl,
      connectionState: 'checking',
      lastCheckedAt: nowIso(),
      statusEndpoint: endpoints.statusUrl,
      triggerEndpoint: endpoints.triggerUrl,
    },
  }, current);

  saveSyncStatus(checking);

  try {
    const helperPayload = await fetchJson(endpoints.statusUrl);
    const normalized = normalizeStatus({
      ...helperPayload,
      helper: {
        ...(helperPayload?.helper || {}),
        baseUrl: endpoints.baseUrl,
        connectionState: 'connected',
        lastCheckedAt: nowIso(),
        statusEndpoint: endpoints.statusUrl,
        triggerEndpoint: endpoints.triggerUrl,
        source: 'helper-api',
      },
    }, current);

    saveSyncStatus(normalized);
    return normalized;
  } catch (error) {
    try {
      await fetchJson(endpoints.healthUrl);
    } catch {
      const unavailable = buildUnavailableStatus(error instanceof Error ? error.message : 'Helper unavailable', current);
      saveSyncStatus(unavailable);
      return unavailable;
    }

    const degraded = normalizeStatus({
      ...current,
      helper: {
        ...(current.helper || {}),
        baseUrl: endpoints.baseUrl,
        connectionState: 'connected',
        lastCheckedAt: nowIso(),
        statusEndpoint: endpoints.statusUrl,
        triggerEndpoint: endpoints.triggerUrl,
        source: 'helper-api',
      },
      message: 'Helper is reachable but status endpoint is not ready yet.',
      summary: {
        notes: [
          'Implement GET /api/tradovate-sync/status in the local helper.',
          'Return the current sidecar/session/manifest state so the dashboard can reflect reality.',
        ],
      },
      lastError: error instanceof Error ? error.message : 'Status endpoint unavailable',
    }, current);

    saveSyncStatus(degraded);
    return degraded;
  }
}

export async function triggerSync(payload: SyncRequestPayload = {}): Promise<SyncTriggerResult> {
  const startedAt = nowIso();
  const current = loadSyncStatus();
  const endpoints = getHelperEndpoints();
  const running = normalizeStatus({
    ...current,
    phase: 'running',
    updatedAt: startedAt,
    lastRunAt: startedAt,
    message: 'Requesting sync from local helper…',
    credentialMode: current.credentialMode || 'unknown',
    summary: {
      notes: buildNotes(payload),
    },
    helper: {
      baseUrl: endpoints.baseUrl,
      ...(current.helper || {}),
      connectionState: 'checking',
      lastCheckedAt: startedAt,
      statusEndpoint: endpoints.statusUrl,
      triggerEndpoint: endpoints.triggerUrl,
    },
  }, current);

  saveSyncStatus(running);

  try {
    const helperPayload = await fetchJson(endpoints.triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const status = normalizeStatus({
      ...helperPayload,
      phase: helperPayload?.phase || 'running',
      message: helperPayload?.message || 'Sync accepted by local helper.',
      updatedAt: nowIso(),
      helper: {
        ...(helperPayload?.helper || {}),
        baseUrl: endpoints.baseUrl,
        connectionState: 'connected',
        lastCheckedAt: nowIso(),
        statusEndpoint: endpoints.statusUrl,
        triggerEndpoint: endpoints.triggerUrl,
        source: 'helper-api',
      },
      summary: helperPayload?.summary || { notes: buildNotes(payload) },
    }, running);

    saveSyncStatus(status);

    return {
      accepted: true,
      mode: 'helper-api',
      status,
      nextStep: 'Helper accepted the request. Poll status and import the staged CSV pair when ready.',
    };
  } catch (error) {
    const unavailable = buildUnavailableStatus(error instanceof Error ? error.message : 'Helper unavailable', running);
    unavailable.phase = 'idle';
    unavailable.updatedAt = nowIso();
    unavailable.message = 'Sync helper is not running yet, so Sync Now stayed local-only.';
    unavailable.summary = {
      notes: [
        ...buildNotes(payload),
        `Expected helper POST endpoint: ${endpoints.triggerUrl}`,
        'Future helper should shell into sync-sidecar, wait for runtime/manifests/last-sync.json, then trigger app-side import.',
      ],
    };

    saveSyncStatus(unavailable);

    return {
      accepted: false,
      mode: 'stub',
      status: unavailable,
      nextStep: 'Start the local helper API and point it at sync-sidecar/runtime plus /home/brendan/Downloads.',
    };
  }
}

export async function fetchLatestSyncBundle(): Promise<SyncBundleFile[]> {
  const endpoints = getHelperEndpoints();
  const payload = await fetchJson(endpoints.latestBundleUrl);
  return Array.isArray(payload?.files) ? payload.files as SyncBundleFile[] : [];
}

export function markSyncStatus(status: Partial<SyncStatus>) {
  const merged = normalizeStatus({
    ...loadSyncStatus(),
    ...status,
    updatedAt: nowIso(),
  });

  if (merged.phase === 'success') {
    merged.lastSuccessAt = merged.updatedAt;
  }

  saveSyncStatus(merged);
  return merged;
}

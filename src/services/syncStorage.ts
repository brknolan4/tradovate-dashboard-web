import type { SyncStatus } from '../types/sync';

const STORAGE_KEY = 'tradedash_sync_status';
const DEFAULT_HELPER_BASE_URL = 'http://127.0.0.1:43128';

export const defaultSyncStatus: SyncStatus = {
  phase: 'idle',
  updatedAt: null,
  message: 'Waiting for local Tradovate sync helper.',
  lastRunAt: null,
  lastSuccessAt: null,
  sessionStrategy: 'persistent-browser-first',
  credentialMode: 'unknown',
  helper: {
    baseUrl: DEFAULT_HELPER_BASE_URL,
    connectionState: 'unknown',
    lastCheckedAt: null,
    statusEndpoint: `${DEFAULT_HELPER_BASE_URL}/api/tradovate-sync/status`,
    triggerEndpoint: `${DEFAULT_HELPER_BASE_URL}/api/tradovate-sync/sync`,
  },
  summary: {
    notes: [
      'Dashboard expects a tiny localhost helper that can talk to the sync-sidecar runtime.',
      'That helper should eventually import staged CSVs copied from /home/brendan/Downloads.',
    ],
  },
};

export function loadSyncStatus(): SyncStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSyncStatus;
    return { ...defaultSyncStatus, ...JSON.parse(raw) } as SyncStatus;
  } catch {
    return defaultSyncStatus;
  }
}

export function saveSyncStatus(status: SyncStatus) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

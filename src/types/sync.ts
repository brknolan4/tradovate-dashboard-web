export type SyncPhase = 'idle' | 'running' | 'success' | 'error';
export type SyncConnectionState = 'unknown' | 'checking' | 'connected' | 'unavailable';
export type SyncTriggerMode = 'helper-api' | 'stub';

export interface SyncBundleFile {
  kind: 'fills' | 'performance' | 'cash';
  name: string;
  content: string;
  stagedPath?: string;
}

export interface SyncRunSummary {
  importedFiles?: string[];
  notes?: string[];
  inspection?: {
    ready?: boolean;
    missingRequired?: string[];
    downloadsDir?: string;
    files?: Array<{
      kind: 'fills' | 'performance' | 'cash';
      name: string;
      exists?: boolean;
      size?: number;
      modifiedAt?: string | null;
      required?: boolean;
    }>;
  };
  stagedFiles?: Array<{
    kind: 'fills' | 'performance' | 'cash';
    source: string;
    stagedPath: string;
  }>;
}

export interface SyncHelperInfo {
  baseUrl: string;
  connectionState: SyncConnectionState;
  helperVersion?: string;
  lastCheckedAt?: string | null;
  statusEndpoint?: string;
  triggerEndpoint?: string;
  source?: 'helper-api' | 'local-cache';
}

export interface SyncStatus {
  phase: SyncPhase;
  updatedAt: string | null;
  message: string;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  sessionStrategy: 'persistent-browser-first';
  credentialMode: 'session-only' | 'env-fallback' | 'unknown';
  lastError?: string;
  summary?: SyncRunSummary;
  helper?: SyncHelperInfo;
}

export interface SyncRequestPayload {
  accountHint?: string;
  source?: 'dashboard' | 'calendar' | 'manual';
}

export interface SyncTriggerResult {
  accepted: boolean;
  mode: SyncTriggerMode;
  status: SyncStatus;
  nextStep: string;
}

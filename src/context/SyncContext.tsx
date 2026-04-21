import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSyncStatus, refreshSyncStatus, triggerSync } from '../services/syncService';
import type { SyncStatus, SyncTriggerResult } from '../types/sync';

interface SyncContextType {
  syncStatus: SyncStatus;
  syncNow: (input?: { accountHint?: string; source?: 'dashboard' | 'calendar' | 'manual' }) => Promise<SyncTriggerResult>;
  refreshStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);
const POLL_INTERVAL_MS = 15000;

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatus());

  const refreshStatus = useCallback(async () => {
    const status = await refreshSyncStatus();
    setSyncStatus(status);
  }, []);

  const syncNow = useCallback(async (input = {}) => {
    const result = await triggerSync(input);
    setSyncStatus(result.status);
    return result;
  }, []);

  useEffect(() => {
    void refreshStatus();

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshStatus();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshStatus]);

  const value = useMemo(() => ({
    syncStatus,
    syncNow,
    refreshStatus,
  }), [refreshStatus, syncNow, syncStatus]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
}

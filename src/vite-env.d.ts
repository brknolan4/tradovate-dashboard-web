/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRADOVATE_SYNC_HELPER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

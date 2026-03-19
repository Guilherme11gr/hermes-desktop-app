/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HERMES_API_URL: string;
  readonly VITE_HERMES_API_KEY: string;
  readonly VITE_HERMES_TIMEOUT: string;
  readonly VITE_DEFAULT_MODEL: string;
  readonly VITE_DEBUG: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

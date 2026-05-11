/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QURAN_CLIENT_ID: string;
  readonly VITE_QURAN_AUTH_TOKEN: string;
  readonly VITE_QURAN_USER_AUTH_TOKEN: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_ALLOW_DEMO_AUTH?: string;
  readonly FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  readonly FIREBASE_SERVICE_ACCOUNT_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

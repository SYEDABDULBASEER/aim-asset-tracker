/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_ALLOW_DEMO_AUTH?: string;
  /** Comma-separated allowed domains for IT staff self-signup (e.g. contoso.com,tenant.onmicrosoft.com). */
  readonly VITE_ALLOWED_STAFF_EMAIL_DOMAINS?: string;
  /** Optional: comma-separated domains for employee portal sign-ups. Empty = any email. */
  readonly VITE_ALLOWED_EMPLOYEE_EMAIL_DOMAINS?: string;
  readonly FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  readonly FIREBASE_SERVICE_ACCOUNT_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

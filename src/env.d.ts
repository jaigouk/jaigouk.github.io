/// <reference types="astro/client" />

declare global {
  const __SITE_CONFIG__: any;
}

interface ImportMetaEnv {
  readonly GOOGLE_ANALYTICS_ID: string;
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

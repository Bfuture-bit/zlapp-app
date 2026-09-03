/// <reference types="astro/client" />

interface PublicEnv {
  readonly PUBLIC_WEEKLY_ADS_API_URL?: string;
}

interface ImportMetaEnv extends PublicEnv {}

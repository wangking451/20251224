/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_DOMAIN: string;
  readonly VITE_SHOPIFY_ACCESS_TOKEN: string;
  readonly VITE_GOOGLE_TRANSLATE_API_KEY: string;
  readonly VITE_PAYPAL_CLIENT_ID: string;
  readonly VITE_PAYPAL_MODE: 'sandbox' | 'production';
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_ADMIN_DEFAULT_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

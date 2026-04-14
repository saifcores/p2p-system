/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated Spring Boot node base URLs, e.g. http://localhost:5000,http://localhost:5001 */
  readonly VITE_P2P_NODE_URLS?: string;
  /** Desired replica count for UI status (default 3) */
  readonly VITE_TARGET_REPLICAS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

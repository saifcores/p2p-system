function parseUrlList(raw: string | undefined, fallback: string): string[] {
  const src = raw?.trim() || fallback;
  return src
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Spring Boot peer base URLs (no trailing slash). */
export const P2P_NODE_URLS = parseUrlList(
  import.meta.env.VITE_P2P_NODE_URLS,
  "http://localhost:5010,http://localhost:5011,http://localhost:5012",
);

export const TARGET_REPLICAS = Math.max(
  1,
  Number.parseInt(import.meta.env.VITE_TARGET_REPLICAS ?? "3", 10) || 3,
);

export interface HealthDto {
  status: string;
  nodeId: string;
}

export interface FileMetadataDto {
  filename: string;
  sizeBytes: number;
  sha256Hex: string;
  /** ISO-8601 from Jackson; rarely a numeric epoch in other configs */
  storedAt?: string | number;
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(baseUrl: string): Promise<HealthDto> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/health`, {
    headers: { Accept: "application/json" },
  });
  return parseJson<HealthDto>(res);
}

export async function fetchLocalFiles(
  baseUrl: string,
): Promise<FileMetadataDto[]> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/files`, {
    headers: { Accept: "application/json" },
  });
  return parseJson<FileMetadataDto[]>(res);
}

export async function fetchPeers(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/internal/peers`, {
    headers: { Accept: "application/json" },
  });
  return parseJson<string[]>(res);
}

export async function registerPeerOnNode(
  baseUrl: string,
  peerUrl: string,
): Promise<void> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/internal/peers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: peerUrl }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function removePeerOnNode(
  baseUrl: string,
  peerUrl: string,
): Promise<void> {
  const q = new URLSearchParams({ url: peerUrl });
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/internal/peers?${q}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function uploadFile(
  baseUrl: string,
  filename: string,
  body: Blob | ArrayBuffer | Uint8Array,
  replicated: boolean,
): Promise<FileMetadataDto> {
  const enc = encodeURIComponent(filename);
  const payload: BodyInit =
    body instanceof Blob ? body : new Blob([body as BlobPart]);
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/files/${enc}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Replicated": replicated ? "true" : "false",
    },
    body: payload,
  });
  return parseJson<FileMetadataDto>(res);
}

export async function downloadFile(
  baseUrl: string,
  filename: string,
): Promise<Blob> {
  const enc = encodeURIComponent(filename);
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/files/${enc}`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.blob();
}

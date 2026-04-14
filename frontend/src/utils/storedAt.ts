/** Spring returns ISO-8601 strings; normalize edge cases for the UI. */
export function normalizeStoredAt(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

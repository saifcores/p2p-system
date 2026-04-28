/** Langue et locale par défaut de l’interface (textes affichés et formats). */
export const APP_LOCALE = "fr-FR" as const;

/** Heure locale pour l’affichage dans l’UI. */
export function formatTimeUi(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleTimeString(APP_LOCALE, options);
}

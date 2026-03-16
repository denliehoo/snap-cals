/** Returns local date as YYYY-MM-DD string (avoids UTC shift from toISOString). */
export function toLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses a YYYY-MM-DD string as local midnight (not UTC). */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

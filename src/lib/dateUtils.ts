import { format, parseISO } from "date-fns";

/**
 * Format a date string or Date to British format DD/MM/YYYY
 */
export function formatDateGB(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(dateStr);
  }
}

/**
 * Format a date string to DD/MM/YYYY HH:mm:ss
 */
export function formatDateTimeGB(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(d, "dd/MM/yyyy HH:mm:ss");
  } catch {
    return String(dateStr);
  }
}
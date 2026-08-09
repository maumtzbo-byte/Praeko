/** Shared by /dashboard and the content detail modal — a metric the
 * platform never returned means "unknown", not "zero engagement", so
 * null always renders as "—", never "0". */
export function formatInsightNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("es-MX");
}

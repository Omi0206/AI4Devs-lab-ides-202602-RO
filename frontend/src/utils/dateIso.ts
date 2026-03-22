/** Convert HTML date input (YYYY-MM-DD) to an ISO date-time string for the API. */
export function dateInputToIsoDateTime(value: string): string {
  const trimmed = value.trim();
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  return d.toISOString();
}

export function parseUserDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

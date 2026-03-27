/**
 * When the remote DB is behind local migrations, PostgREST returns 400 with
 * Postgres error code 42703 (undefined_column). Use these helpers to retry
 * without new columns/filters so the app keeps working until migrations run.
 */
export function isUndefinedColumnError(error: unknown, columnHint?: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  if (e.code !== '42703') return false;
  if (!columnHint) return true;
  return typeof e.message === 'string' && e.message.includes(columnHint);
}

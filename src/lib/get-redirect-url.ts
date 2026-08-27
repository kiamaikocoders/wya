/**
 * Allowed redirect origins for auth (e.g. password reset).
 * Email clients cannot open custom schemes, so this always points at the HTTPS
 * bridge page (exact Supabase allow-list path, no query string).
 */
import { PUBLIC_SITE_ORIGIN } from '@/lib/site-origins';

const DEFAULT_ORIGINS = [
  'https://www.wya254.com',
  'https://wya254.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
];

const ALLOWED_ORIGINS = (import.meta.env.VITE_ALLOWED_REDIRECT_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function allowedOrigins(): string[] {
  return ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ORIGINS;
}

/** Exact path listed in Supabase Auth redirect URLs. Do not append query params. */
export const PASSWORD_RESET_CALLBACK_PATH = '/auth/confirm';

export function getAllowedPasswordResetRedirectUrl(): string {
  const canonical = `${PUBLIC_SITE_ORIGIN}${PASSWORD_RESET_CALLBACK_PATH}`;
  if (typeof window === 'undefined') return canonical;
  const origin = window.location.origin;
  if (!allowedOrigins().includes(origin)) return canonical;
  return `${origin}${PASSWORD_RESET_CALLBACK_PATH}`;
}

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CircleSlash,
  CloudOff,
  Lock,
  Search,
  Settings,
} from 'lucide-react';
import { SUPPORT_EMAIL } from '@/legal/legal-page-content';

export type StatusVariant =
  | 'not_found'
  | 'server_error'
  | 'offline'
  | 'maintenance'
  | 'forbidden'
  | 'empty_results';

export type StatusCta =
  | { kind: 'link'; label: string; to: string }
  | { kind: 'action'; label: string; action: 'retry' | 'reload' | 'clear_filters' | 'notify' }
  | { kind: 'mailto'; label: string; href: string };

export type StatusContent = {
  icon: LucideIcon;
  /** Large display code (404 / 500 / 403). Omitted for offline / maintenance / empty. */
  code?: string;
  title: string;
  body: string;
  meta: string;
  /** Icon + ambient glow accent (hex). */
  accent: string;
  primary: StatusCta;
  secondary: StatusCta;
};

const ORANGE = '#ff6b35';
const GOLD = '#d29922';

export const STATUS_CONTENT: Record<StatusVariant, StatusContent> = {
  not_found: {
    icon: Search,
    code: '404',
    title: "Oops! We couldn't find that page",
    body: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
    meta: 'Error code · 404',
    accent: ORANGE,
    primary: { kind: 'link', label: 'Back to Home', to: '/' },
    secondary: { kind: 'link', label: 'Browse events', to: '/events' },
  },
  server_error: {
    icon: AlertTriangle,
    code: '500',
    title: 'Something went wrong on our end',
    body: 'We hit an unexpected error. Our team has been notified — please try again in a moment.',
    meta: 'Error code · 500',
    accent: ORANGE,
    primary: { kind: 'action', label: 'Try again', action: 'retry' },
    secondary: { kind: 'link', label: 'Back to Home', to: '/' },
  },
  offline: {
    icon: CloudOff,
    title: "You're offline",
    body: "Check your connection and try again. Saved tickets and chats will sync when you're back online.",
    meta: 'No network connection',
    accent: ORANGE,
    primary: { kind: 'action', label: 'Retry', action: 'reload' },
    secondary: { kind: 'link', label: 'Back to Home', to: '/' },
  },
  maintenance: {
    icon: Settings,
    title: "We'll be right back",
    body: 'WYA is undergoing a short maintenance window. Thanks for your patience — the night will wait.',
    meta: 'Estimated downtime · ~15 min',
    accent: GOLD,
    primary: {
      kind: 'mailto',
      label: 'Notify me',
      href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Notify me when WYA is back')}`,
    },
    secondary: { kind: 'link', label: 'Back to Home', to: '/' },
  },
  forbidden: {
    icon: Lock,
    code: '403',
    title: "You don't have access",
    body: 'This area is restricted. Sign in with an authorized account, or head back to the public site.',
    meta: 'Error code · 403',
    accent: ORANGE,
    primary: { kind: 'link', label: 'Log in', to: '/login' },
    secondary: { kind: 'link', label: 'Back to Home', to: '/' },
  },
  empty_results: {
    icon: CircleSlash,
    title: 'No events match',
    body: "Try a different city, date, or vibe. Or clear filters and explore what's on tonight.",
    meta: '0 results',
    accent: ORANGE,
    primary: { kind: 'action', label: 'Clear filters', action: 'clear_filters' },
    secondary: { kind: 'link', label: 'Explore vibes', to: '/discover' },
  },
};

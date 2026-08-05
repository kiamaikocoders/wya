/**
 * Figma redesign tokens for the authenticated light-web companion.
 * Light: Desktop · * / Light · Dark: Desktop · * / Dark
 */
export const companion = {
  page: 'bg-[#f6f8fa] text-[#0d1117] dark:bg-[#0d1117] dark:text-[#e6edf3]',
  surface: 'bg-white dark:bg-[#161b22]',
  surfaceMuted: 'bg-[#f6f8fa] dark:bg-[#1c2233]',
  border: 'border-[#d0d7dd] dark:border-[#30363d]',
  borderAlt: 'border-[#d0d7de] dark:border-[#30363d]',
  heading: 'text-[#0d1117] dark:text-[#e6edf3]',
  muted: 'text-[#656d76] dark:text-[#8b949e]',
  accent: 'text-[#ff6b35]',
  accentBtn: 'bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90',
  iconBtn:
    'border border-[#d0d7dd] dark:border-[#30363d] bg-transparent text-[#0d1117] dark:text-[#e6edf3]',
  navIdle: 'font-medium text-[#656d76] hover:text-[#0d1117] dark:text-[#8b949e] dark:hover:text-[#e6edf3]',
  navActive: 'font-semibold text-[#ff6b35]',
  header:
    'border-b border-[#d0d7dd] bg-[#f6f8fa] dark:border-[#30363d] dark:bg-[#0d1117]',
  navCluster:
    'rounded-lg border border-[#d0d7dd] bg-[#f6f8fa] dark:border-[#30363d] dark:bg-[#1c2233]',
  input:
    'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#656d76] focus-visible:ring-[#ff6b35] dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] dark:placeholder:text-[#8b949e]',
  card:
    'rounded-xl border border-[#d0d7dd] bg-white dark:border-[#30363d] dark:bg-[#161b22]',
  footerShell: 'border-t border-[#d0d7dd] dark:border-[#30363d]',
  bottomNav:
    'border-t border-[#d0d7dd] bg-[#f6f8fa]/95 dark:border-[#30363d] dark:bg-[#0d1117]/95',
  spinner: 'border-[#ff6b35]',
} as const;

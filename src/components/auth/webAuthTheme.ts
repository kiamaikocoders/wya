import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/** Shared tokens for Figma 14 — Web Auth (light + dark). */
export function useWebAuthTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    pageBg: isDark ? 'bg-[#0d1117]' : 'bg-white',
    panelBg: isDark ? 'bg-[#0d1117]' : 'bg-white',
    card: cn(
      'rounded-2xl border p-8 shadow-[0px_16px_32px_0px_rgba(0,0,0,0.4)]',
      isDark
        ? 'border-[#21262d] bg-[#161b22]'
        : 'border-[#e8ecf0] bg-[#f6f8fa] shadow-[0px_16px_32px_0px_rgba(0,0,0,0.08)]'
    ),
    overlayCard: cn(
      'w-full max-w-[440px] rounded-[18px] border p-9 shadow-[0px_24px_48px_0px_rgba(0,0,0,0.45)]',
      isDark
        ? 'border-[#21262d] bg-[#161b22]'
        : 'border-[#e8ecf0] bg-[#f6f8fa] shadow-[0px_24px_48px_0px_rgba(0,0,0,0.12)]'
    ),
    heading: isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]',
    muted: isDark ? 'text-[#8b949e]' : 'text-[#5c6570]',
    label: cn(
      'text-[11px] font-semibold uppercase tracking-[1.5px]',
      isDark ? 'text-[#8b949e]' : 'text-[#5c6570]'
    ),
    input: cn(
      'h-[45px] w-full rounded-[10px] border px-4 text-sm outline-none transition-colors',
      'focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20',
      isDark
        ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
        : 'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#8b949e]'
    ),
    inset: isDark ? 'bg-[#1c2333]' : 'bg-[#eef1f4]',
    outlineBtn: cn(
      'flex h-[46px] w-full items-center justify-center rounded-[10px] border-[1.5px] text-[15px] font-semibold transition-colors',
      isDark
        ? 'border-[#21262d] text-[#e6edf3] hover:bg-white/5'
        : 'border-[#d0d7de] text-[#0d1117] hover:bg-black/5'
    ),
    primaryBtn:
      'flex h-[46px] w-full items-center justify-center rounded-[10px] bg-[#ff6b35] text-[15px] font-bold text-white transition-colors hover:bg-[#ff6b35]/90 disabled:cursor-not-allowed disabled:opacity-70',
    accentLink: 'font-semibold text-[#ff6b35] hover:underline',
    divider: isDark ? 'bg-[#21262d]' : 'bg-[#d0d7de]',
  };
}

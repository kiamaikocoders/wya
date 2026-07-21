import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/** Pill control for light/dark — works on auth, legal, and general pages. */
export function ModeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors',
        isDark
          ? 'border-white/20 bg-black/40 text-white hover:bg-black/55'
          : 'border-black/10 bg-white/80 text-[#1f2328] hover:bg-white',
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4 text-[#ff6b35]" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

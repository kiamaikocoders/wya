import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { cn } from '@/lib/utils';

/** Figma-style pill control for admin light/dark. */
export function AdminThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-[hsl(var(--admin-surface))] text-foreground transition-colors hover:bg-[hsl(var(--admin-surface-2))]',
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

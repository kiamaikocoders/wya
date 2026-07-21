import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type GetAppModalProps = {
  open: boolean;
  onClose: () => void;
};

const APP_STORE_URL = 'https://apps.apple.com';
const PLAY_STORE_URL = '/download';

export function GetAppModal({ open, onClose }: GetAppModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(7,10,15,0.72)] p-4 sm:p-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-app-title"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex w-full max-w-[607px] flex-col gap-8 overflow-hidden rounded-[28px] border p-6 shadow-[0px_24px_48px_0px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:gap-10 sm:p-10',
          isDark ? 'border-[#1f2937] bg-[#12161e]' : 'border-[#e5e7eb] bg-white'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col items-center gap-3">
          <img
            src="/landing/phone.jpg"
            alt="WYA app on phone"
            className="h-[280px] w-[140px] rounded-[28px] object-cover sm:h-[440px] sm:w-[220px]"
          />
          <p
            className={cn(
              'text-center text-[13px] font-medium',
              isDark ? 'text-[#9aa3b2]' : 'text-[#5c6570]'
            )}
          >
            WYA on your phone
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[1.5px] text-[#f97316]">DOWNLOAD</p>
              <h2
                id="get-app-title"
                className={cn(
                  'mt-2 text-[28px] font-bold leading-tight',
                  isDark ? 'text-white' : 'text-[#0d1117]'
                )}
              >
                Get the WYA app
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(
                'inline-flex rounded-[18px] p-2.5 transition-colors',
                isDark
                  ? 'bg-[#1f2937] text-[#9aa3b2] hover:bg-[#2a3441]'
                  : 'bg-[#f3f4f6] text-[#5c6570] hover:bg-[#e5e7eb]'
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className={cn('text-[15px] leading-[22px]', isDark ? 'text-[#9aa3b2]' : 'text-[#5c6570]')}>
            Scan the QR code with your phone camera to download for iOS or Android.
          </p>

          <div
            className={cn(
              'flex flex-col items-center gap-3 rounded-2xl border p-5',
              isDark ? 'border-[#1f2937] bg-[#0a0e14]' : 'border-[#e5e7eb] bg-[#f8fafc]'
            )}
          >
            <img
              src="/landing/qr.png"
              alt="Download QR code"
              className="size-[168px] rounded-lg object-cover"
            />
            <p className={cn('text-xs font-medium', isDark ? 'text-[#9aa3b2]' : 'text-[#5c6570]')}>
              Point your camera here
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#0d1117] py-2.5 pl-3.5 pr-[18px]"
            >
              <svg viewBox="0 0 24 24" className="size-7 shrink-0 fill-white" aria-hidden>
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.98 2.94 12.44 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              <span className="flex flex-col leading-none">
                <span className="text-[10px] text-[#9aa3b2]">Download on the</span>
                <span className="text-sm font-semibold text-white">App Store</span>
              </span>
            </a>
            <Link
              to={PLAY_STORE_URL}
              onClick={onClose}
              className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#0d1117] py-2.5 pl-3.5 pr-[18px]"
            >
              <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
                <path fill="#EA4335" d="M3.6 2.3 13.4 12 3.6 21.7c-.4-.3-.6-.7-.6-1.2V3.5c0-.5.2-.9.6-1.2Z" />
                <path fill="#FBBC04" d="m13.4 12 2.5-2.5 4.9 2.8c.7.4.7 1.4 0 1.8l-4.9 2.8L13.4 12Z" />
                <path fill="#4285F4" d="M13.4 12 3.6 2.3c.3-.2.6-.3 1-.3.4 0 .8.1 1.1.3L15.9 9.5 13.4 12Z" />
                <path fill="#34A853" d="M13.4 12 15.9 14.5 5.7 21.7c-.3.2-.7.3-1.1.3-.4 0-.7-.1-1-.3L13.4 12Z" />
              </svg>
              <span className="flex flex-col leading-none">
                <span className="text-[10px] text-[#9aa3b2]">Get it on</span>
                <span className="text-sm font-semibold text-white">Google Play</span>
              </span>
            </Link>
          </div>

          <p className={cn('text-xs', isDark ? 'text-[#9aa3b2]' : 'text-[#5c6570]')}>
            Available on iOS 15+ and Android 10+
          </p>
        </div>
      </div>
    </div>
  );
}

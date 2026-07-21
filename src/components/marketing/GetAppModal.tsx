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
              className="inline-flex items-center rounded-[10px] bg-[#0d1117] py-2.5 pl-4 pr-[18px]"
            >
              <span className="flex flex-col leading-none">
                <span className="text-[10px] text-[#9aa3b2]">Download on the</span>
                <span className="text-sm font-semibold text-white">App Store</span>
              </span>
            </a>
            <Link
              to={PLAY_STORE_URL}
              onClick={onClose}
              className="inline-flex items-center rounded-[10px] bg-[#0d1117] py-2.5 pl-4 pr-[18px]"
            >
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

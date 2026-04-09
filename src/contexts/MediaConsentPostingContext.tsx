import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import {
  getPostingBlockReason,
  type PostingBlockReason,
} from '@/lib/legal-consent-status';
import { MediaConsentForPostingDialog } from '@/components/legal/MediaConsentForPostingDialog';
import { toast } from 'sonner';
import {
  isMediaConsentPostingError,
  LegalReconsentRequiredForPostingError,
} from '@/lib/posting-guard';

type PostingAction = () => void | Promise<void>;

interface MediaConsentPostingContextValue {
  /**
   * Runs `action` if the user may post; otherwise shows legal/media prompt or toast.
   * Use for forum posts, stories, comments, etc.
   */
  runWithPostingConsent: (action: PostingAction) => void;
  postingBlockReason: PostingBlockReason | null;
}

const MediaConsentPostingContext = createContext<
  MediaConsentPostingContextValue | undefined
>(undefined);

export function MediaConsentPostingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingAction = useRef<PostingAction | null>(null);

  const { data: profile, isPending: isProfilePending } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user!.id),
    enabled: Boolean(user?.id && !loading),
  });

  const postingBlockReason: PostingBlockReason | null = !user?.id
    ? 'not_signed_in'
    : isProfilePending
      ? null
      : getPostingBlockReason(profile ?? null);

  const runWithPostingConsent = useCallback(
    (action: PostingAction) => {
      if (!user?.id) {
        toast.error('You must be signed in to post.');
        return;
      }

      if (isProfilePending) {
        void (async () => {
          try {
            await action();
          } catch (e) {
            if (isMediaConsentPostingError(e)) {
              pendingAction.current = action;
              setDialogOpen(true);
              return;
            }
            console.error(e);
          }
        })();
        return;
      }

      const reason = getPostingBlockReason(profile ?? null);

      if (reason === 'media_consent_required') {
        pendingAction.current = action;
        setDialogOpen(true);
        return;
      }
      if (reason === 'legal_reconsent_required') {
        toast.error('Please complete the updated terms, privacy, and consent steps shown on screen first.');
        return;
      }
      if (reason === 'not_signed_in') {
        toast.error('You must be signed in to post.');
        return;
      }

      void (async () => {
        try {
          await action();
        } catch (e) {
          if (isMediaConsentPostingError(e)) {
            pendingAction.current = action;
            setDialogOpen(true);
            return;
          }
          if (e instanceof LegalReconsentRequiredForPostingError) {
            toast.error('Please complete the updated legal consent before posting.');
            return;
          }
          console.error(e);
        }
      })();
    },
    [profile, user?.id, isProfilePending],
  );

  const onConsented = () => {
    const fn = pendingAction.current;
    pendingAction.current = null;
    void (async () => {
      await queryClient.refetchQueries({ queryKey: ['userProfile', user?.id] });
      if (fn) await Promise.resolve(fn());
    })();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) pendingAction.current = null;
    setDialogOpen(open);
  };

  return (
    <MediaConsentPostingContext.Provider
      value={{ runWithPostingConsent, postingBlockReason }}
    >
      {children}
      <MediaConsentForPostingDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onConsented={onConsented}
      />
    </MediaConsentPostingContext.Provider>
  );
}

export function useMediaConsentPosting(): MediaConsentPostingContextValue {
  const ctx = useContext(MediaConsentPostingContext);
  if (!ctx) {
    throw new Error('useMediaConsentPosting must be used within MediaConsentPostingProvider');
  }
  return ctx;
}

/** Optional: use where provider may be absent (e.g. tests). */
export function useMediaConsentPostingSafe(): MediaConsentPostingContextValue | null {
  return useContext(MediaConsentPostingContext) ?? null;
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/user-service';
import { consentService } from '@/lib/consent-service';
import { MEDIA_CONSENT_VERSION } from '@/legal/policy-versions';

interface MediaConsentForPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after profile + audit update succeed */
  onConsented: () => void;
}

export function MediaConsentForPostingDialog({
  open,
  onOpenChange,
  onConsented,
}: MediaConsentForPostingDialogProps) {
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setAccept(false);
    onOpenChange(next);
  };

  const submit = async () => {
    if (!accept) {
      toast.error('Please confirm that you consent, or cancel.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not signed in');

      await userService.updateProfile({ media_consent: true });
      await consentService.logConsent({
        userId: user.id,
        consentType: 'media',
        granted: true,
        policyVersion: MEDIA_CONSENT_VERSION,
      });
      toast.success('Media consent saved. You can post now.');
      setAccept(false);
      onConsented();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Could not save consent. Try again or use Settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Media consent required to post</DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              You chose not to consent to promotional use of photos, video, or audio. To keep posting on
              WYA (forum posts, stories, and comments), you need to accept the current{' '}
              <Link to="/media-consent" className="text-primary underline" target="_blank" rel="noreferrer">
                Media consent
              </Link>{' '}
              (version {MEDIA_CONSENT_VERSION}).
            </p>
            <p className="text-sm text-muted-foreground">
              You can change this later in Settings under consent preferences.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 py-2">
          <Checkbox
            id="posting-media-consent"
            checked={accept}
            onCheckedChange={(c) => setAccept(c === true)}
            className="mt-1"
          />
          <label htmlFor="posting-media-consent" className="text-sm leading-snug cursor-pointer">
            I consent to the collection and use of my image, video, and/or audio recordings for
            promotional and marketing purposes, as described in the Media consent form.
          </label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Not now
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting || !accept}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Accept and continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

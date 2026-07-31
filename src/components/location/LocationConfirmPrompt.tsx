import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * One-time toast for users with seeded profile locations.
 * Keep → accept seeded pin + consent. Update → Settings location section.
 */
export function LocationConfirmPrompt() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const shownForUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;
    if (shownForUser.current === user.id) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('location, location_confirm_needed, is_ghost')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled || error || !data) return;
      if (data.is_ghost) return;
      if (!data.location_confirm_needed) return;

      shownForUser.current = user.id;
      const place = (data.location || '').trim() || 'your area';

      const clearPrompt = async (opts?: { keep?: boolean }) => {
        const updates: Record<string, unknown> = {
          location_confirm_needed: false,
          updated_at: new Date().toISOString(),
        };
        if (opts?.keep) {
          updates.location_consent = true;
          updates.location_consent_at = new Date().toISOString();
          updates.location_source = 'user';
        }
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (updateError) throw updateError;
      };

      toast.message('Confirm your location', {
        description: `We set your area to ${place}. Keep it, or update it now — you can change this anytime in Settings.`,
        duration: 20000,
        action: {
          label: 'Update',
          onClick: () => {
            void clearPrompt()
              .then(() => navigate('/settings?focus=location'))
              .catch(() => toast.error('Could not open location settings'));
          },
        },
        cancel: {
          label: 'Keep',
          onClick: () => {
            void clearPrompt({ keep: true }).catch(() =>
              toast.error('Could not save location preference')
            );
          },
        },
        onDismiss: () => {
          void clearPrompt().catch(() => undefined);
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, user?.id, navigate]);

  return null;
}

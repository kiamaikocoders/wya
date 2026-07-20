import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  AdminPrimaryPill,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { adminPlatformService, type SystemSettingsMap } from '@/lib/admin-platform-service';

function unwrapJsonValue(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /system_settings|does not exist|schema cache|Admin only/i.test(msg);
}

/** Marketplace fee / window / kill switch — lives on Marketplace, not System. */
const MarketplaceSettingsCard: React.FC = () => {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminPlatformService.getSystemSettings(),
    retry: false,
  });

  const settings: SystemSettingsMap = settingsQuery.data ?? {};
  const fee = Number(unwrapJsonValue(settings['marketplace.fee_per_ticket_kes']?.value) ?? 100);
  const closeHours = Number(
    unwrapJsonValue(settings['marketplace.transfer_close_hours']?.value) ?? 12
  );
  const marketplaceEnabled = Boolean(
    unwrapJsonValue(settings['marketplace.enabled']?.value) ?? true
  );

  const [feeDraft, setFeeDraft] = useState('');
  const [hoursDraft, setHoursDraft] = useState('');

  useEffect(() => {
    setFeeDraft(String(fee));
    setHoursDraft(String(closeHours));
  }, [fee, closeHours]);

  const schemaMissing = useMemo(
    () => isSchemaMissing(settingsQuery.error),
    [settingsQuery.error]
  );

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminPlatformService.upsertSystemSetting(key, value),
    onSuccess: () => {
      toast.success('Saved');
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (schemaMissing) return null;

  return (
    <AdminSectionPanel title="Marketplace settings">
      <div className="space-y-[18px]">
        <div className="flex items-center gap-4 rounded-[14px] bg-[hsl(var(--admin-surface))] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Marketplace enabled</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kill switch for listings & claims
            </p>
          </div>
          <Switch
            checked={marketplaceEnabled}
            disabled={saveMutation.isPending}
            onCheckedChange={(v) =>
              saveMutation.mutate({ key: 'marketplace.enabled', value: v })
            }
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <label className="flex w-full flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Fee per ticket (KES)</span>
          <div className="flex h-[52px] items-center gap-3 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5">
            <input
              type="number"
              min={0}
              value={feeDraft}
              onChange={(e) => setFeeDraft(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
            />
            <AdminPrimaryPill
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  key: 'marketplace.fee_per_ticket_kes',
                  value: Number(feeDraft) || 0,
                })
              }
            >
              Save
            </AdminPrimaryPill>
          </div>
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Close (hours before start)
          </span>
          <div className="flex h-[52px] items-center gap-3 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5">
            <input
              type="number"
              min={1}
              value={hoursDraft}
              onChange={(e) => setHoursDraft(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
            />
            <AdminPrimaryPill
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  key: 'marketplace.transfer_close_hours',
                  value: Number(hoursDraft) || 12,
                })
              }
            >
              Save
            </AdminPrimaryPill>
          </div>
        </label>
      </div>
    </AdminSectionPanel>
  );
};

export default MarketplaceSettingsCard;

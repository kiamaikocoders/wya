import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

/** Marketplace fee / window / kill switch — lives on Marketplace, not System (Agribeta-style split). */
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
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (settingsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (schemaMissing) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4" /> Marketplace settings
        </CardTitle>
        <CardDescription>
          Fee, transfer window, and kill switch for ticket transfers.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between gap-4 md:col-span-3 lg:col-span-1">
          <div>
            <Label>Enabled</Label>
            <p className="text-xs text-muted-foreground">Kill switch for listings & claims</p>
          </div>
          <Switch
            checked={marketplaceEnabled}
            disabled={saveMutation.isPending}
            onCheckedChange={(v) =>
              saveMutation.mutate({ key: 'marketplace.enabled', value: v })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mkt-fee">Fee per ticket (KES)</Label>
          <div className="flex gap-2">
            <Input
              id="mkt-fee"
              type="number"
              min={0}
              value={feeDraft}
              onChange={(e) => setFeeDraft(e.target.value)}
            />
            <Button
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  key: 'marketplace.fee_per_ticket_kes',
                  value: Number(feeDraft) || 0,
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mkt-hours">Close (hours before start)</Label>
          <div className="flex gap-2">
            <Input
              id="mkt-hours"
              type="number"
              min={1}
              value={hoursDraft}
              onChange={(e) => setHoursDraft(e.target.value)}
            />
            <Button
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  key: 'marketplace.transfer_close_hours',
                  value: Number(hoursDraft) || 12,
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketplaceSettingsCard;

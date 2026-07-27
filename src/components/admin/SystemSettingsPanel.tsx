import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, HardDrive, Loader2, Mail, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminKpiTile,
  AdminPageShell,
  AdminRefreshButton,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import {
  adminPlatformService,
  type AdminSystemHealth,
  type SystemHealthStatus,
  type SystemSettingsMap,
} from '@/lib/admin-platform-service';

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

function toneFor(status: SystemHealthStatus | string): 'green' | 'orange' | 'red' | 'muted' {
  if (status === 'Healthy') return 'green';
  if (
    status === 'Degraded' ||
    status === 'Not configured' ||
    status === 'Auth SMTP only' ||
    status === 'Not migrated'
  ) {
    return 'orange';
  }
  if (status === 'Error') return 'red';
  return 'muted';
}

/** System only: health + general + platform switches. Email / Audit / Notifications are sibling pages. */
const SystemSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminPlatformService.getSystemSettings(),
    retry: false,
  });
  const healthQuery = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminPlatformService.getSystemHealth(),
    retry: false,
  });

  const settings: SystemSettingsMap = settingsQuery.data ?? {};
  const maintenance = Boolean(
    unwrapJsonValue(settings['platform.maintenance_mode']?.value) ?? false
  );
  const registrationOpen = Boolean(
    unwrapJsonValue(settings['platform.registration_open']?.value) ?? true
  );
  const supportEmail = String(
    unwrapJsonValue(settings['platform.support_email']?.value) ?? 'support@wyakenya.com'
  ).replace(/^"|"$/g, '');
  const refundsEnabled = Boolean(
    unwrapJsonValue(settings['tickets.refunds_enabled']?.value) ?? true
  );
  const siteName = String(
    unwrapJsonValue(settings['platform.site_name']?.value) ?? 'WYA'
  ).replace(/^"|"$/g, '');
  const siteUrl = String(
    unwrapJsonValue(settings['platform.site_url']?.value) ?? 'https://www.wya254.com'
  ).replace(/^"|"$/g, '');

  const [emailDraft, setEmailDraft] = useState('');
  const [siteNameDraft, setSiteNameDraft] = useState('');
  const [siteUrlDraft, setSiteUrlDraft] = useState('');

  useEffect(() => {
    setEmailDraft(supportEmail);
    setSiteNameDraft(siteName);
    setSiteUrlDraft(siteUrl);
  }, [supportEmail, siteName, siteUrl]);

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminPlatformService.upsertSystemSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const schemaMissing = useMemo(
    () => isSchemaMissing(settingsQuery.error),
    [settingsQuery.error]
  );

  const health: AdminSystemHealth | undefined = healthQuery.data;

  return (
    <AdminPageShell
      title="System"
      subtitle="Configure settings · monitor health · manage risk"
      icon={Settings2}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => healthQuery.refetch()}
            disabled={healthQuery.isFetching}
          >
            {healthQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Run checks
          </Button>
          <AdminRefreshButton
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
              queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
            }}
          />
        </>
      }
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Platform tables not available</AlertTitle>
          <AlertDescription>
            Apply <code>admin_superadmin_platform</code> once the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {healthQuery.isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Health checks unavailable</AlertTitle>
          <AlertDescription>
            Deploy <code>admin-system</code>.{' '}
            {adminPlatformService.formatError(healthQuery.error, 'Request failed')}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminKpiTile
          label="Database"
          value={health?.health.database ?? (healthQuery.isError ? 'Error' : '—')}
          hint={
            health?.metrics?.dbLatencyMs != null
              ? `Latency ${health.metrics.dbLatencyMs}ms`
              : 'Latency —'
          }
          tone={toneFor(health?.health.database ?? '—')}
        />
        <AdminKpiTile
          label="Auth"
          value={health?.health.auth ?? (healthQuery.isError ? 'Error' : '—')}
          hint="Supabase Auth"
          tone={toneFor(health?.health.auth ?? '—')}
        />
        <AdminKpiTile
          label="Storage"
          value={health?.health.storage ?? (healthQuery.isError ? 'Error' : '—')}
          hint="Buckets ok"
          tone={toneFor(health?.health.storage ?? '—')}
        />
        <AdminKpiTile
          label="Email"
          value={health?.health.email ?? (healthQuery.isError ? 'Error' : '—')}
          hint="Check Resend"
          tone={toneFor(health?.health.email ?? '—')}
        />
      </div>

      {health?.serverStatus ? (
        <p className="text-sm text-muted-foreground">
          {health.serverStatus}
          {health.metrics?.runtime ? ` · ${health.metrics.runtime}` : ''}
        </p>
      ) : null}

      {settingsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminSectionPanel
            title="General settings"
            description="Persisted in Supabase · shared for the superadmin."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site name</Label>
                <div className="flex gap-2">
                  <Input
                    id="siteName"
                    value={siteNameDraft}
                    onChange={(e) => setSiteNameDraft(e.target.value)}
                  />
                  <Button
                    disabled={saveMutation.isPending || schemaMissing}
                    onClick={() =>
                      saveMutation.mutate({
                        key: 'platform.site_name',
                        value: siteNameDraft.trim() || 'WYA',
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="siteUrl"
                    value={siteUrlDraft}
                    onChange={(e) => setSiteUrlDraft(e.target.value)}
                  />
                  <Button
                    disabled={saveMutation.isPending || schemaMissing}
                    onClick={() =>
                      saveMutation.mutate({
                        key: 'platform.site_url',
                        value: siteUrlDraft.trim(),
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support">Support email</Label>
                <div className="flex gap-2">
                  <Input
                    id="support"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                  />
                  <Button
                    disabled={saveMutation.isPending || schemaMissing}
                    onClick={() =>
                      saveMutation.mutate({
                        key: 'platform.support_email',
                        value: emailDraft.trim(),
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </AdminSectionPanel>

          <AdminSectionPanel
            title="Platform switches"
            description="Operational kill switches for the product."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" /> Maintenance mode
                  </Label>
                  <p className="text-xs text-muted-foreground">Banner for non-admins</p>
                </div>
                <Switch
                  checked={maintenance}
                  disabled={saveMutation.isPending || schemaMissing}
                  onCheckedChange={(v) =>
                    saveMutation.mutate({ key: 'platform.maintenance_mode', value: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <div>
                  <Label>Registration open</Label>
                  <p className="text-xs text-muted-foreground">Allow new signups</p>
                </div>
                <Switch
                  checked={registrationOpen}
                  disabled={saveMutation.isPending || schemaMissing}
                  onCheckedChange={(v) =>
                    saveMutation.mutate({ key: 'platform.registration_open', value: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Ticket refunds enabled</Label>
                  <p className="text-xs text-muted-foreground">Admin cancel / refund tooling</p>
                </div>
                <Switch
                  checked={refundsEnabled}
                  disabled={saveMutation.isPending || schemaMissing}
                  onCheckedChange={(v) =>
                    saveMutation.mutate({ key: 'tickets.refunds_enabled', value: v })
                  }
                />
              </div>
            </div>
          </AdminSectionPanel>

          <AdminSectionPanel
            title="Related"
            description="Email, notifications, and audit live on sibling admin pages."
            className="lg:col-span-2"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild variant="outline" className="h-auto justify-start gap-3 px-4 py-3">
                <Link to="/admin/communications">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">Email / Resend</span>
                    <span className="block text-xs text-muted-foreground">SMTP, from-address, test send</span>
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 px-4 py-3">
                <Link to="/admin/notifications">
                  <Settings2 className="h-4 w-4 shrink-0" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">Notifications</span>
                    <span className="block text-xs text-muted-foreground">Push / inbox ops</span>
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 px-4 py-3">
                <Link to="/admin/audit">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">Audit log</span>
                    <span className="block text-xs text-muted-foreground">Privileged actions</span>
                  </span>
                </Link>
              </Button>
            </div>
          </AdminSectionPanel>
        </div>
      )}
    </AdminPageShell>
  );
};

export default SystemSettingsPanel;

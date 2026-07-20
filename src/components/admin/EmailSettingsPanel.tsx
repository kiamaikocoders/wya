import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Database, Loader2, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminPageShell, AdminSectionPanel } from '@/components/admin/AdminPageShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminPlatformService,
  type AdminEmailStatus,
  type AdminSystemHealth,
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

const EmailSettingsPanel: React.FC = () => {
  const { user } = useAuth();
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
  const emailStatusQuery = useQuery({
    queryKey: ['admin-email-status'],
    queryFn: () => adminPlatformService.getEmailStatus(),
    retry: false,
  });

  const settings: SystemSettingsMap = settingsQuery.data ?? {};
  const fromEmail = String(
    unwrapJsonValue(settings['email.from_email']?.value) ?? 'team@wya254.com'
  ).replace(/^"|"$/g, '');
  const fromName = String(
    unwrapJsonValue(settings['email.from_name']?.value) ?? 'WYA'
  ).replace(/^"|"$/g, '');
  const smtpHost = String(
    unwrapJsonValue(settings['email.smtp_host']?.value) ?? 'smtp.resend.com'
  ).replace(/^"|"$/g, '');
  const smtpPort = Number(unwrapJsonValue(settings['email.smtp_port']?.value) ?? 465);
  const smtpUser = String(
    unwrapJsonValue(settings['email.smtp_user']?.value) ?? 'resend'
  ).replace(/^"|"$/g, '');
  const emailNotifications = Boolean(
    unwrapJsonValue(settings['email.notifications_enabled']?.value) ?? true
  );

  const [fromEmailDraft, setFromEmailDraft] = useState('');
  const [fromNameDraft, setFromNameDraft] = useState('');
  const [testToDraft, setTestToDraft] = useState('');

  useEffect(() => {
    setFromEmailDraft(fromEmail);
    setFromNameDraft(fromName);
  }, [fromEmail, fromName]);

  useEffect(() => {
    if (user?.email) setTestToDraft(user.email);
  }, [user?.email]);

  const schemaMissing = useMemo(
    () => isSchemaMissing(settingsQuery.error),
    [settingsQuery.error]
  );

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminPlatformService.upsertSystemSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testEmailMutation = useMutation({
    mutationFn: () => adminPlatformService.sendTestEmail(testToDraft.trim() || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const health: AdminSystemHealth | undefined = healthQuery.data;
  const emailStatus: AdminEmailStatus | undefined = emailStatusQuery.data;

  return (
    <AdminPageShell
      title="Email"
      subtitle="Resend provider · from-address · test delivery"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            emailStatusQuery.refetch();
            healthQuery.refetch();
            settingsQuery.refetch();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email settings unavailable</AlertTitle>
          <AlertDescription>
            Apply <code>admin_system_resend_settings</code> after the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminSectionPanel
        title="Email configuration (Resend)"
        description="API key lives in secrets (RESEND_API_KEY). Domain DNS is verified in the Resend dashboard."
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Key:{' '}
              {emailStatus?.smtpPassSource === 'env' || health?.resendConfigured
                ? 'env (RESEND_API_KEY)'
                : 'missing'}
            </Badge>
            <Badge variant="outline">Provider: {emailStatus?.provider ?? 'resend'}</Badge>
            <Badge variant="outline">
              SMTP: {smtpHost}:{smtpPort} · user {smtpUser}
            </Badge>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Connection status</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                <strong>Auth SMTP:</strong> Connected — <code>smtp.resend.com</code>, admin{' '}
                <code>team@wya254.com</code>.
              </p>
              <p>
                <strong>Platform API key:</strong>{' '}
                {health?.resendConfigured || emailStatus?.smtpPassSource === 'env'
                  ? 'RESEND_API_KEY is set — test send available.'
                  : 'Add RESEND_API_KEY as a Supabase secret, then redeploy admin-system.'}
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <Label>Email notifications enabled</Label>
              <p className="text-xs text-muted-foreground">Master switch for platform sends</p>
            </div>
            <Switch
              checked={emailNotifications}
              disabled={saveMutation.isPending || schemaMissing}
              onCheckedChange={(v) =>
                saveMutation.mutate({ key: 'email.notifications_enabled', value: v })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">From name</Label>
              <div className="flex gap-2">
                <Input
                  id="fromName"
                  value={fromNameDraft}
                  onChange={(e) => setFromNameDraft(e.target.value)}
                />
                <Button
                  disabled={saveMutation.isPending || schemaMissing}
                  onClick={() =>
                    saveMutation.mutate({
                      key: 'email.from_name',
                      value: fromNameDraft.trim() || 'WYA',
                    })
                  }
                >
                  Save
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From email</Label>
              <div className="flex gap-2">
                <Input
                  id="fromEmail"
                  value={fromEmailDraft}
                  onChange={(e) => setFromEmailDraft(e.target.value)}
                />
                <Button
                  disabled={saveMutation.isPending || schemaMissing}
                  onClick={() =>
                    saveMutation.mutate({
                      key: 'email.from_email',
                      value: fromEmailDraft.trim(),
                    })
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="testTo">Send test email</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="testTo"
                type="email"
                placeholder="you@example.com"
                value={testToDraft}
                onChange={(e) => setTestToDraft(e.target.value)}
              />
              <Button
                disabled={testEmailMutation.isPending}
                onClick={() => testEmailMutation.mutate()}
                className="gap-2"
              >
                {testEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send test
              </Button>
            </div>
          </div>
        </div>
      </AdminSectionPanel>
    </AdminPageShell>
  );
};

export default EmailSettingsPanel;

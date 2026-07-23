import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminPageShell,
  AdminPrimaryPill,
  AdminRefreshButton,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminPlatformService,
  type AdminEmailStatus,
  type AdminSystemHealth,
  type SystemSettingsMap,
} from '@/lib/admin-platform-service';
import { cn } from '@/lib/utils';

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

function InlineActionField({
  label,
  value,
  onChange,
  placeholder,
  actionLabel,
  onAction,
  disabled,
  pending,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-[52px] items-center gap-3 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <AdminPrimaryPill onClick={onAction} disabled={disabled || pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : actionLabel}
        </AdminPrimaryPill>
      </div>
    </label>
  );
}

const EmailSettingsPanel: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
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
  const [inviteEmailDraft, setInviteEmailDraft] = useState('');

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
      toast.success('Saved');
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testEmailMutation = useMutation({
    mutationFn: () => adminPlatformService.sendTestEmail(testToDraft.trim() || undefined),
    onSuccess: () => {
      toast.success('Test email sent');
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const email = inviteEmailDraft.trim().toLowerCase();
      if (!email.includes('@')) throw new Error('Enter a valid email');
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('admin-invite-user', {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      return data;
    },
    onSuccess: () => {
      toast.success('Invite email sent (Auth invite template)');
      setInviteEmailDraft('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const health: AdminSystemHealth | undefined = healthQuery.data;
  const emailStatus: AdminEmailStatus | undefined = emailStatusQuery.data;
  const keyReady =
    emailStatus?.smtpPassSource === 'env' || Boolean(health?.resendConfigured);
  const smtpConfigured = Boolean(smtpHost && smtpPort && smtpUser);

  const body = (
    <>
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email settings unavailable</AlertTitle>
          <AlertDescription>
            Apply <code>admin_system_resend_settings</code> after the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="w-full rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Email configuration (Resend)
          </h2>
          {embedded ? (
            <AdminRefreshButton
              onClick={() => {
                emailStatusQuery.refetch();
                healthQuery.refetch();
                settingsQuery.refetch();
              }}
            />
          ) : null}
        </div>

        <div className="mt-[18px] flex flex-wrap gap-2">
          <AdminStatusPill tone={keyReady ? 'success' : 'error'}>
            Key: {keyReady ? 'env (RESEND_API_KEY)' : 'missing'}
          </AdminStatusPill>
          <AdminStatusPill tone="primary">
            Provider: {emailStatus?.provider ?? 'Resend'}
          </AdminStatusPill>
          <AdminStatusPill tone="muted">
            SMTP: {smtpConfigured ? 'configured' : 'incomplete'}
          </AdminStatusPill>
        </div>

        <div
          className={cn(
            'mt-[18px] flex items-center gap-2.5 rounded-xl border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              keyReady ? 'bg-[hsl(var(--admin-success))]' : 'bg-destructive'
            )}
          />
          <p className="text-[13px] text-foreground">
            {keyReady
              ? 'Connected — Resend API key loaded from environment'
              : 'Not connected — add RESEND_API_KEY as a Supabase secret, then redeploy admin-system'}
          </p>
        </div>

        <div className="mt-[18px] flex items-center gap-4 rounded-[14px] bg-[hsl(var(--admin-surface))] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Email notifications enabled</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send transactional + broadcast email
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            disabled={saveMutation.isPending || schemaMissing}
            onCheckedChange={(v) =>
              saveMutation.mutate({ key: 'email.notifications_enabled', value: v })
            }
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="mt-[18px] space-y-[18px]">
          <InlineActionField
            label="From name"
            value={fromNameDraft}
            onChange={setFromNameDraft}
            actionLabel="Save"
            disabled={schemaMissing}
            pending={saveMutation.isPending}
            onAction={() =>
              saveMutation.mutate({
                key: 'email.from_name',
                value: fromNameDraft.trim() || 'WYA',
              })
            }
          />
          <InlineActionField
            label="From email"
            value={fromEmailDraft}
            onChange={setFromEmailDraft}
            actionLabel="Save"
            disabled={schemaMissing}
            pending={saveMutation.isPending}
            onAction={() =>
              saveMutation.mutate({
                key: 'email.from_email',
                value: fromEmailDraft.trim(),
              })
            }
          />
          <InlineActionField
            label="Test delivery"
            value={testToDraft}
            onChange={setTestToDraft}
            placeholder="admin@wya.com"
            actionLabel="Send test"
            pending={testEmailMutation.isPending}
            onAction={() => testEmailMutation.mutate()}
          />
          <InlineActionField
            label="Invite user by email"
            value={inviteEmailDraft}
            onChange={setInviteEmailDraft}
            placeholder="newuser@example.com"
            actionLabel="Send invite"
            pending={inviteMutation.isPending}
            onAction={() => inviteMutation.mutate()}
          />
        </div>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <AdminPageShell
      title="Email"
      subtitle="Resend provider · from-address · test delivery"
      icon={Mail}
      actions={
        <AdminRefreshButton
          onClick={() => {
            emailStatusQuery.refetch();
            healthQuery.refetch();
            settingsQuery.refetch();
          }}
        />
      }
    >
      {body}
    </AdminPageShell>
  );
};

export default EmailSettingsPanel;

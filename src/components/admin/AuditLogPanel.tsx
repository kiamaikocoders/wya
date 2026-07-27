import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Loader2, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminKpiTile,
  AdminPageShell,
  AdminPagination,
  AdminRefreshButton,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import {
  adminPlatformService,
  type AdminAuditEntry,
} from '@/lib/admin-platform-service';
import { useListPagination } from '@/hooks/use-list-pagination';

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /admin_audit|does not exist|schema cache|Admin only/i.test(msg);
}

const AuditLogPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const auditQuery = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: () => adminPlatformService.getAuditLog(120),
    retry: false,
  });

  const audit: AdminAuditEntry[] = auditQuery.data ?? [];
  const {
    page,
    setPage,
    pageItems,
    totalPages,
    total,
    pageSize,
  } = useListPagination(audit);
  const schemaMissing = isSchemaMissing(auditQuery.error);
  const settingsCount = audit.filter((r) => /setting|system/i.test(r.action)).length;
  const securityCount = audit.filter((r) =>
    /danger|logout|force|cancel|email\.test/i.test(r.action)
  ).length;

  return (
    <AdminPageShell
      title="Audit log"
      subtitle="Privileged admin actions across the platform"
      icon={ScrollText}
      actions={
        <AdminRefreshButton
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] })}
        />
      }
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Audit log unavailable</AlertTitle>
          <AlertDescription>
            Apply migration <code>admin_superadmin_platform</code> once the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminKpiTile label="Events" value={String(audit.length)} hint="Loaded" />
        <AdminKpiTile label="Settings" value={String(settingsCount)} hint="Config changes" />
        <AdminKpiTile label="Security / ops" value={String(securityCount)} hint="Sensitive" />
        <AdminKpiTile label="Source" value="admin_audit_log" hint="Supabase" />
      </div>

      {auditQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : audit.length === 0 && !schemaMissing ? (
        <AdminSectionPanel>
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No audit events yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Setting changes, ticket cancels, email tests, and force actions will appear here.
            </p>
          </div>
        </AdminSectionPanel>
      ) : (
        <AdminSectionPanel title="Activity" description="Newest first.">
          <ul className="divide-y divide-border">
            {pageItems.map((row) => (
              <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{row.action}</p>
                  <Badge variant="outline">{row.entity_type}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatWhen(row.created_at)}
                  {row.entity_id ? ` · id ${row.entity_id}` : ''}
                </p>
                {row.metadata && Object.keys(row.metadata).length > 0 ? (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                    {JSON.stringify(row.metadata, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            className="mt-3"
          />
        </AdminSectionPanel>
      )}
    </AdminPageShell>
  );
};

export default AuditLogPanel;

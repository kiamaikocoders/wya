import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  getSupabaseOfflineMessage,
  isDevAdminBypassActive,
  SUPABASE_RESTORE_URL,
} from '@/lib/dev-admin-bypass';

const AdminOfflineBanner: React.FC = () => {
  if (!isDevAdminBypassActive()) return null;

  return (
    <Alert className="mx-5 mt-4 border-amber-300 bg-amber-50 text-amber-950 sm:mx-7">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-950">Supabase offline — admin data unavailable</AlertTitle>
      <AlertDescription className="space-y-3 text-amber-900/90">
        <p>{getSupabaseOfflineMessage()}</p>
        <p className="text-sm">
          You are signed in with a temporary admin bypass (not a live Supabase session). Live
          users/events data needs a real admin Auth user. After testing, set{' '}
          <code className="text-xs">VITE_ENABLE_DEV_ADMIN_BYPASS</code> back to{' '}
          <code className="text-xs">false</code> and redeploy.
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-amber-400/60 bg-white text-amber-950 hover:bg-amber-100"
        >
          <a href={SUPABASE_RESTORE_URL} target="_blank" rel="noopener noreferrer">
            Open Supabase billing
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AdminOfflineBanner;

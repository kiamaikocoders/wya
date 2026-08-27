import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import { publicDisplayName } from '@/lib/display-name';

const FriendRequests = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuth();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['friend-requests', currentUser?.id],
    queryFn: () => followService.getIncomingRequests(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['friend-requests', currentUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['friend-request-count', currentUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['followers', currentUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['following', currentUser?.id] });
  };

  const acceptMutation = useMutation({
    mutationFn: followService.acceptFollow,
    onSuccess: invalidate,
  });

  const declineMutation = useMutation({
    mutationFn: followService.declineFollow,
    onSuccess: invalidate,
  });

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="mb-4 text-muted-foreground">Log in to see friend requests.</p>
        <Button onClick={() => navigate('/login')}>Log in</Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <main className="relative z-10 flex-1 overflow-y-auto px-6 pb-28 pt-2">
        <div className="mb-6 flex items-center gap-4">
          <BackButton
            fallbackHref="/users"
            className="h-10 w-10 shrink-0 rounded-xl border border-border bg-card"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Friend requests</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">No pending requests</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              When someone wants to be friends, they show up here to accept or decline.
            </p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate('/users')}>
              Find people
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const name = publicDisplayName(request);
              const busy =
                acceptMutation.isPending && acceptMutation.variables === request.id
                  ? 'accept'
                  : declineMutation.isPending && declineMutation.variables === request.id
                    ? 'decline'
                    : null;
              return (
                <div
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => navigate(`/users/${request.username || request.id}`)}
                  >
                    <Avatar className="h-14 w-14 rounded-2xl">
                      <AvatarImage src={request.avatar_url || undefined} alt={name} />
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/80 to-orange-500 font-bold text-white">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{name}</p>
                      {request.username ? (
                        <p className="truncate text-xs text-muted-foreground">@{request.username}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">Wants to be friends</p>
                    </div>
                  </button>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1 rounded-2xl"
                      disabled={!!busy}
                      onClick={() => acceptMutation.mutate(request.id)}
                    >
                      {busy === 'accept' ? 'Accepting…' : 'Accept'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      disabled={!!busy}
                      onClick={() => declineMutation.mutate(request.id)}
                    >
                      {busy === 'decline' ? 'Declining…' : 'Decline'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default FriendRequests;

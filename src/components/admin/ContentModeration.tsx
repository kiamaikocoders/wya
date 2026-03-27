import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Ban,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Flag,
  Filter,
  Image,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { aiService } from '@/lib/ai-service';
import {
  contentModerationService,
  type MediaModerationItem,
  type TextModerationPost,
} from '@/lib/content-moderation-service';
import { cn } from '@/lib/utils';

const glassPanel =
  'rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl';

const pageBg =
  'relative min-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-white/[0.06] bg-[#050508] p-4 text-zinc-100 sm:p-6 md:p-8';

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateStr;
  }
}

const ContentModeration = () => {
  const queryClient = useQueryClient();
  const [textToModerate, setTextToModerate] = useState('');
  const [moderationResult, setModerationResult] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['moderation-events'],
    queryFn: () => contentModerationService.listEvents(),
    staleTime: 60_000,
  });

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const { data: textQueue = [], isLoading: textLoading } = useQuery({
    queryKey: ['moderation-text', selectedEventId],
    queryFn: () => contentModerationService.fetchTextModerationQueue(selectedEventId!),
    enabled: selectedEventId != null,
  });

  const { data: mediaQueue = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['moderation-media', selectedEventId],
    queryFn: () => contentModerationService.fetchMediaModerationQueue(selectedEventId!),
    enabled: selectedEventId != null,
  });

  const filteredTextPosts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return textQueue;
    return textQueue.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.user_name.toLowerCase().includes(q)
    );
  }, [textQueue, searchText]);

  const filteredMedia = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return mediaQueue;
    return mediaQueue.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q) ||
        m.compositeId.toLowerCase().includes(q)
    );
  }, [mediaQueue, searchText]);

  const moderationMutation = useMutation({
    mutationFn: async (payload: {
      kind: 'story' | 'forum_post';
      id: number;
      status: 'verified' | 'archived';
    }) => {
      if (payload.kind === 'story') {
        await contentModerationService.setStoryModerationStatus(payload.id, payload.status);
      } else {
        await contentModerationService.setForumPostModerationStatus(payload.id, payload.status);
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.status === 'verified' ? 'Marked as verified' : 'Archived (hidden from public)');
      queryClient.invalidateQueries({ queryKey: ['moderation-text', selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ['moderation-media', selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-media', selectedEventId] });
      setSelectedPostId(null);
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Update failed');
    },
  });

  const handleTextModeration = async () => {
    if (!textToModerate.trim()) {
      toast.error('Please enter text to moderate');
      return;
    }
    setIsChecking(true);
    try {
      const isAppropriate = await aiService.moderateContent(textToModerate);
      setModerationResult(isAppropriate);
      toast.success('Content analyzed successfully');
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error('Failed to analyze content');
      setModerationResult(null);
    } finally {
      setIsChecking(false);
    }
  };

  const applyMediaAction = (item: MediaModerationItem, status: 'verified' | 'archived') => {
    moderationMutation.mutate({
      kind: item.source === 'story' ? 'story' : 'forum_post',
      id: item.sourceId,
      status,
    });
  };

  const applyForumTextAction = (post: TextModerationPost, status: 'verified' | 'archived') => {
    moderationMutation.mutate({ kind: 'forum_post', id: post.id, status });
  };

  const isMutating = moderationMutation.isPending;

  return (
    <div className={pageBg}>
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(180,120,40,0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 40%, rgba(60,40,120,0.1), transparent 50%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl space-y-5">
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-light tracking-tight text-white md:text-3xl">
                Content <span className="text-amber-400">moderation</span>
              </h1>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Review pending forum text and event-tied media. Approve sets verified (visible publicly); Remove
                archives content.
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-500/30 bg-black/30 text-amber-200/90 hover:bg-amber-500/10 hover:text-amber-100 lg:w-auto"
              >
                <CircleHelp className="mr-2 h-4 w-4" />
                How moderation works
                <ChevronDown
                  className={cn('ml-2 h-4 w-4 transition-transform', guideOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 overflow-hidden">
            <div className={cn('space-y-3 p-4 text-sm leading-relaxed text-zinc-400', glassPanel)}>
              <ol className="list-decimal space-y-2 pl-5 marker:text-amber-500/80">
                <li>
                  <span className="text-zinc-200">Pick an event</span> — queues are scoped by{' '}
                  <code className="rounded bg-black/40 px-1 font-mono text-amber-200/80">event_id</code>. Stories
                  and forum media are loaded from Supabase for that event only.
                </li>
                <li>
                  <span className="text-zinc-200">Reported</span> — text-only forum posts awaiting review (pending,
                  no attachment).
                </li>
                <li>
                  <span className="text-zinc-200">Images</span> — photos and videos (stories and forum posts with
                  media). Videos use the HTML video element; images use img.
                </li>
                <li>
                  <span className="text-zinc-200">Approve</span> sets{' '}
                  <code className="rounded bg-black/40 px-1 font-mono text-emerald-300/90">verified</code> — item
                  appears in public feeds.
                </li>
                <li>
                  <span className="text-zinc-200">Remove</span> sets{' '}
                  <code className="rounded bg-black/40 px-1 font-mono text-red-300/80">archived</code> — hidden from
                  public feeds (not deleted).
                </li>
                <li>
                  New stories start as pending; forum posts with media start pending; text-only forum posts publish
                  as verified immediately.
                </li>
              </ol>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Tabs defaultValue="reported" className="w-full space-y-4 sm:w-auto sm:flex-1">
            <TabsList
              className={cn(
                'inline-flex h-11 w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-black/40 p-1 sm:h-11 sm:w-auto',
                'text-zinc-500'
              )}
            >
              <TabsTrigger
                value="reported"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all data-[state=active]:bg-black/70 data-[state=active]:text-amber-400 data-[state=active]:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)] sm:flex-initial"
              >
                <Flag className="h-4 w-4" />
                Reported
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all data-[state=active]:bg-black/70 data-[state=active]:text-amber-400 data-[state=active]:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)] sm:flex-initial"
              >
                <Image className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger
                value="ai-moderation"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all data-[state=active]:bg-black/70 data-[state=active]:text-amber-400 data-[state=active]:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)] sm:flex-initial"
              >
                <Sparkles className="h-4 w-4" />
                AI Moderation
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all data-[state=active]:bg-black/70 data-[state=active]:text-amber-400 data-[state=active]:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)] sm:flex-initial"
              >
                <Filter className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reported" className="space-y-4 outline-none">
              <div className={cn(glassPanel, 'p-0')}>
                <Card className="border-0 bg-transparent text-inherit shadow-none">
                  <CardHeader className="border-b border-white/[0.06] pb-4">
                    <CardTitle className="text-lg text-white">Reported content</CardTitle>
                    <CardDescription className="text-zinc-500">
                      Pending text-only forum posts for the selected event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {!selectedEventId ? (
                      <p className="py-8 text-center text-sm text-zinc-500">Select an event to load the queue.</p>
                    ) : textLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                      </div>
                    ) : filteredTextPosts.length === 0 ? (
                      <p className="py-8 text-center text-sm text-zinc-500">No text items awaiting review.</p>
                    ) : (
                      filteredTextPosts.map((post) => (
                        <div
                          key={post.id}
                          className={cn(
                            'mb-4 rounded-xl border p-4 transition-colors last:mb-0',
                            selectedPostId === post.id
                              ? 'border-amber-500/40 bg-amber-500/[0.06]'
                              : 'border-white/[0.07] bg-black/25'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="border border-white/10">
                              <AvatarImage src={post.user_avatar || undefined} alt="" />
                              <AvatarFallback className="bg-zinc-800 text-zinc-300">
                                {post.user_name[0]?.toUpperCase() ?? '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-zinc-100">{post.user_name}</h4>
                                  <p className="text-xs text-zinc-500">{formatDateTime(post.created_at)}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/35 bg-amber-500/10 text-amber-200/90"
                                >
                                  Pending review
                                </Badge>
                              </div>
                              <p className="mt-2 font-medium text-zinc-200">{post.title}</p>
                              <p className="my-2 text-sm text-zinc-400 whitespace-pre-wrap">{post.content}</p>
                              {post.event_title ? (
                                <p className="text-xs text-zinc-600">Event: {post.event_title}</p>
                              ) : null}
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5"
                                  onClick={() =>
                                    setSelectedPostId(selectedPostId === post.id ? null : post.id)
                                  }
                                >
                                  <MessageSquare className="mr-1 h-4 w-4" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          </div>
                          {selectedPostId === post.id && (
                            <div className="mt-4 rounded-lg border border-white/10 bg-black/35 p-3">
                              <h5 className="mb-2 text-sm font-semibold text-zinc-200">Moderation actions</h5>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  disabled={isMutating}
                                  className="bg-emerald-700/80 text-white hover:bg-emerald-600"
                                  onClick={() => applyForumTextAction(post, 'verified')}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isMutating}
                                  onClick={() => applyForumTextAction(post, 'archived')}
                                >
                                  <Ban className="mr-1 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full border-white/10 text-zinc-400 hover:bg-white/5"
                                onClick={() =>
                                  aiService
                                    .moderateContent(`${post.title}\n${post.content}`)
                                    .then((result) => {
                                      toast.success(
                                        result
                                          ? 'AI: content appears appropriate'
                                          : 'AI: content may violate guidelines'
                                      );
                                    })
                                    .catch(() => toast.error('AI analysis failed'))
                                }
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Run AI analysis
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 outline-none">
              <div className={cn(glassPanel, 'p-0')}>
                <Card className="border-0 bg-transparent text-inherit shadow-none">
                  <CardHeader className="border-b border-white/[0.06] pb-4">
                    <CardTitle className="text-lg text-white">Image &amp; video moderation</CardTitle>
                    <CardDescription className="text-zinc-500">
                      Pending stories and forum attachments for the selected event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {!selectedEventId ? (
                      <p className="py-8 text-center text-sm text-zinc-500">Select an event to load the queue.</p>
                    ) : mediaLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                      </div>
                    ) : filteredMedia.length === 0 ? (
                      <p className="py-8 text-center text-sm text-zinc-500">No media awaiting review.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredMedia.map((item) => (
                          <Card
                            key={item.compositeId}
                            className="overflow-hidden border border-white/[0.08] bg-black/30 text-inherit shadow-lg"
                          >
                            <div className="relative aspect-video bg-zinc-900">
                              {item.mediaType === 'video' ? (
                                <video
                                  src={item.mediaUrl}
                                  className="h-full w-full object-cover"
                                  muted
                                  playsInline
                                  controls
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={item.mediaUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              )}
                              <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
                                <Badge className="border-0 bg-black/60 text-[10px] uppercase text-zinc-200">
                                  {item.mediaType}
                                </Badge>
                                <Badge
                                  className={cn(
                                    'border-0 text-[10px] uppercase',
                                    item.source === 'story'
                                      ? 'bg-violet-600/40 text-violet-100'
                                      : 'bg-sky-600/35 text-sky-100'
                                  )}
                                >
                                  {item.source === 'story' ? 'Story' : 'Forum'}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="pt-4">
                              <p className="line-clamp-2 text-sm text-zinc-300">{item.label}</p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {item.userName} · {formatDateTime(item.createdAt)}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-2 border-t border-white/[0.06] pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                                disabled={isMutating}
                                onClick={() => applyMediaAction(item, 'verified')}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                disabled={isMutating}
                                onClick={() => applyMediaAction(item, 'archived')}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Remove
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-moderation" className="space-y-4 outline-none">
              <div className={cn(glassPanel, 'p-0')}>
                <Card className="border-0 bg-transparent text-inherit shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      AI content moderation
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                      Paste text for a one-off check (does not change database rows).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="content-to-check" className="text-zinc-400">
                        Content to check
                      </Label>
                      <Textarea
                        id="content-to-check"
                        placeholder="Paste content to check for violations..."
                        className="mt-1 min-h-[150px] border-white/10 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
                        value={textToModerate}
                        onChange={(e) => setTextToModerate(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleTextModeration}
                      disabled={isChecking || !textToModerate.trim()}
                      className="w-full bg-amber-500/90 text-black hover:bg-amber-400"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Check content
                        </>
                      )}
                    </Button>
                    {moderationResult !== null && (
                      <div
                        className={cn(
                          'rounded-lg border p-4',
                          moderationResult
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-red-500/30 bg-red-500/10'
                        )}
                      >
                        <p className="font-medium text-zinc-100">
                          {moderationResult
                            ? 'Content appears appropriate'
                            : 'Content may violate community guidelines'}
                        </p>
                        <p className="mt-2 text-sm text-zinc-400">
                          This is advisory only. Use Reported / Images tabs to update moderation status in the
                          database.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 outline-none">
              <div className={cn(glassPanel, 'p-0')}>
                <Card className="border-0 bg-transparent text-inherit shadow-none">
                  <CardHeader>
                    <CardTitle className="text-white">Moderation settings</CardTitle>
                    <CardDescription className="text-zinc-500">
                      Thresholds here are not persisted yet; workflow is driven by database status values.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-zinc-400">Automatic moderation</Label>
                      <div className="mt-1 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3">
                        <span className="text-sm text-zinc-400">AI-assisted review (manual approve still required)</span>
                        <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                          Optional
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="moderation-level" className="text-zinc-400">
                        Strictness (local preview)
                      </Label>
                      <Input
                        id="moderation-level"
                        type="range"
                        min={1}
                        max={5}
                        defaultValue={3}
                        className="mt-1 accent-amber-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords" className="text-zinc-400">
                        Blocked keywords (not enforced server-side yet)
                      </Label>
                      <Textarea
                        id="keywords"
                        placeholder="One per line"
                        className="mt-1 min-h-[100px] border-white/10 bg-black/40 text-zinc-100"
                        defaultValue={'spam\nscam\nfree gift'}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/15 text-zinc-300"
                      onClick={() => toast.message('Settings are UI-only until connected to backend config.')}
                    >
                      Save settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex w-full flex-col gap-2 sm:w-72 sm:shrink-0">
            <Popover open={eventPickerOpen} onOpenChange={setEventPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={eventsLoading}
                  className="h-11 justify-between border-amber-500/30 bg-black/40 text-left font-normal text-zinc-100 hover:bg-white/[0.06]"
                >
                  {eventsLoading ? (
                    <span className="flex items-center gap-2 text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </span>
                  ) : selectedEvent ? (
                    <span className="truncate">
                      <span className="text-white">{selectedEvent.title}</span>
                      {formatEventDate(selectedEvent.date) ? (
                        <span className="text-zinc-500"> · {formatEventDate(selectedEvent.date)}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Select event…</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(100vw-2rem,320px)] border-white/10 bg-[#0a0a0f]/95 p-0 text-zinc-100 backdrop-blur-xl"
                align="end"
              >
                <Command className="bg-transparent">
                  <CommandInput
                    placeholder="Search events…"
                    className="h-11 border-white/10 bg-black/40 text-zinc-100"
                  />
                  <CommandList className="max-h-64">
                    <CommandEmpty className="py-6 text-center text-sm text-zinc-500">No matches.</CommandEmpty>
                    <CommandGroup className="text-zinc-500">
                      {events.map((ev) => (
                        <CommandItem
                          key={ev.id}
                          value={`${ev.title} ${ev.id}`}
                          onSelect={() => {
                            setSelectedEventId(ev.id);
                            setEventPickerOpen(false);
                          }}
                          className="cursor-pointer aria-selected:bg-amber-500/15"
                        >
                          <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-zinc-100">{ev.title}</span>
                            <span className="text-xs text-zinc-500">
                              {formatEventDate(ev.date) || `ID ${ev.id}`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Filter current tab…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-10 border-white/10 bg-black/40 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentModeration;

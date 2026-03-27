import { supabase } from '@/integrations/supabase/client';
import { isUndefinedColumnError } from '@/lib/supabase-schema-compat';

export type EventMediaSource = 'story' | 'forum_post';

export interface AdminEventOption {
  id: number;
  title: string;
  date: string | null;
}

export interface EventMediaItem {
  compositeId: string;
  source: EventMediaSource;
  sourceId: number;
  eventId: number;
  userId: string;
  contributorName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  label: string;
  createdAt: string;
  likesCount?: number | null;
  commentsCount?: number | null;
}

export interface EventMediaSummary {
  total: number;
  photos: number;
  videos: number;
  items: EventMediaItem[];
}

function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
  const base = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)(\b|$)/.test(base)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\b|$)/.test(base)) return 'image';
  if (base.includes('video') && !base.includes('preview')) return 'video';
  return 'image';
}

function normalizeStoryMediaType(raw: string | null | undefined, url: string): 'image' | 'video' {
  if (raw === 'video' || raw === 'image') return raw;
  return inferMediaTypeFromUrl(url);
}

async function fetchProfilesForIds(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', unique);

  if (error || !data) return new Map();

  return new Map(
    data.map((p) => [
      p.id,
      p.full_name?.trim() || p.username?.trim() || 'Attendee',
    ])
  );
}

export const adminEventMediaService = {
  async listEvents(): Promise<AdminEventOption[]> {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date')
      .order('date', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
    }));
  },

  async fetchMediaForEvent(eventId: number): Promise<EventMediaSummary> {
    let storiesRes = await supabase
      .from('stories')
      .select(
        'id, user_id, event_id, media_url, media_type, caption, content, created_at, likes_count, comments_count'
      )
      .eq('event_id', eventId)
      .neq('moderation_status', 'archived')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false });

    if (storiesRes.error && isUndefinedColumnError(storiesRes.error, 'moderation_status')) {
      storiesRes = await supabase
        .from('stories')
        .select(
          'id, user_id, event_id, media_url, media_type, caption, content, created_at, likes_count, comments_count'
        )
        .eq('event_id', eventId)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false });
    }

    let forumRes = await supabase
      .from('forum_posts')
      .select('id, user_id, event_id, media_url, title, created_at, likes_count, comments_count')
      .eq('event_id', eventId)
      .neq('moderation_status', 'archived')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false });

    if (forumRes.error && isUndefinedColumnError(forumRes.error, 'moderation_status')) {
      forumRes = await supabase
        .from('forum_posts')
        .select('id, user_id, event_id, media_url, title, created_at, likes_count, comments_count')
        .eq('event_id', eventId)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false });
    }

    if (storiesRes.error) throw storiesRes.error;
    if (forumRes.error) throw forumRes.error;

    const storyRows = (storiesRes.data || []).filter((s) => s.media_url && s.media_url.trim());
    const forumRows = (forumRes.data || []).filter((f) => f.media_url && f.media_url.trim());

    const userIds = [
      ...storyRows.map((s) => s.user_id),
      ...forumRows.map((f) => f.user_id),
    ];
    const profileMap = await fetchProfilesForIds(userIds);

    const items: EventMediaItem[] = [];

    for (const s of storyRows) {
      const url = s.media_url!.trim();
      const mediaType = normalizeStoryMediaType(s.media_type, url);
      items.push({
        compositeId: `story-${s.id}`,
        source: 'story',
        sourceId: s.id,
        eventId: s.event_id!,
        userId: s.user_id,
        contributorName: profileMap.get(s.user_id) || 'Attendee',
        mediaUrl: url,
        mediaType,
        label: (s.caption || s.content || 'Story').slice(0, 160),
        createdAt: s.created_at || new Date().toISOString(),
        likesCount: s.likes_count,
        commentsCount: s.comments_count,
      });
    }

    for (const f of forumRows) {
      const url = f.media_url!.trim();
      const mediaType = inferMediaTypeFromUrl(url);
      items.push({
        compositeId: `forum-${f.id}`,
        source: 'forum_post',
        sourceId: f.id,
        eventId: f.event_id!,
        userId: f.user_id,
        contributorName: profileMap.get(f.user_id) || 'Attendee',
        mediaUrl: url,
        mediaType,
        label: (f.title || 'Forum post').slice(0, 160),
        createdAt: f.created_at || new Date().toISOString(),
        likesCount: f.likes_count,
        commentsCount: f.comments_count,
      });
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const photos = items.filter((i) => i.mediaType === 'image').length;
    const videos = items.filter((i) => i.mediaType === 'video').length;

    return {
      total: items.length,
      photos,
      videos,
      items,
    };
  },
};

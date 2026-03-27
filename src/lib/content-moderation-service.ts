import { supabase } from '@/integrations/supabase/client';
import { isUndefinedColumnError } from '@/lib/supabase-schema-compat';

export type ModerationStatus = 'pending' | 'verified' | 'archived';

export interface ModerationEventOption {
  id: number;
  title: string;
  date: string | null;
}

export interface TextModerationPost {
  id: number;
  user_id: string;
  event_id: number | null;
  title: string;
  content: string;
  created_at: string;
  moderation_status: ModerationStatus;
  user_name: string;
  user_avatar: string | null;
  event_title: string | null;
}

export interface MediaModerationItem {
  compositeId: string;
  source: 'story' | 'forum_post';
  sourceId: number;
  eventId: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  moderation_status: ModerationStatus;
  label: string;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
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

async function mapProfiles(userIds: string[]): Promise<Map<string, { name: string; avatar: string | null }>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (!unique.length) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', unique);
  return new Map(
    (data || []).map((p) => [
      p.id,
      {
        name: p.full_name?.trim() || p.username?.trim() || 'Attendee',
        avatar: p.avatar_url ?? null,
      },
    ])
  );
}

export const contentModerationService = {
  async listEvents(): Promise<ModerationEventOption[]> {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date')
      .order('date', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data || []).map((e) => ({ id: e.id, title: e.title, date: e.date }));
  },

  /**
   * Text-first queue: forum posts linked to the event, pending review, no attached media.
   */
  async fetchTextModerationQueue(eventId: number): Promise<TextModerationPost[]> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(
        'id, user_id, event_id, title, content, created_at, moderation_status, media_url'
      )
      .eq('event_id', eventId)
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []).filter((r) => !r.media_url || !String(r.media_url).trim());
    if (!rows.length) return [];

    const profiles = await mapProfiles(rows.map((r) => r.user_id));
    const { data: ev } = await supabase.from('events').select('id, title').eq('id', eventId).maybeSingle();

    return rows.map((r) => {
      const p = profiles.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        event_id: r.event_id,
        title: r.title,
        content: r.content,
        created_at: r.created_at || new Date().toISOString(),
        moderation_status: r.moderation_status as ModerationStatus,
        user_name: p?.name || 'Attendee',
        user_avatar: p?.avatar ?? null,
        event_title: ev?.title ?? null,
      };
    });
  },

  /**
   * Media queue: stories and forum posts with media, pending review.
   */
  async fetchMediaModerationQueue(eventId: number): Promise<MediaModerationItem[]> {
    const [storiesRes, forumRes] = await Promise.all([
      supabase
        .from('stories')
        .select(
          'id, user_id, event_id, media_url, media_type, caption, content, created_at, moderation_status'
        )
        .eq('event_id', eventId)
        .eq('moderation_status', 'pending')
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('forum_posts')
        .select('id, user_id, event_id, media_url, title, created_at, moderation_status')
        .eq('event_id', eventId)
        .eq('moderation_status', 'pending')
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false }),
    ]);

    if (
      (storiesRes.error && isUndefinedColumnError(storiesRes.error, 'moderation_status')) ||
      (forumRes.error && isUndefinedColumnError(forumRes.error, 'moderation_status'))
    ) {
      return [];
    }
    if (storiesRes.error) throw storiesRes.error;
    if (forumRes.error) throw forumRes.error;

    const sRows = (storiesRes.data || []).filter((s) => s.media_url && String(s.media_url).trim());
    const fRows = (forumRes.data || []).filter((f) => f.media_url && String(f.media_url).trim());

    const userIds = [...sRows.map((s) => s.user_id), ...fRows.map((f) => f.user_id)];
    const profiles = await mapProfiles(userIds);

    const items: MediaModerationItem[] = [];

    for (const s of sRows) {
      const url = String(s.media_url).trim();
      const mediaType = normalizeStoryMediaType(s.media_type, url);
      const p = profiles.get(s.user_id);
      items.push({
        compositeId: `story-${s.id}`,
        source: 'story',
        sourceId: s.id,
        eventId: s.event_id!,
        mediaUrl: url,
        mediaType,
        moderation_status: s.moderation_status as ModerationStatus,
        label: (s.caption || s.content || 'Story').slice(0, 200),
        createdAt: s.created_at || new Date().toISOString(),
        userName: p?.name || 'Attendee',
        userAvatar: p?.avatar ?? null,
      });
    }

    for (const f of fRows) {
      const url = String(f.media_url).trim();
      const mediaType = inferMediaTypeFromUrl(url);
      const p = profiles.get(f.user_id);
      items.push({
        compositeId: `forum-${f.id}`,
        source: 'forum_post',
        sourceId: f.id,
        eventId: f.event_id!,
        mediaUrl: url,
        mediaType,
        moderation_status: f.moderation_status as ModerationStatus,
        label: (f.title || 'Forum post').slice(0, 200),
        createdAt: f.created_at || new Date().toISOString(),
        userName: p?.name || 'Attendee',
        userAvatar: p?.avatar ?? null,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  },

  async setStoryModerationStatus(storyId: number, status: ModerationStatus): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .update({ moderation_status: status })
      .eq('id', storyId);
    if (error) throw error;
  },

  async setForumPostModerationStatus(postId: number, status: ModerationStatus): Promise<void> {
    const { error } = await supabase
      .from('forum_posts')
      .update({ moderation_status: status, updated_at: new Date().toISOString() })
      .eq('id', postId);
    if (error) throw error;
  },
};

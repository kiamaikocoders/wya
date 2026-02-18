import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import { storyService } from '@/lib/story/story-service';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/event.types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

type FriendProfile = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

type FriendEventGroup = {
  event: Event;
  friends: FriendProfile[];
  latestAt: string;
};

interface FriendsEventActivitySectionProps {
  events: Event[];
  className?: string;
}

const FriendsEventActivitySection: React.FC<FriendsEventActivitySectionProps> = ({ events, className }) => {
  const { user } = useAuth();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => followService.getFollowers(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => followService.getFollowing(user?.id || ''),
    enabled: !!user?.id,
  });

  const mutualIds = useMemo(() => {
    const followerSet = new Set(followers);
    return following.filter((id) => followerSet.has(id));
  }, [followers, following]);

  const { data: mutualProfiles = [] } = useQuery({
    queryKey: ['mutualProfiles', mutualIds],
    queryFn: async () => {
      if (mutualIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', mutualIds);
      if (error) throw error;
      return (data || []) as FriendProfile[];
    },
    enabled: mutualIds.length > 0,
  });

  const ACTIVITY_VISIBILITY_DAYS = 7;

  const { data: mutualEventStories = [] } = useQuery({
    queryKey: ['mutualEventStories', mutualIds],
    queryFn: async () => {
      if (mutualIds.length === 0) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - ACTIVITY_VISIBILITY_DAYS);
      const cutoffIso = cutoff.toISOString();
      const stories = await storyService.getAllStories();
      return stories
        .filter((s) => mutualIds.includes(s.user_id) && !!s.event_id && s.created_at >= cutoffIso)
        .slice(0, 300);
    },
    enabled: mutualIds.length > 0,
    staleTime: 1000 * 30,
  });

  const groups: FriendEventGroup[] = useMemo(() => {
    if (!mutualEventStories.length || !events.length) return [];

    const eventMap = new Map<number, Event>();
    events.forEach((e) => eventMap.set(e.id, e));

    const profileMap = new Map<string, FriendProfile>();
    mutualProfiles.forEach((p) => profileMap.set(p.id, p));

    const grouped = new Map<number, { friendIds: Set<string>; latestAt: string }>();

    mutualEventStories.forEach((s) => {
      const eventId = s.event_id as number;
      if (!eventId) return;
      const prev = grouped.get(eventId);
      if (!prev) {
        grouped.set(eventId, { friendIds: new Set([s.user_id]), latestAt: s.created_at });
      } else {
        prev.friendIds.add(s.user_id);
        if (new Date(s.created_at).getTime() > new Date(prev.latestAt).getTime()) {
          prev.latestAt = s.created_at;
        }
      }
    });

    const result: FriendEventGroup[] = [];
    grouped.forEach((meta, eventId) => {
      const event = eventMap.get(eventId);
      if (!event) return;
      const friends = Array.from(meta.friendIds)
        .map((id) => profileMap.get(id) || ({ id } as FriendProfile))
        .slice(0, 6);
      result.push({ event, friends, latestAt: meta.latestAt });
    });

    return result.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()).slice(0, 12);
  }, [events, mutualEventStories, mutualProfiles]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    if (scrollRef.current) setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - startX;
    scrollRef.current.scrollLeft = scrollLeft - x;
  };

  const handleEnd = () => setIsDragging(false);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className={className}>
      <h2 className="text-xl font-bold text-white mb-4 px-2">Friend Activities</h2>
      {groups.length === 0 ? (
        <Card className="bg-[#1A1A1A] border border-white/8 rounded-xl mx-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Users className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <p className="text-white font-semibold">No friend activity yet</p>
                <p className="text-sm text-white/60 mt-1">
                  {mutualIds.length === 0
                    ? "When you have mutuals (you follow each other), you'll see the events they’ve attended here."
                    : "When your mutuals post stories tagged to events, those events will appear here."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {groups.length > 0 ? (
        <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {groups.map(({ event, friends }) => {
            let formattedDate = event.date;
            try {
              formattedDate = format(parseISO(event.date), 'MMM d');
            } catch {}

            const first = friends[0];
            const firstName = (first?.full_name || first?.username || 'Friend')?.split(' ')[0];
            const extraCount = Math.max(0, friends.length - 1);
            const label = extraCount > 0 ? `${firstName} and ${extraCount} friends` : `${firstName}`;

            return (
              <Card
                key={event.id}
                className="min-w-[300px] max-w-[300px] bg-[#1A1A1A] border border-white/8 overflow-hidden rounded-xl shadow-lg hover:border-white/15 transition-all"
              >
                <Link to={`/events/${event.id}`} state={{ returnTo }} className="block">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={event.image_url || 'https://placehold.co/600x400?text=Event'}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold line-clamp-2">{event.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                      <span className="text-white/40">•</span>
                      <Users className="h-4 w-4" />
                      <span className="truncate">{label}</span>
                    </div>

                    <div className="mt-3 flex -space-x-2">
                      {friends.slice(0, 4).map((p) => (
                        <Avatar key={p.id} className="h-7 w-7 border border-black/40">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            {(p.full_name || p.username || 'U')[0]?.toUpperCase?.() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {groups.length > 2 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        </div>
      ) : null}
    </div>
  );
};

export default FriendsEventActivitySection;


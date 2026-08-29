import type { Event } from '@/types/event.types';

export type SeededSponsor = {
  name: string;
  type: string;
  logo: string;
  /** Figma brand card styles */
  cardClass: string;
  nameClass: string;
  typeClass: string;
  logoClass: string;
};

/** Browse-card shape used by the public events page. */
export type SeededEvent = Event & {
  subtitle?: string;
  dateLabel: string;
  timeLabel?: string;
  ticketLabel: string;
  expect?: string[];
  organizerName?: string;
  organizerMeta?: string;
  sponsors?: SeededSponsor[];
  going?: number;
  interested?: number;
};

/** No fake brand sponsors on the public web app. */
export const FIGMA_SPONSORS: SeededSponsor[] = [];

/** Seeded demo catalog removed — public feeds are DB-only. */
export const FIGMA_SEEDED_EVENTS: SeededEvent[] = [];

/** Parent category rail — matches admin create-event taxonomy. */
export const FIGMA_VIBE_COUNTS: { key: string; count: number; image: string }[] = [
  { key: 'Music & Entertainment', count: 0, image: '/events/vibe-music.png' },
  { key: 'Food & Nightlife', count: 0, image: '/events/vibe-nightlife.png' },
  { key: 'Arts & Culture', count: 0, image: '/events/vibe-arts.png' },
  { key: 'Business & Networking', count: 0, image: '/events/vibe-tech.jpg' },
  { key: 'Health & Wellness', count: 0, image: '/events/vibe-wellness.jpg' },
  { key: 'Sports & Outdoor', count: 0, image: '/events/vibe-sports.jpg' },
  { key: 'Fashion & Lifestyle', count: 0, image: '/events/vibe-markets.jpg' },
  { key: 'Gaming & Tech', count: 0, image: '/events/vibe-tech.jpg' },
];

export function getSeededEvent(_id: number): SeededEvent | undefined {
  return undefined;
}

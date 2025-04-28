
import { Sponsor, EventSponsor, SponsorZone, SponsorContentBlock } from './types';

export const SAMPLE_SPONSORS: Sponsor[] = [
  {
    id: 1,
    name: "Safaricom",
    description: "Kenya's leading mobile network operator and digital services provider.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/88/Safaricom_Logo.svg",
    website_url: "https://www.safaricom.co.ke",
    partnership_level: "title",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Kenya Airways",
    description: "The pride of Africa, Kenya's national airline.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/48/Kenya_Airways_Logo.svg",
    website_url: "https://www.kenya-airways.com",
    partnership_level: "gold",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Equity Bank",
    description: "Leading financial institution in Eastern Africa.",
    logo_url: "https://www.equitygroupholdings.com/wp-content/uploads/2022/01/Equity-Group-Holdings-PLC.png",
    website_url: "https://equitygroupholdings.com",
    partnership_level: "silver",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Tusker",
    description: "Kenya's iconic beer brand celebrating Kenyan identity and culture.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/83/Tusker_Beer_Logo.svg",
    website_url: "https://www.eabl.com/brands/tusker",
    partnership_level: "presenting",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    name: "KCB Bank",
    description: "One of the largest commercial banks in East Africa.",
    logo_url: "https://www.kcbgroup.com/wp-content/uploads/2021/06/logo.png",
    website_url: "https://www.kcbgroup.com",
    partnership_level: "bronze",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const SAMPLE_EVENT_SPONSORS: EventSponsor[] = [
  {
    id: 1,
    event_id: 1,
    sponsor_id: 1,
    sponsorship_type: "title",
    sponsor: SAMPLE_SPONSORS[0],
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    event_id: 1,
    sponsor_id: 2,
    sponsorship_type: "supporting",
    sponsor: SAMPLE_SPONSORS[1],
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    event_id: 1,
    sponsor_id: 3,
    sponsorship_type: "partner",
    sponsor: SAMPLE_SPONSORS[2],
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    event_id: 2,
    sponsor_id: 4,
    sponsorship_type: "presenting",
    sponsor: SAMPLE_SPONSORS[3],
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    event_id: 2,
    sponsor_id: 5,
    sponsorship_type: "media",
    sponsor: SAMPLE_SPONSORS[4],
    created_at: new Date().toISOString()
  }
];

export const SAMPLE_SPONSOR_ZONES: SponsorZone[] = [
  {
    id: 1,
    sponsor_id: 1,
    title: "Safaricom Experience Zone",
    description: "Explore the latest digital innovations and services from Safaricom.",
    content_blocks: [
      {
        id: 1,
        type: "video",
        title: "5G Network Launch",
        description: "Experience the power of our new 5G network across Kenya.",
        media_url: "https://www.youtube.com/watch?v=example",
        order: 1
      },
      {
        id: 2,
        type: "offer",
        title: "Event Special Offer",
        description: "Get 50% off on all data bundles during this event!",
        action_url: "https://safaricom.com/offers",
        order: 2
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    sponsor_id: 4,
    title: "Tusker Celebration Zone",
    description: "Celebrate Kenyan culture and heritage with Tusker.",
    content_blocks: [
      {
        id: 3,
        type: "giveaway",
        title: "Win a Year of Tusker",
        description: "Enter our raffle to win a year's supply of Tusker!",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        order: 1
      },
      {
        id: 4,
        type: "image",
        title: "Tusker Oktoberfest",
        description: "Join us for the annual Tusker Oktoberfest celebration.",
        media_url: "https://example.com/tusker-fest.jpg",
        action_url: "https://tusker.co.ke/oktoberfest",
        order: 2
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

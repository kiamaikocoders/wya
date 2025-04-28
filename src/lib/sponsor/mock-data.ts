
import { Sponsor, EventSponsor, SponsorZone } from './types';

export const SAMPLE_SPONSORS: Sponsor[] = [
  {
    id: 1,
    name: 'EABL',
    description: 'East African Breweries Limited - Proudly crafting Kenya\'s finest beverages.',
    logo_url: 'https://placehold.co/200x200?text=EABL',
    website_url: 'https://www.eabl.com',
    partnership_level: 'title',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'SportPesa',
    description: 'Kenya\'s premier sports betting platform.',
    logo_url: 'https://placehold.co/200x200?text=SportPesa',
    website_url: 'https://www.sportpesa.co.ke',
    partnership_level: 'presenting',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Red Bull',
    description: 'Red Bull gives you wings. Energy drink for body and mind.',
    logo_url: 'https://placehold.co/200x200?text=Red+Bull',
    website_url: 'https://www.redbull.com',
    partnership_level: 'gold',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SAMPLE_EVENT_SPONSORS: EventSponsor[] = [
  {
    id: 1,
    event_id: 1,
    sponsor_id: 1,
    sponsorship_type: 'title',
    sponsor: SAMPLE_SPONSORS[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    event_id: 1,
    sponsor_id: 2,
    sponsorship_type: 'presenting',
    sponsor: SAMPLE_SPONSORS[1],
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    event_id: 2,
    sponsor_id: 3,
    sponsorship_type: 'partner',
    sponsor: SAMPLE_SPONSORS[2],
    created_at: new Date().toISOString(),
  },
];

export const SAMPLE_SPONSOR_ZONES: SponsorZone[] = [
  {
    id: 1,
    sponsor_id: 1,
    title: 'EABL Zone',
    description: 'Discover the best beverages from East Africa\'s leading brewery.',
    content_blocks: [
      {
        id: 1,
        type: 'video',
        title: 'Crafting Excellence',
        description: 'Discover how EABL creates Kenya\'s finest beverages',
        media_url: 'https://www.youtube.com/watch?v=example',
        order: 1,
      },
      {
        id: 2,
        type: 'product',
        title: 'Featured Products',
        description: 'Explore our award-winning selection',
        media_url: 'https://placehold.co/600x400?text=EABL+Products',
        order: 2,
      },
      {
        id: 3,
        type: 'giveaway',
        title: 'Win a VIP Experience',
        description: 'Enter to win exclusive access to our brewery tour',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        order: 3,
      },
      {
        id: 4,
        type: 'poll',
        title: 'Your Favorite?',
        description: 'What\'s your favorite EABL beverage?',
        data: {
          options: ['Tusker', 'Guinness', 'Smirnoff', 'Johnnie Walker']
        },
        order: 4,
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    sponsor_id: 2,
    title: 'SportPesa Zone',
    description: 'Your gateway to sports betting excitement.',
    content_blocks: [
      {
        id: 5,
        type: 'video',
        title: 'SportPesa Experience',
        description: 'See how SportPesa is changing the game',
        media_url: 'https://www.youtube.com/watch?v=sportpesa-example',
        order: 1,
      },
      {
        id: 6,
        type: 'offer',
        title: 'Special Offer',
        description: 'Get 100% bonus on your first bet',
        action_url: 'https://www.sportpesa.co.ke/promo',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        order: 2,
      },
      {
        id: 7,
        type: 'quiz',
        title: 'Sports Quiz',
        description: 'Test your sports knowledge',
        data: {
          questions: [
            {
              question: 'Which team won the 2022 FIFA World Cup?',
              options: ['Brazil', 'France', 'Argentina', 'Germany'],
              correct: 2
            },
            {
              question: 'Who holds the record for most Premier League goals?',
              options: ['Wayne Rooney', 'Alan Shearer', 'Sergio Aguero', 'Harry Kane'],
              correct: 1
            }
          ]
        },
        order: 3,
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

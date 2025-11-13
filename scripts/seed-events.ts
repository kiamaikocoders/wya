/**
 * Seed Events Script
 * Run this script to populate the database with sample events
 * 
 * Usage:
 * 1. Make sure you have the Supabase client configured
 * 2. Run: npx tsx scripts/seed-events.ts
 * 
 * Or apply the SQL migration directly:
 * supabase/migrations/20250116_seed_sample_events.sql
 */

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleEvents = [
  {
    title: 'Nairobi Music Festival 2025',
    description: 'Join us for the biggest music festival in Nairobi featuring top Kenyan artists and international acts. Experience live performances, food vendors, and an unforgettable atmosphere.',
    category: 'Music',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '18:00:00',
    location: 'Kasarani Stadium, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070',
    price: 2500,
    capacity: 5000,
    featured: true,
    tags: ['music', 'festival', 'live', 'nairobi'],
    performing_artists: ['Sauti Sol', 'Wakadinali', 'Nadia Mukami', 'Nyashinski'],
  },
  {
    title: 'Tech Innovation Summit',
    description: 'A gathering of tech enthusiasts, entrepreneurs, and innovators. Network, learn, and discover the latest trends in technology.',
    category: 'Technology',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00:00',
    location: 'Sarit Centre, Westlands, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072',
    price: 1500,
    capacity: 300,
    featured: true,
    tags: ['tech', 'innovation', 'networking', 'startups'],
    performing_artists: ['Tech Leaders Panel', 'Startup Founders'],
  },
  {
    title: 'Mombasa Food & Culture Festival',
    description: 'Experience the rich culinary traditions of the Kenyan coast. Taste authentic Swahili dishes, enjoy traditional music and dance performances.',
    category: 'Food',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '12:00:00',
    location: 'Fort Jesus, Mombasa',
    image_url: 'https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070',
    price: 800,
    capacity: 1000,
    featured: true,
    tags: ['food', 'culture', 'mombasa', 'swahili'],
    performing_artists: ['Coastal Chefs', 'Taarab Musicians', 'Traditional Dancers'],
  },
  {
    title: 'Nairobi Marathon 2025',
    description: 'Join thousands of runners for the annual Nairobi Marathon. Choose from full marathon, half marathon, or 10K routes.',
    category: 'Sports',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '06:00:00',
    location: 'Nyayo National Stadium, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070',
    price: 2000,
    capacity: 10000,
    featured: false,
    tags: ['sports', 'marathon', 'running', 'fitness'],
    performing_artists: ['Elite Runners', 'Fitness Coaches'],
  },
  {
    title: 'Art & Design Exhibition',
    description: 'Contemporary art exhibition featuring works from emerging and established Kenyan artists. Includes live painting sessions and artist talks.',
    category: 'Culture',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00:00',
    location: 'Nairobi National Museum, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=2070',
    price: 500,
    capacity: 200,
    featured: false,
    tags: ['art', 'design', 'exhibition', 'culture'],
    performing_artists: ['Local Artists', 'Guest Curators'],
  },
  {
    title: 'Jazz Night at The Alchemist',
    description: "An intimate evening of smooth jazz featuring Nairobi's finest jazz musicians. Enjoy cocktails and great music in a relaxed atmosphere.",
    category: 'Music',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '20:00:00',
    location: 'The Alchemist Bar, Westlands, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070',
    price: 1500,
    capacity: 150,
    featured: false,
    tags: ['jazz', 'music', 'nightlife', 'westlands'],
    performing_artists: ['Jazz Collective', 'Solo Pianist'],
  },
  {
    title: 'Business Networking Mixer',
    description: 'Connect with entrepreneurs, investors, and business leaders. Perfect for startups looking to expand their network.',
    category: 'Business',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '17:30:00',
    location: 'Radisson Blu Hotel, Upper Hill, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070',
    price: 2000,
    capacity: 250,
    featured: false,
    tags: ['business', 'networking', 'startups', 'investment'],
    performing_artists: ['Keynote Speakers', 'Investor Panel'],
  },
  {
    title: 'Comedy Night Live',
    description: "Laugh your heart out with Kenya's funniest comedians. An evening of stand-up comedy guaranteed to leave you in stitches.",
    category: 'Entertainment',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '19:30:00',
    location: 'Comedy Central, Kilimani, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2070',
    price: 1200,
    capacity: 300,
    featured: false,
    tags: ['comedy', 'entertainment', 'stand-up', 'laughter'],
    performing_artists: ['Top Comedians', 'Guest Performers'],
  },
  {
    title: 'Yoga & Wellness Retreat',
    description: 'A day of relaxation and rejuvenation. Includes yoga sessions, meditation, healthy meals, and wellness workshops.',
    category: 'Health & Wellness',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:00:00',
    location: 'Karura Forest, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070',
    price: 3000,
    capacity: 50,
    featured: false,
    tags: ['yoga', 'wellness', 'meditation', 'retreat'],
    performing_artists: ['Certified Yoga Instructors', 'Wellness Coaches'],
  },
  {
    title: 'Gaming Tournament',
    description: 'Compete in the biggest gaming tournament in Kenya. Multiple game categories including FIFA, Call of Duty, and more.',
    category: 'Gaming',
    date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00:00',
    location: 'Gaming Hub, Yaya Centre, Nairobi',
    image_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070',
    price: 1000,
    capacity: 200,
    featured: false,
    tags: ['gaming', 'esports', 'tournament', 'competition'],
    performing_artists: ['Pro Gamers', 'Commentators'],
  },
];

async function seedEvents() {
  console.log('Starting to seed events...');

  try {
    // Check if events already exist
    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      console.log('Events already exist in the database. Skipping seed.');
      console.log('To re-seed, delete existing events first or use the SQL migration directly.');
      return;
    }

    // Insert events
    const { data, error } = await supabase
      .from('events')
      .insert(sampleEvents)
      .select();

    if (error) {
      console.error('Error seeding events:', error);
      throw error;
    }

    console.log(`Successfully seeded ${data?.length || 0} events!`);
    console.log('Events created:');
    data?.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.date}`);
    });
  } catch (error) {
    console.error('Failed to seed events:', error);
    process.exit(1);
  }
}

// Run the seed function
seedEvents();


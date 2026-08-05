/**
 * Reverse the +15-month demo date shift on events in calendar year 2027.
 *
 * Usage:
 *   SUPABASE_URL=https://nnlxxbuekqlaqamczwyi.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/fix-event-dates-reverse-15m.mjs
 *
 * Prefer the SQL file in Supabase SQL Editor when possible:
 *   scripts/fix-event-dates-reverse-15m.sql
 */
import { createClient } from '@supabase/supabase-js';

const url = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://nnlxxbuekqlaqamczwyi.supabase.co'
).trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!serviceKey) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run scripts/fix-event-dates-reverse-15m.sql in the Supabase SQL Editor, or re-export the key and retry.',
  );
  process.exit(1);
}

/** Match Postgres: timestamp - INTERVAL '15 months' (UTC calendar months, clamp day). */
function minus15Months(iso) {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(year, month - 15, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  target.setUTCHours(
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds(),
  );
  return target.toISOString();
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error: fetchErr } = await supabase
  .from('events')
  .select('id, title, date, end_date')
  .gte('date', '2027-01-01')
  .lt('date', '2028-01-01')
  .order('id');

if (fetchErr) {
  console.error('Fetch failed:', fetchErr.message);
  process.exit(1);
}

console.log(`Found ${rows?.length ?? 0} events with date in 2027`);
if (!rows?.length) {
  console.log('Nothing to update.');
  process.exit(0);
}

let updated = 0;
for (const row of rows) {
  const patch = {
    date: minus15Months(row.date),
    updated_at: new Date().toISOString(),
  };
  if (row.end_date) {
    patch.end_date = minus15Months(row.end_date).slice(0, 10);
  }
  const { error } = await supabase.from('events').update(patch).eq('id', row.id);
  if (error) {
    console.error(`Failed id=${row.id}:`, error.message);
    process.exit(1);
  }
  updated += 1;
}

console.log(`Updated ${updated} events`);

const { count: remaining } = await supabase
  .from('events')
  .select('id', { count: 'exact', head: true })
  .gte('date', '2027-01-01')
  .lt('date', '2028-01-01');

console.log(`Remaining 2027 events: ${remaining ?? 0}`);

const { data: samples } = await supabase
  .from('events')
  .select('id, title, date')
  .in('id', [9, 125, 204])
  .order('id');

console.log('Spot-check:', samples);

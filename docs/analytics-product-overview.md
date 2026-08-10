# Analytics Product Overview

Internal product brief for Platform Analytics and Sponsor Analytics.

**Audience:** Product managers  
**Surfaces covered:** Admin Platform Analytics (`/admin/analytics`) and Admin Sponsor Analytics (`/admin/sponsor-analytics`)  
**Access:** Admin users only

---

## 1. Platform Analytics

**Where:** Admin → Analytics (`/admin/analytics`)

**Purpose:** Give ops and leadership a single view of platform health — growth, events, revenue, attendance, marketplace, engagement, trust, communications, and feedback.

### What it does

- Loads live platform metrics for a selected time window
- Breaks the business into ten modules (tabs)
- Supports period-over-period comparison
- Can exclude ghost users from user-base metrics
- Exports a CSV of core KPIs
- Generates an AI summary of the current view

### Controls

| Control | Behaviour |
|--------|-----------|
| Period | 7 days / 30 days / 90 days (default 30) |
| Custom range | Not available yet (falls back to 30 days) |
| Compare prior | Shows deltas vs the previous equal-length period |
| Exclude ghosts | Adjusts WAU-style user metrics to ignore ghost accounts |
| City / category filters | Present in UI; not yet applied to queries |
| Export CSV | Downloads core overview + revenue totals |
| Refresh | Reloads data |
| AI summary | Generates a written insight summary for the loaded metrics |

### Modules and what they track

#### Overview
High-level platform pulse.

| Metric | Meaning |
|--------|---------|
| WAU | Weekly active users in the selected window |
| Net new users | New signups in the period |
| Ticket GMV | Gross merchandise value from ticket payments |
| Tickets confirmed | Confirmed ticket count |
| Live / upcoming events | Current event inventory |
| Check-in rate | Share of tickets that converted to check-ins |
| MP transfers | Marketplace transfer volume |
| Ghost % | Share of ghost accounts in the user base |

Also shows:

- Alerts (payment failure %, pending events, ghost stories %)
- Users-over-time and revenue charts
- Top events by revenue (KES)
- Top cities by share
- AI summary panel

#### Growth
Acquisition and activation.

| Metric | Meaning |
|--------|---------|
| New signups | Accounts created in period |
| Verified % | Share of users who completed verification |
| Avatar complete % | Share with profile photo |
| First ticket % | Share who bought a first ticket |

Also shows:

- Signups trend
- Activation funnel: Signup → Verified → Photo → Ticket
- D7 retention cohorts
- Top cities

#### Events
Event pipeline and fill.

| Metric | Meaning |
|--------|---------|
| Pending | Events awaiting approval |
| Approved (period) | Events approved in window |
| Avg fill rate | Average ticket fill vs capacity |
| Time-to-approve | Average hours from submit to approval |

Also shows:

- Pipeline trend
- Category mix
- Top events by fill rate

#### Revenue
Payments performance.

| Metric | Meaning |
|--------|---------|
| Completed GMV | Successful payment volume |
| Pending | Payments still open |
| Failed | Failed payment volume |
| AOV | Average order value |

Also shows:

- GMV over time
- Payment method mix (M-Pesa / Card / Cash)
- Revenue by event
- Revenue by category

#### Attendance
On-site conversion.

| Metric | Meaning |
|--------|---------|
| Check-ins | Total check-ins in period |
| Ticket → check-in % | Conversion from ticket to attendance |
| No-show rate | Share of ticket holders who did not check in |
| Peak hour | Busiest check-in hour band |
| QR quality | Reuse attempts and scan failures |

Also shows:

- Check-ins over time
- Attendance by event

#### Marketplace
Secondary ticket market.

| Metric | Meaning |
|--------|---------|
| Listings | Tickets listed for resale |
| Sold | Completed resale transfers |
| Conversion | Listings that sold |
| Fees collected | Marketplace fee revenue |
| Resell rate | Share of tickets that enter resale |
| Median time-to-sell | Typical time from listing to sale |
| Payouts pending / aging | Outstanding payouts, including >7 day aging |

#### Engagement
Social and content activity.

| Metric | Meaning |
|--------|---------|
| Stories | Stories created |
| Posts | Forum / community posts |
| Likes | Story likes |
| Follows | New follows |
| Favorites | Favourited items |

Also shows:

- Content volume over time
- Stories per event

#### Trust
Safety, moderation, and compliance.

| Metric | Meaning |
|--------|---------|
| Mod queue | Items awaiting moderation |
| Avg queue age | How long items sit in queue |
| Bans | Ban actions |
| DSAR open | Open data-subject requests |
| Consent coverage | Share of users with required consents |
| Media opt-in | Media consent opt-in rate |
| DSAR avg close | Average time to close DSARs |

#### Comms
Outbound messaging health.

| Metric | Meaning |
|--------|---------|
| Emails sent | Transactional / product emails |
| Reminders | Event reminder sends |
| Newsletter subs | Newsletter subscriber count |
| Bounce rate | Email bounce rate |
| Templates | Template usage / send volume |

#### Feedback
Product and event quality signal.

| Metric | Meaning |
|--------|---------|
| Volume | Feedback submissions |
| CSAT | Customer satisfaction score |
| NPS | Net Promoter Score |
| Bug reports | Reported bugs |
| Themes | Recurring feedback themes |
| Event satisfaction | Average post-event satisfaction |
| Post-event NPS | NPS after events |

### Data quality notes (important for planning)

Platform Analytics mixes **measured** database counts with some **estimated / placeholder** series (for example some trend shapes, cohort visuals, trust queue details, CSAT/NPS themes, and QR quality fields).

Treat Overview revenue/tickets/users, marketplace stats, and core event/payment counts as the most reliable planning inputs today. Validate estimated badges and placeholder series before using them for board-level decisions.

### CSV export currently includes

- WAU
- Net new users
- GMV
- Tickets confirmed
- Revenue completed / pending / failed

---

## 2. Sponsor Analytics

**Where:** Admin → Sponsor Analytics (`/admin/sponsor-analytics`)

**Purpose:** Measure sponsor value from sponsored events and on-site zone check-ins — which sponsors attract traffic, which zones perform, and how reach compares across the book.

### What it does

- Aggregates performance across all sponsors, or drills into one sponsor
- Attributes check-ins to sponsor zones
- Ranks sponsors on a leaderboard
- Estimates reach from measured footfall
- Exports sponsor-level CSV
- Generates an AI summary (all-sponsors or single-sponsor scope)

### Who can use it

Admin only. There is **no sponsor self-serve analytics portal** today. Sponsors do not log in to view these numbers.

### Views

1. **All sponsors** — portfolio KPIs, zone check-ins chart, leaderboard, AI summary  
2. **Sponsor detail** — sponsor header, KPIs, zone breakdown, sponsored events, scoped AI summary  

### Controls

| Control | Behaviour |
|--------|-----------|
| Period | 7 days / 30 days / 90 days |
| Sponsor rail | Switch between “All sponsors” and a specific sponsor |
| Zone filter | Filters zone breakdown on sponsor detail |
| Event filter | UI present; currently limited / not fully wired |
| Export CSV | Sponsor, events, unique visitors, check-ins |
| Refresh | Reloads data |
| AI summary | Written insight for the current scope |

### Metrics tracked

| Metric | Type | Meaning |
|--------|------|---------|
| Sponsored events | Measured | Distinct events linked via event–sponsor relationships |
| Unique visitors | Measured | Distinct users who checked in at that sponsor’s zones |
| Check-ins | Measured | Total zone-linked check-ins |
| Estimated reach | Estimated | Derived as `max(uniques × 40, events × 2000)` |
| Story mentions | Proxy | Derived as `round(uniques × 0.05)` — not a true content scrape |
| Zone breakdown | Measured (when zones exist) | Per-zone unique visitors and check-ins |
| Leaderboard | Measured | Sponsors ranked by check-ins |

### Zone model

Sponsor performance is driven by **zone check-ins**:

- Sponsors are linked to events
- Events have sponsor zones (e.g. bar, lounge, entrance)
- Check-ins with a `zone_id` feed unique visitors and check-in counts

If real zones are missing, the UI may show fallback zone labels (Main bar / VIP lounge / Entrance) for visualisation.

### What Sponsor Analytics is *not* (yet)

It does **not** currently provide a production-grade view of:

- Banner / creative impressions
- True click-through rate (CTR)
- Poll / quiz / giveaway interaction analytics
- Demographic targeting reports for sponsors
- A login experience for sponsor brand managers

Those impression/CTR-style metrics appear only in older organiser mock UI and should not be treated as shipped sponsor reporting.

---

## 3. How the two pages differ

| | Platform Analytics | Sponsor Analytics |
|--|--------------------|-------------------|
| Question answered | How is WYA doing as a marketplace and community? | How are sponsors performing at events? |
| Primary unit | Platform / users / events / money | Sponsor / zone / footfall |
| Core signal | Signups, GMV, tickets, check-ins, marketplace, engagement | Zone check-ins and unique visitors |
| Depth | Ten operational modules | Portfolio + per-sponsor drill-down |
| Audience | Internal ops / leadership | Internal ops / partnership team (not sponsors themselves) |

---

## 4. Related surfaces (context only)

These exist in the product but are **not** the production admin BI hub:

| Surface | Audience | Status |
|---------|----------|--------|
| `/analytics` organiser dashboard | Organisers | Mostly prototype / sample data |
| `/analytics/event/:eventId` | Event organiser | Mostly prototype / sample charts |
| Organiser “Sponsors” analytics tab | Organisers | Mock impressions / interactions |
| Admin Dashboard home | Admins | Lightweight KPI strip only (not full analytics) |

For product decisions, treat **`/admin/analytics`** and **`/admin/sponsor-analytics`** as the source of truth.

---

## 5. Suggested PM talking points

1. **Platform Analytics** is the internal ops BI hub for growth, events, money, attendance, marketplace, engagement, trust, comms, and feedback.
2. **Sponsor Analytics** measures partnership value via sponsored events and zone check-ins, with estimated reach on top.
3. Sponsors cannot self-serve analytics today — reporting is admin-mediated.
4. Some filters and secondary KPIs are unfinished or estimated; measured footfall and core commerce metrics are the strongest current signals.
5. Natural next product bets:
   - Wire remaining filters (city, category, custom dates, sponsor event filter)
   - Replace proxy story mentions / estimated reach with measured content and media metrics
   - Build a sponsor-facing report or portal if brands need self-serve access
   - Promote organiser analytics from mock charts to live event-owner reporting

---

## 6. Quick glossary

| Term | Definition |
|------|------------|
| GMV | Gross merchandise value — total ticket payment volume |
| WAU | Weekly active users |
| AOV | Average order value |
| Check-in | On-site attendance scan / confirmation |
| Zone | Physical or logical sponsor area at an event |
| Ghost user | Synthetic / non-real account used for engagement seeding |
| DSAR | Data Subject Access Request (privacy / GDPR-style request) |
| CSAT / NPS | Satisfaction and promoter scores from feedback |

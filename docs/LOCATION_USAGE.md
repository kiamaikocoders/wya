# Location Usage in WYA

This document describes how locations are used across the application, including admin flows.

## Overview

- **Events**: Store `location` (text address), `latitude`, `longitude` for map pinning and spatial queries.
- **Profiles**: Store `location` (text), `latitude`, `longitude` for "near me" event filtering.
- **Maps**: Mapbox powers search, static images, and interactive maps.

---

## Admin Location Usage

### AdminCreateEvent

- **Location search**: Mapbox Search Box API (suggest + retrieve)
- **Scope**: Kenya only (`country: 'ke'`, Nairobi proximity)
- **Flow**: User types → suggestions appear → user selects → full address + lat/lng retrieved and saved
- **Storage**: `location`, `latitude`, `longitude` on the event

### AdminEditEvent

- **Location picker**: Same Mapbox LocationPicker as AdminCreateEvent
- **Flow**: Existing event loads with `location`, `latitude`, `longitude`; user can search and pick a new location
- **Storage**: Updates `location`, `latitude`, `longitude` on save

### EventManagement

- Events list shows `location` as text; no map in the table view.
- Edit opens AdminEditEvent with LocationPicker.

---

## User Flows

### Profile Location (EditProfileModal)

- LocationPicker in `user` mode
- Saves `location`, `latitude`, `longitude` to profiles
- Used for "Near me" event filter and nearby notifications

### Event Creation (CreateEvent)

- LocationPicker in `event` mode
- Requires coordinates for map pinning
- Kenya-only search

### Event Discovery

- **Location filter**: Fuzzy match (`ilike`) on `location` text
- **Near me filter**: Radius (10/25/50/100 km) using profile lat/lng; spatial query via `events_within_radius` RPC

---

## Map Components

| Component    | Purpose                          | Data source                    |
|-------------|-----------------------------------|--------------------------------|
| MapView     | Static map on EventDetails        | Mapbox Static API, lat/lng    |
| MapboxMap   | Interactive events map (Events)  | Event lat/lng or city fallback |
| LocationPicker | Search + pick location        | Mapbox Search Box API          |

---

## Database

- `profiles`: `location`, `latitude`, `longitude`
- `events`: `location`, `latitude`, `longitude`
- RPC: `events_within_radius(lat, lng, radius_km, ...)`, `events_within_radius_count(...)`

---

## Dependencies

- Mapbox access token in `location-service.ts`
- `react-map-gl` for MapboxMap and LocationPicker

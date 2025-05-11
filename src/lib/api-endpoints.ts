// API endpoints configuration (these will be legacy endpoints during transition)
export const XANO_BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:jOnkuav-";
export const XANO_EVENT_API_URL = "https://x8ki-letl-twmt.n7.xano.io/api:bV-zLRsC";

export const EVENT_ENDPOINTS = {
  ALL: `${XANO_EVENT_API_URL}/event`,
  SINGLE: (id: number) => `${XANO_EVENT_API_URL}/event/${id}`,
};

export const FAVORITES_ENDPOINTS = {
  ADD: (eventId: number) => `${XANO_EVENT_API_URL}/favorites/${eventId}`,
  REMOVE: (eventId: number) => `${XANO_EVENT_API_URL}/favorites/${eventId}`,
  IS_FAVORITED: (eventId: number) => `${XANO_EVENT_API_URL}/favorites/check/${eventId}`,
  GET_ALL: `${XANO_EVENT_API_URL}/favorites`,
};

// Note: These legacy endpoints will be replaced with direct Supabase calls
// We keep them here for reference during the migration

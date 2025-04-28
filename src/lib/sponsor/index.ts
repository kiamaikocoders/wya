
// Export all sponsor types and services from a single file

export * from './types';
export * from './sponsor-service';
export * from './mock-data';

// Export the service as a single instance
import { sponsorService } from './sponsor-service';
export { sponsorService };

// Also export specific types for direct access
import type { 
  Sponsor, 
  EventSponsor, 
  SponsorZone, 
  SponsorContentBlock,
  SponsorContentBlockType
} from './types';

export type { 
  Sponsor, 
  EventSponsor, 
  SponsorZone, 
  SponsorContentBlock,
  SponsorContentBlockType
};

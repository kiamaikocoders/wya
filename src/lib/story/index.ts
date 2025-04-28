
// Export all story types and services from a single file

export * from './types';
export * from './story-service';
export * from './mock-data';

// Export the service as a single instance
import { storyService } from './story-service';
export { storyService };

// Also export the Story type
import type { Story } from './types';
export type { Story };

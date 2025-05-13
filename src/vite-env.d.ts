
/// <reference types="vite/client" />

// Add missing property to Profile interface
import { Profile as BaseProfile } from '@/lib/user-service';

declare module '@/lib/user-service' {
  interface Profile extends BaseProfile {
    name?: string;
  }
}

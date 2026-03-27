/// <reference types="vite/client" />

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  /** When the UI is served from a different origin than the Vercel app that hosts /api/ai */
  readonly VITE_AI_PROXY_BASE_URL?: string;
}

// Add missing property to Profile interface
import { Profile as BaseProfile } from '@/lib/user-service';

declare module '@/lib/user-service' {
  interface Profile extends BaseProfile {
    name?: string;
  }
}

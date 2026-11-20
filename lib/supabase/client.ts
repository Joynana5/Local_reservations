import { createBrowserClient } from '@supabase/ssr';

// Browser client for client-side interactions.
// Uses the publishable key and the same cookie session as the server client.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

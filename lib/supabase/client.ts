import { createClient } from '@supabase/supabase-js';

// Browser client for client-side interactions.
// Uses the publishable key for browser-based operations.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

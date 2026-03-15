import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using service role key.
 * Use in Server Components, Server Actions, and API routes only.
 */
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

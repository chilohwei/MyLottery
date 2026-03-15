/**
 * One-time script to sync all existing Clerk users to Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-existing-users.ts
 *
 * Requires env vars: CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing required env vars: CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface ClerkUser {
  id: string;
  email_addresses: { email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
}

interface ClerkListResponse {
  data: ClerkUser[];
  total_count: number;
}

async function fetchClerkUsers(offset: number, limit: number): Promise<ClerkListResponse> {
  const res = await fetch(
    `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}&order_by=-created_at`,
    {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    },
  );
  if (!res.ok) {
    throw new Error(`Clerk API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as ClerkUser[];
  const totalCount = parseInt(res.headers.get("x-total-count") ?? "0", 10);
  return { data, total_count: totalCount };
}

async function main() {
  console.log("Fetching users from Clerk...");

  let offset = 0;
  const limit = 100;
  let total = 0;
  let synced = 0;

  do {
    const { data: users, total_count } = await fetchClerkUsers(offset, limit);
    total = total_count;

    if (users.length === 0) break;

    const rows = users.map((u) => ({
      id: u.id,
      email: u.email_addresses?.[0]?.email_address ?? null,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      image_url: u.image_url,
    }));

    const { error } = await supabase.from("users").upsert(rows, { onConflict: "id" });

    if (error) {
      console.error(`Failed to upsert batch at offset ${offset}:`, error.message);
    } else {
      synced += rows.length;
      console.log(`Synced ${synced}/${total} users`);
    }

    offset += limit;
  } while (offset < total);

  console.log(`Done. ${synced} users synced to Supabase.`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});

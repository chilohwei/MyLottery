import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerClient } from "@/lib/supabase/server";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserEvent {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET env var");
  }

  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  const wh = new Webhook(secret);
  let event: { type: string; data: ClerkUserEvent };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createServerClient();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, username, image_url } = event.data;
      const email = email_addresses?.[0]?.email_address ?? null;

      const { error } = await supabase.from("users").upsert(
        {
          id,
          email,
          first_name,
          last_name,
          username,
          image_url,
        },
        { onConflict: "id" },
      );

      if (error) {
        console.error("Failed to upsert user", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      if (id) {
        const { error } = await supabase.from("users").delete().eq("id", id);
        if (error) {
          console.error("Failed to delete user", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}

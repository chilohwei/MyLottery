import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_RECIPIENT_AVATAR } from "@/types/lottery";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prize, code } = body as { prize: string; code?: string };

  if (!prize) {
    return NextResponse.json(
      { error: "prize is required" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let location: string | null = null;
  const city = req.headers.get("cf-ipcity");
  const country = req.headers.get("cf-ipcountry");
  if (city || country) {
    location = [city, country].filter(Boolean).join(", ");
  }

  const supabase = createServerClient();

  const { data: lottery, error: verifyErr } = await supabase
    .from("lotteries")
    .select("config")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (verifyErr || !lottery) {
    return NextResponse.json(
      { error: "Lottery not found or not published" },
      { status: 404 },
    );
  }

  const config = lottery.config as Record<string, unknown>;
  const shareMode = (config.shareMode as string | undefined) ?? "public";
  if (shareMode === "closed") {
    return NextResponse.json(
      { error: "Lottery sharing is closed" },
      { status: 403 },
    );
  }

  if (shareMode === "passcode") {
    const sharePasscode = (config.sharePasscode as string) ?? "";
    if (!code || code !== sharePasscode) {
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 403 },
      );
    }
  }

  const gifts = Array.isArray(config.gifts)
    ? (config.gifts as Array<{ id?: string; text?: string; icon?: string }>)
    : [];
  const matchedGift = gifts.find((gift) => gift.id === prize);
  if (!matchedGift?.id || !matchedGift.text) {
    return NextResponse.json(
      { error: "Invalid prize" },
      { status: 400 },
    );
  }

  const snapshot = {
    gameType: config.gameType ?? null,
    gifts,
    recipientPhoto: (config.recipientPhoto as string) || DEFAULT_RECIPIENT_AVATAR,
  };

  const { error } = await supabase.from("prize_logs").insert({
    lottery_id: id,
    time: new Date().toISOString(),
    prize: matchedGift.id,
    prize_text: matchedGift.text,
    prize_icon: matchedGift.icon ?? "",
    notification: "",
    ip: ip ?? "",
    location: location ?? "",
    user_agent: userAgent ?? "",
    snapshot,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

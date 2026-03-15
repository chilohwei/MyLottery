import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const { prize, prize_text, prize_icon } = body as {
    prize: string;
    prize_text: string;
    prize_icon: string;
  };

  if (!prize || !prize_text) {
    return NextResponse.json(
      { error: "prize and prize_text are required" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let location: string | null = null;
  const city = req.headers.get("cf-ipcity");
  const country = req.headers.get("cf-ipcountry");
  if (city || country) {
    location = [city, country].filter(Boolean).join(", ");
  }

  const supabase = createServerClient();

  const { error: verifyErr } = await supabase
    .from("lotteries")
    .select("id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (verifyErr) {
    return NextResponse.json(
      { error: "Lottery not found or not published" },
      { status: 404 },
    );
  }

  const { error } = await supabase.from("prize_logs").insert({
    lottery_id: id,
    time: new Date().toISOString(),
    prize,
    prize_text,
    prize_icon: prize_icon ?? "",
    notification: "",
    ip: ip ?? "",
    location: location ?? "",
    user_agent: userAgent ?? "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

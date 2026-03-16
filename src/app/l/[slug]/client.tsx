"use client";

import { LotteryView } from "@/components/shared/lottery-view";
import { DEFAULT_RECIPIENT_AVATAR, type Lottery, type LotteryConfig } from "@/types/lottery";

function migrateConfig(raw: Record<string, unknown>): LotteryConfig {
  const c = raw;
  let slides: string[];
  if (Array.isArray(c.slides)) {
    slides = (c.slides as string[]).slice(0, 3);
  } else if (typeof c.greeting === "string" && c.greeting) {
    slides = [c.greeting as string];
  } else if (Array.isArray(c.introMessages)) {
    slides = (c.introMessages as string[]).slice(0, 3);
  } else {
    slides = [];
  }
  return {
    gameType: (c.gameType as LotteryConfig["gameType"]) ?? "wheel",
    theme: (c.theme as LotteryConfig["theme"]) ?? "warm",
    slides,
    senderName: (c.senderName as string) ?? (c.contactPerson as string) ?? "",
    senderAvatar: (c.senderAvatar as string) ?? (c.avatarUrl as string) ?? "",
    recipientPhoto: (c.recipientPhoto as string) || DEFAULT_RECIPIENT_AVATAR,
    gifts: (c.gifts as LotteryConfig["gifts"]) ?? (c.prizes as LotteryConfig["gifts"]) ?? [],
    showPrizeList: (c.showPrizeList as boolean) ?? false,
    allowRetry: (c.allowRetry as boolean) ?? false,
    shareMode: (c.shareMode as LotteryConfig["shareMode"]) ?? ((c.shareEnabled as boolean) === false ? "closed" : "public"),
    sharePasscode: (c.sharePasscode as string) ?? "",
    decorEmojis: (c.decorEmojis as string[]) ?? (c.emojiList as string[]) ?? ["🎉", "🎊", "✨"],
  };
}

export function PublicLotteryClient({ lottery }: { lottery: Lottery }) {
  const config = migrateConfig(lottery.config as unknown as Record<string, unknown>);

  return (
    <>
      {/* Mobile: full-screen immersive, identical to editor preview */}
      <div className="md:hidden fixed inset-0 w-full h-[100dvh]">
        <LotteryView
          config={config}
          title={lottery.title}
          interactive
          autoPlay
          hideTitle
          safeArea
          lotteryId={lottery.id}
        />
      </div>

      {/* Desktop: centered phone frame */}
      <div className="hidden md:flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-neutral-950 to-neutral-900 p-6">
        <div className="relative w-[390px] h-[844px] rounded-[3rem] border-[6px] border-white/8 bg-background shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[100px] h-[24px] rounded-full bg-foreground/8" />
          <div className="h-full overflow-hidden">
            <LotteryView
              config={config}
              title={lottery.title}
              interactive
              autoPlay
              hideTitle
              safeArea
              lotteryId={lottery.id}
            />
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[120px] h-[4px] rounded-full bg-foreground/10" />
        </div>
      </div>
    </>
  );
}

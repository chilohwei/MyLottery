import { DEFAULT_RECIPIENT_AVATAR, type LotteryConfig } from "@/types/lottery";

/**
 * Normalize legacy / incomplete config shapes into the canonical LotteryConfig.
 * Accepts `opts.fillDefaults` to populate empty slides/gifts with sensible defaults
 * (used in the editor; the public page should not fill defaults).
 */
export function migrateConfig(
  raw: Record<string, unknown>,
  opts?: { fillDefaults?: boolean },
): LotteryConfig {
  const c = raw;
  const fillDefaults = opts?.fillDefaults ?? false;

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

  if (fillDefaults && slides.length === 0) {
    slides = ["这是我为你准备的一份小惊喜\n愿你收到时，刚好有一点开心"];
  }

  const parsedGifts =
    (c.gifts as LotteryConfig["gifts"]) ??
    (c.prizes as LotteryConfig["gifts"]) ??
    [];
  const gifts =
    parsedGifts.length > 0 || !fillDefaults
      ? parsedGifts
      : [
          { id: crypto.randomUUID(), text: "影视会员年卡", icon: "🎬" },
          { id: crypto.randomUUID(), text: "电影票 2 张", icon: "🎟️" },
          { id: crypto.randomUUID(), text: "红包 188 元", icon: "💸" },
          { id: crypto.randomUUID(), text: "请吃一顿大餐", icon: "🍰" },
        ];

  return {
    gameType: (c.gameType as LotteryConfig["gameType"]) ?? "wheel",
    theme: (c.theme as LotteryConfig["theme"]) ?? "warm",
    slides,
    senderName: (c.senderName as string) ?? (c.contactPerson as string) ?? "",
    senderAvatar: (c.senderAvatar as string) ?? (c.avatarUrl as string) ?? "",
    recipientPhoto: (c.recipientPhoto as string) || DEFAULT_RECIPIENT_AVATAR,
    gifts,
    showPrizeList: (c.showPrizeList as boolean) ?? false,
    allowRetry: (c.allowRetry as boolean) ?? false,
    shareMode:
      (c.shareMode as LotteryConfig["shareMode"]) ??
      ((c.shareEnabled as boolean) === false ? "closed" : "public"),
    sharePasscode: (c.sharePasscode as string) ?? "",
    decorEmojis:
      (c.decorEmojis as string[]) ??
      (c.emojiList as string[]) ??
      ["🎉", "🎊", "✨"],
  };
}

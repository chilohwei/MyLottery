export type GameType = "wheel" | "slots" | "cards" | "blindbox" | "scratch";
export type ShareMode = "public" | "passcode" | "closed";

export const GAME_TYPES: { value: GameType; label: string; icon: string; desc: string }[] = [
  { value: "wheel", label: "大转盘", icon: "🎡", desc: "经典旋转抽奖" },
  { value: "slots", label: "老虎机", icon: "🎰", desc: "三列滚动抽奖" },
  { value: "cards", label: "翻卡牌", icon: "🃏", desc: "翻开卡牌揭晓结果" },
  { value: "blindbox", label: "盲盒", icon: "📦", desc: "开启盲盒揭晓奖品" },
  { value: "scratch", label: "刮刮卡", icon: "🎟️", desc: "刮开涂层查看结果" },
];

export interface Gift {
  id: string;
  text: string;
  icon: string;
  probability?: number;
}

export interface LotteryConfig {
  gameType: GameType;
  slides: string[];
  senderName: string;
  senderAvatar: string;
  recipientPhoto: string;
  gifts: Gift[];
  showPrizeList: boolean;
  allowRetry: boolean;
  shareMode: ShareMode;
  sharePasscode?: string;
  decorEmojis: string[];
}

export interface Lottery {
  id: string;
  clerk_user_id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  config: LotteryConfig;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PrizeLog {
  id: string;
  lottery_id: string;
  time: string;
  prize: string;
  prize_text: string;
  prize_icon: string;
  notification: string | null;
  ip: string | null;
  location: string | null;
  user_agent: string | null;
  created_at: string;
}

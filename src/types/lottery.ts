export type GameType = "wheel" | "slots" | "cards" | "blindbox" | "scratch";
export type ShareMode = "public" | "passcode" | "closed";
export type LotteryTheme =
  | "warm"
  | "sunset"
  | "ocean"
  | "night"
  | "forest"
  | "candy"
  | "minimal"
  | "gold";

export const GAME_TYPES: { value: GameType; label: string; icon: string; desc: string }[] = [
  { value: "wheel", label: "大转盘", icon: "🎡", desc: "经典旋转抽奖" },
  { value: "slots", label: "老虎机", icon: "🎰", desc: "三列滚动抽奖" },
  { value: "cards", label: "翻卡牌", icon: "🃏", desc: "翻开卡牌揭晓结果" },
  { value: "blindbox", label: "盲盒", icon: "📦", desc: "开启盲盒揭晓奖品" },
  { value: "scratch", label: "刮刮卡", icon: "🎟️", desc: "刮开涂层查看结果" },
];

export const LOTTERY_THEMES: {
  value: LotteryTheme;
  label: string;
  desc: string;
}[] = [
  { value: "warm", label: "暖雾", desc: "柔和粉青，默认风格" },
  { value: "sunset", label: "落日", desc: "奶金紫粉，更有节日感" },
  { value: "ocean", label: "海盐", desc: "清透蓝绿，轻盈克制" },
  { value: "night", label: "夜幕", desc: "深色星空，对比更强" },
  { value: "forest", label: "森屿", desc: "深绿层次，静谧高级" },
  { value: "candy", label: "糖果", desc: "高饱和亮色，活泼俏皮" },
  { value: "minimal", label: "极简", desc: "灰白冷调，干净克制" },
  { value: "gold", label: "鎏金", desc: "暖金酒红，庆典质感" },
];

export const DEFAULT_RECIPIENT_AVATAR = "/images/default-recipient-avatar.svg";

export interface Gift {
  id: string;
  text: string;
  icon: string;
  probability?: number;
}

export interface LotteryConfig {
  gameType: GameType;
  theme: LotteryTheme;
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

export interface PrizeLogSnapshot {
  gameType: GameType | null;
  gifts: Gift[];
  recipientPhoto: string | null;
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
  snapshot: PrizeLogSnapshot | null;
  created_at: string;
}

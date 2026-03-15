"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  ChevronLeft,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhonePreview } from "@/components/shared/phone-preview";
import { PageHeader } from "@/components/shared/page-header";
import { GiftEditor } from "@/components/editor/gift-editor";
import { PhotoUpload } from "@/components/editor/photo-upload";
import { LotteryPreview } from "@/components/editor/lottery-preview";
import type { Lottery, LotteryConfig } from "@/types/lottery";
import { GAME_TYPES } from "@/types/lottery";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorFormProps {
  lottery: Lottery;
}

const DEFAULT_SLIDES = ["这是我为你准备的一份小惊喜\n愿你收到时，刚好有一点开心"];
const DEFAULT_GIFTS = [
  { text: "影视会员年卡", icon: "🎬" },
  { text: "电影票 2 张", icon: "🎟️" },
  { text: "红包 188 元", icon: "💸" },
  { text: "请吃一顿大餐", icon: "🍰" },
];
const SHARE_MODE_OPTIONS = [
  { value: "public", label: "公开访问", desc: "拿到链接即可参与" },
  { value: "passcode", label: "口令访问", desc: "需输入口令后访问" },
  { value: "closed", label: "关闭访问", desc: "链接暂不可访问" },
] as const;

function migrateConfig(raw: Record<string, unknown>): LotteryConfig {
  const c = raw as Record<string, unknown>;
  let slides: string[];
  if (Array.isArray(c.slides)) {
    slides = c.slides as string[];
  } else if (typeof c.greeting === "string" && c.greeting) {
    slides = [c.greeting as string];
  } else if (Array.isArray(c.introMessages)) {
    slides = c.introMessages as string[];
  } else {
    slides = [];
  }
  if (slides.length === 0) {
    slides = [...DEFAULT_SLIDES];
  }
  slides = slides.slice(0, 3);

  const parsedGifts = (c.gifts as LotteryConfig["gifts"]) ?? (c.prizes as LotteryConfig["gifts"]) ?? [];
  const gifts = parsedGifts.length > 0
    ? parsedGifts
    : DEFAULT_GIFTS.map((g) => ({ id: crypto.randomUUID(), text: g.text, icon: g.icon, probability: undefined }));

  return {
    gameType: (c.gameType as LotteryConfig["gameType"]) ?? "wheel",
    slides,
    senderName: (c.senderName as string) ?? (c.contactPerson as string) ?? "",
    senderAvatar: (c.senderAvatar as string) ?? (c.avatarUrl as string) ?? "",
    recipientPhoto: (c.recipientPhoto as string) ?? "",
    gifts,
    showPrizeList: (c.showPrizeList as boolean) ?? false,
    allowRetry: (c.allowRetry as boolean) ?? false,
    shareMode: (c.shareMode as LotteryConfig["shareMode"]) ?? ((c.shareEnabled as boolean) === false ? "closed" : "public"),
    sharePasscode: (c.sharePasscode as string) ?? "",
    decorEmojis: (c.decorEmojis as string[]) ?? (c.emojiList as string[]) ?? ["🎉", "🎊", "✨"],
  };
}

export function EditorForm({ lottery }: EditorFormProps) {
  const [config, setConfig] = useState<LotteryConfig>(() => migrateConfig(lottery.config as unknown as Record<string, unknown>));
  const [title, setTitle] = useState(lottery.title || "我的抽奖活动");
  const [status, setStatus] = useState(lottery.status);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [publishing, setPublishing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef({ title, config });

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/l/${lottery.slug}`
    : `/l/${lottery.slug}`;

  useEffect(() => {
    latestDataRef.current = { title, config };
  }, [title, config]);

  const doSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const { title: t, config: c } = latestDataRef.current;
      const res = await fetch(`/api/lottery/${lottery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, config: c }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("auto save failed", error);
      setSaveStatus("error");
      toast.error("自动保存失败，请检查网络后重试");
    }
  }, [lottery.id]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 800);
  }, [doSave]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      doSave();
    }
  }, [doSave]);

  const updateConfig = useCallback(
    <K extends keyof LotteryConfig>(key: K, value: LotteryConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateTitle = useCallback((val: string) => {
    setTitle(val);
    scheduleSave();
  }, [scheduleSave]);

  const canPublish = config.gifts.length > 0;

  const handlePublish = async () => {
    if (!canPublish) {
      toast.error("请至少添加一个礼物后再发布");
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setPublishing(true);
    try {
      const res = await fetch(`/api/lottery/${lottery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, config, status: "published" }),
      });
      if (!res.ok) throw new Error("Publish failed");
      setStatus("published");
      setShowShareDialog(true);
    } catch (error) {
      console.error("publish failed", error);
      toast.error("发布失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("链接已复制");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 shrink-0")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <PageHeader
            variant="compact"
            className="min-w-0 flex-1"
            title={title || "未命名活动"}
            titleSlot={(
              <Input
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="请输入活动名称"
                className="h-8 max-w-[220px] sm:max-w-[280px] text-sm font-semibold border-none bg-transparent px-1 focus-visible:ring-1"
              />
            )}
          />
        </div>
        <UserButton />
      </header>

      {/* Body: left form + right preview */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left panel — compact scrollable form */}
        <div className="order-2 md:order-1 w-full md:w-[340px] shrink-0 md:border-r border-border bg-background overflow-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Recipient photo */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>TA 的照片 <OptionalTag /></SectionLabel>
              <div className="flex items-center gap-3">
                <PhotoUpload value={config.recipientPhoto} onChange={(v) => updateConfig("recipientPhoto", v)} compact />
                <p className="text-xs text-muted-foreground leading-relaxed">上传对方照片<br />让开场更有仪式感</p>
              </div>
            </section>

            {/* Slides */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>文案 <OptionalTag /></SectionLabel>
              <SlideEditor slides={config.slides} onChange={(slides) => updateConfig("slides", slides)} />
            </section>

            {/* Game type — select dropdown */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>玩法</SectionLabel>
              <select
                value={config.gameType}
                onChange={(e) => updateConfig("gameType", e.target.value as LotteryConfig["gameType"])}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {GAME_TYPES.map((gt) => (
                  <option key={gt.value} value={gt.value}>
                    {gt.icon} {gt.label} — {gt.desc}
                  </option>
                ))}
              </select>
            </section>

            {/* Gifts */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>礼物 <RequiredMark /></SectionLabel>
              <GiftEditor gifts={config.gifts} onChange={(gifts) => updateConfig("gifts", gifts)} />
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">展示奖品内容</p>
                  <p className="text-[11px] text-muted-foreground">开启后，参与者可在抽奖前看到奖品列表</p>
                </div>
                <Switch
                  checked={config.showPrizeList}
                  onCheckedChange={(checked) => updateConfig("showPrizeList", checked)}
                  aria-label="切换是否展示奖品内容"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">允许重新抽取</p>
                  <p className="text-[11px] text-muted-foreground">开启后，参与者可在抽完后再次抽取</p>
                </div>
                <Switch
                  checked={config.allowRetry}
                  onCheckedChange={(checked) => updateConfig("allowRetry", checked)}
                  aria-label="切换是否允许重新抽取"
                />
              </div>
            </section>

          </div>
        </div>

        {/* Right preview */}
        <div className="order-1 md:order-2 flex-1 overflow-auto md:overflow-hidden bg-muted/25">
          <div className="h-full w-full max-w-[560px] mx-auto flex flex-col items-center gap-3 py-3 md:py-4 px-3 md:px-4">
            <div className="w-full max-w-[380px] shrink-0 rounded-xl border border-border/70 bg-background/95 backdrop-blur-sm px-3 py-2 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <StatusBadge published={status === "published"} />
                <SaveIndicator status={saveStatus} />
              </div>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {status === "published" && config.shareMode !== "closed" && (
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCopyLink}>
                    <Copy className="h-3 w-3" />
                    复制链接
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 rounded-full px-4"
                  onClick={handlePublish}
                  disabled={publishing || !canPublish}
                >
                  <Send className="h-3 w-3" />
                  {publishing ? "发布中..." : status === "published" ? "更新活动" : "发布活动"}
                </Button>
              </div>
            </div>
            <div className="w-full flex-1 min-h-[380px] md:min-h-0 flex items-start justify-center pt-1 pb-4">
              <PhonePreview>
                <LotteryPreview config={config} title={title} />
              </PhonePreview>
            </div>
          </div>
        </div>
      </div>

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={(open) => {
        if (!open) flushSave();
        setShowShareDialog(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">发布成功</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 overflow-y-auto pr-1">
            <p className="text-sm text-muted-foreground text-center">
              {config.shareMode === "closed"
                ? "当前分享已关闭。你可在编辑页开启后再发送链接。"
                : config.shareMode === "passcode"
                ? "活动已发布。参与者需输入访问口令后继续。"
                : "活动已可访问。请复制链接发送给参与者。"}
            </p>
            {config.shareMode !== "closed" ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <span className="text-sm font-mono truncate flex-1">{shareUrl}</span>
                <Button size="sm" variant="outline" className="shrink-0 gap-2 text-xs" onClick={handleCopyLink}>
                  <Copy className="h-3 w-3" />
                  复制
                </Button>
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <p className="text-xs text-muted-foreground">分享权限设置</p>
              <select
                value={config.shareMode}
                onChange={(e) => updateConfig("shareMode", e.target.value as LotteryConfig["shareMode"])}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {SHARE_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.desc}
                  </option>
                ))}
              </select>
              {config.shareMode === "passcode" ? (
                <Input
                  value={config.sharePasscode ?? ""}
                  onChange={(e) => updateConfig("sharePasscode", e.target.value)}
                  placeholder="请输入访问口令"
                  className="h-9 text-sm"
                />
              ) : null}
            </div>
            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <p className="text-xs text-muted-foreground">活动信息</p>
              <p className="text-sm"><span className="text-muted-foreground">名称：</span>{title || "未命名活动"}</p>
              <p className="text-sm"><span className="text-muted-foreground">状态：</span>{status === "published" ? "已发布" : "草稿"}</p>
              <p className="text-sm"><span className="text-muted-foreground">分享模式：</span>{getShareModeLabel(config.shareMode)}</p>
              {config.shareMode === "passcode" ? (
                <p className="text-sm"><span className="text-muted-foreground">访问口令：</span>{config.sharePasscode || "未设置"}</p>
              ) : null}
              <p className="text-sm">
                <span className="text-muted-foreground">玩法：</span>
                {GAME_TYPES.find((item) => item.value === config.gameType)?.label ?? "未选择"}
              </p>
              <p className="text-sm"><span className="text-muted-foreground">礼物数量：</span>{config.gifts.length}</p>
              <p className="text-sm"><span className="text-muted-foreground">文案页数：</span>{config.slides.length}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => setShowShareDialog(false)}>
                继续编辑
              </Button>
              <a
                href={`/l/${lottery.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "flex-1 gap-2 text-xs", config.shareMode === "closed" && "pointer-events-none opacity-50")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看效果
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Shared ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground/85">{children}</h3>;
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function OptionalTag() {
  return <span className="text-[10px] text-muted-foreground font-normal ml-1 px-1.5 py-0.5 rounded bg-muted/70">可选</span>;
}

function getShareModeLabel(mode: LotteryConfig["shareMode"]) {
  switch (mode) {
    case "public":
      return "公开访问";
    case "passcode":
      return "口令访问";
    case "closed":
      return "关闭访问";
    default: {
      const _exhaustiveCheck: never = mode;
      throw new Error(`Unhandled share mode: ${_exhaustiveCheck}`);
    }
  }
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Loader2 className="h-3 w-3 animate-spin" />
        保存中...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
        <Check className="h-3 w-3" />
        已保存
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-destructive shrink-0">保存失败，请重试</span>;
  }
  return null;
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        published ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
      )}
    >
      {published ? "已发布" : "草稿"}
    </span>
  );
}

function SlideEditor({ slides, onChange }: { slides: string[]; onChange: (s: string[]) => void }) {
  const addSlide = () => {
    if (slides.length >= 3) return;
    onChange([...slides, ""]);
  };

  const updateSlide = (idx: number, val: string) => {
    const next = [...slides];
    next[idx] = val;
    onChange(next);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    onChange(slides.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {slides.map((text, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">第 {i + 1} 屏</span>
            {slides.length > 1 && (
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                onClick={() => removeSlide(i)}
              >
                <Trash2 className="h-3 w-3" />
                移除
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => updateSlide(i, e.target.value)}
            placeholder={slides.length === 1 ? "输入开场文案，支持换行" : `第 ${i + 1} 屏文案`}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
          />
        </div>
      ))}
      {slides.length < 3 ? (
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
          onClick={addSlide}
        >
          <Plus className="h-3.5 w-3.5" />
          添加一屏（{slides.length}/3）
        </button>
      ) : (
        <p className="text-[11px] text-muted-foreground">最多 3 屏文案</p>
      )}
    </div>
  );
}


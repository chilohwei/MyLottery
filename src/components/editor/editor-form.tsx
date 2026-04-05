"use client";

import { useState, useCallback, useRef, useEffect, useDeferredValue } from "react";
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
  Eye,
  QrCode,
  Share2,
  Sparkles,
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
import { migrateConfig } from "@/lib/migrate-config";
import type { Lottery, LotteryConfig } from "@/types/lottery";
import { DEFAULT_RECIPIENT_AVATAR, GAME_TYPES, LOTTERY_THEMES } from "@/types/lottery";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorFormProps {
  lottery: Lottery;
}

const SHARE_MODE_OPTIONS = [
  { value: "public", label: "公开访问", desc: "拿到链接即可参与" },
  { value: "passcode", label: "口令访问", desc: "需输入口令后访问" },
  { value: "closed", label: "关闭访问", desc: "链接暂不可访问" },
] as const;

export function EditorForm({ lottery }: EditorFormProps) {
  const [config, setConfig] = useState<LotteryConfig>(() => migrateConfig(lottery.config as unknown as Record<string, unknown>, { fillDefaults: true }));
  const [title, setTitle] = useState(lottery.title || "我的抽奖活动");
  const [status, setStatus] = useState(lottery.status);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [publishing, setPublishing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [reopeningShare, setReopeningShare] = useState(false);
  const [qrEmphasized, setQrEmphasized] = useState(false);
  const deferredConfig = useDeferredValue(config);
  const deferredTitle = useDeferredValue(title);
  const qrCardRef = useRef<HTMLDivElement>(null);

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
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("链接已复制");
      setQrEmphasized(true);
      qrCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      window.setTimeout(() => setQrEmphasized(false), 1200);
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  const handleSystemShare = async () => {
    try {
      if (!navigator.share) {
        throw new Error("Web Share API not supported");
      }
      await navigator.share({
        title: title || "我的抽奖活动",
        text: "来参与我的抽奖活动",
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Web Share API not supported") {
        await handleCopyLink();
        toast.info("当前设备不支持系统分享，已为你复制链接");
        return;
      }
      console.error("system share failed", error);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) {
      const error = new Error("QR code is empty");
      console.error(error);
      toast.error("二维码尚未生成完成");
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `lottery-share-${lottery.slug}.png`;
    link.click();
  };

  const handleCopyQrImage = async () => {
    try {
      if (!qrDataUrl) {
        throw new Error("QR code is empty");
      }
      if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
        throw new Error("Clipboard image copy is not supported");
      }
      const res = await fetch(qrDataUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch QR image: ${res.status}`);
      }
      const blob = await res.blob();
      await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]);
      toast.success("二维码图片已复制");
    } catch (error) {
      console.error("copy qr image failed", error);
      toast.error("当前环境不支持复制图片，请使用下载");
    }
  };

  const handleReopenShare = async () => {
    if (reopeningShare) return;
    setReopeningShare(true);
    try {
      const nextConfig: LotteryConfig = { ...config, shareMode: "public" };
      const res = await fetch(`/api/lottery/${lottery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, config: nextConfig }),
      });
      if (!res.ok) {
        throw new Error("Reopen share failed");
      }
      setConfig(nextConfig);
      toast.success("已开启分享");
    } catch (error) {
      console.error("reopen share failed", error);
      toast.error("开启分享失败，请稍后重试");
    } finally {
      setReopeningShare(false);
    }
  };

  useEffect(() => {
    if (!showShareDialog) {
      setQrDataUrl("");
      setQrEmphasized(false);
    }
  }, [showShareDialog]);

  useEffect(() => {
    if (!showShareDialog || config.shareMode === "closed") return;
    let cancelled = false;

    import("qrcode")
      .then(({ toDataURL }) =>
        toDataURL(shareUrl, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
        }),
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((error) => {
        console.error("generate share qrcode failed", error);
        toast.error("二维码生成失败，请稍后重试");
      });

    return () => {
      cancelled = true;
    };
  }, [showShareDialog, shareUrl, config.shareMode]);

  const [mobilePreview, setMobilePreview] = useState(false);

  return (
    <div className="flex h-[100dvh] flex-col">
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
        <div className="flex items-center gap-2">
          <UserButton />
        </div>
      </header>

      {/* Body: left form + right preview */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left panel — compact scrollable form */}
        <div className="w-full md:w-[340px] shrink-0 md:border-r border-border bg-background overflow-auto flex-1 md:flex-none pb-20 md:pb-4">
          <div className="px-4 py-4 space-y-4">
            {/* Recipient photo */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>TA 的照片 <OptionalTag /></SectionLabel>
              <div className="flex items-center gap-3">
                <PhotoUpload
                  value={config.recipientPhoto}
                  onChange={(v) => updateConfig("recipientPhoto", v || DEFAULT_RECIPIENT_AVATAR)}
                  compact
                />
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

            {/* Theme */}
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <SectionLabel>主题</SectionLabel>
              <select
                value={config.theme}
                onChange={(e) => updateConfig("theme", e.target.value as LotteryConfig["theme"])}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {LOTTERY_THEMES.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label} — {theme.desc}
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

        {/* Right preview — desktop only */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-muted/25">
          <div className="h-full w-full max-w-[560px] mx-auto flex flex-col items-center gap-3 py-4 px-4">
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
            <div className="w-full flex-1 min-h-0 flex items-center justify-center pb-4">
              <PhonePreview>
                <LotteryPreview config={deferredConfig} title={deferredTitle} />
              </PhonePreview>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden shrink-0 border-t border-border bg-background px-4 py-3 safe-area-pb">
        <div className="h-4 mb-2 flex items-center">
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-sm gap-1.5 flex-1"
            onClick={() => setMobilePreview(true)}
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
          {status === "published" && config.shareMode !== "closed" && (
            <Button variant="outline" size="sm" className="h-10 text-sm gap-1.5" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            className="h-10 text-sm gap-1.5 rounded-full flex-1 px-5"
            onClick={handlePublish}
            disabled={publishing || !canPublish}
          >
            <Send className="h-4 w-4" />
            {publishing ? "发布中..." : status === "published" ? "更新" : "发布"}
          </Button>
        </div>
      </div>

      {/* Mobile preview overlay */}
      {mobilePreview && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium">预览效果</h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setMobilePreview(false)}>
              关闭
            </Button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <PhonePreview>
              <LotteryPreview config={deferredConfig} title={deferredTitle} />
            </PhonePreview>
          </div>
        </div>
      )}

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={(open) => {
        if (!open) flushSave();
        setShowShareDialog(open);
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Sparkles className="inline h-4 w-4 text-primary mr-1.5 -translate-y-px" />
              分享活动
            </DialogTitle>
          </DialogHeader>

          {config.shareMode === "closed" ? (
            <div className="space-y-4 py-1">
              <p className="text-sm text-muted-foreground text-center">
                当前分享已关闭，可一键重新开启后立即发送链接。
              </p>
              <Button
                className="w-full h-10 text-sm font-medium"
                onClick={handleReopenShare}
                disabled={reopeningShare}
              >
                {reopeningShare ? "开启中..." : "重新开启分享"}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div
                ref={qrCardRef}
                className={cn(
                  "flex items-start gap-5 rounded-xl border border-border bg-muted/15 p-5 transition-all duration-300",
                  qrEmphasized && "ring-2 ring-primary/35 shadow-md",
                )}
              >
                <div className="shrink-0 rounded-lg border border-border bg-white p-2">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="分享二维码" className="h-[140px] w-[140px]" />
                  ) : (
                    <div className="h-[140px] w-[140px] flex items-center justify-center text-xs text-muted-foreground">
                      生成中...
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col self-stretch gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">分享链接</p>
                    <div className="bg-muted/40 rounded-md px-2 py-1.5 border border-border/50 flex items-center gap-1.5">
                      <p
                        className="flex-1 min-w-0 text-xs font-mono text-foreground/80 whitespace-nowrap overflow-hidden text-ellipsis"
                        title={shareUrl}
                      >
                        {shareUrl}
                      </p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                      className="h-7 w-7 shrink-0 active:scale-95"
                        onClick={handleCopyLink}
                        aria-label="复制链接"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">分享权限</p>
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

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs active:scale-95"
                      onClick={handleCopyQrImage}
                      disabled={!qrDataUrl}
                    >
                      <Copy className="h-3 w-3" />
                      复制二维码
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs active:scale-95" onClick={handleDownloadQr} disabled={!qrDataUrl}>
                      <QrCode className="h-3 w-3" />
                      下载二维码
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full h-10 gap-1.5 text-sm font-medium active:scale-[0.99]" onClick={handleSystemShare}>
                <Share2 className="h-3.5 w-3.5" />
                发送给好友
              </Button>
            </div>
          )}
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


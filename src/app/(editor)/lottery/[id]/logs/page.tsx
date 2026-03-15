import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Eye,
  Trophy,
  Clock,
  Users,
  Send,
  Share2,
  TrendingUp,
  Gift,
} from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { GAME_TYPES, type Lottery, type PrizeLog } from "@/types/lottery";

export default async function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: lottery, error: lotteryErr } = await supabase
    .from("lotteries")
    .select("*")
    .eq("id", id)
    .eq("clerk_user_id", userId)
    .single();

  if (lotteryErr || !lottery) notFound();

  const { data: logs } = await supabase
    .from("prize_logs")
    .select("*")
    .eq("lottery_id", id)
    .order("time", { ascending: false });

  const typedLottery = lottery as Lottery;
  const typedLogs = (logs ?? []) as PrizeLog[];
  const winCount = typedLogs.filter((l) => l.prize !== "none").length;
  const isDraft = typedLottery.status === "draft";
  const hasData = typedLottery.view_count > 0 || typedLogs.length > 0;
  const conversionRate =
    typedLottery.view_count > 0
      ? ((typedLogs.length / typedLottery.view_count) * 100).toFixed(1)
      : "0.0";

  const gameType = GAME_TYPES.find(
    (g) => g.value === typedLottery.config.gameType,
  );

  const prizeDistribution = typedLogs.reduce<
    Record<string, { icon: string; text: string; count: number }>
  >((acc, log) => {
    const key = log.prize_text || log.prize;
    if (!acc[key]) {
      acc[key] = { icon: log.prize_icon, text: log.prize_text, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});
  const prizeStats = Object.values(prizeDistribution).sort(
    (a, b) => b.count - a.count,
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 backdrop-blur-sm px-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={`/lottery/${id}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 shrink-0",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Separator orientation="vertical" className="!self-center h-5" />
          <span className="font-semibold truncate max-w-[140px] sm:max-w-none">
            {typedLottery.title}
          </span>
          <Badge variant="outline" className="text-[11px] shrink-0 hidden sm:inline-flex">
            {gameType?.icon} {gameType?.label}
          </Badge>
        </div>
        <UserButton />
      </header>

      <main className="flex-1 overflow-auto bg-muted/15">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                数据概览
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isDraft
                  ? "当前为草稿，发布后开始统计"
                  : `创建于 ${new Date(typedLottery.created_at).toLocaleDateString("zh-CN")}`}
              </p>
            </div>
            {isDraft ? (
              <Link
                href={`/lottery/${id}/edit`}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full gap-2 shrink-0",
                )}
              >
                <Send className="h-3.5 w-3.5" />
                去发布
              </Link>
            ) : (
              <Badge
                variant="default"
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
              >
                已发布
              </Badge>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              label="页面访问"
              value={typedLottery.view_count}
              color="text-sky-600 bg-sky-50"
            />
            <StatCard
              icon={<Trophy className="h-4 w-4" />}
              label="抽奖次数"
              value={typedLogs.length}
              color="text-amber-600 bg-amber-50"
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="中奖次数"
              value={winCount}
              color="text-violet-600 bg-violet-50"
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="参与率"
              value={`${conversionRate}%`}
              color="text-emerald-600 bg-emerald-50"
            />
          </div>

          {/* Share link bar */}
          {!isDraft && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-xs sm:text-sm font-mono text-muted-foreground truncate flex-1">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/l/${typedLottery.slug}`
                  : `/l/${typedLottery.slug}`}
              </code>
              <CopyLinkButton
                url={`/l/${typedLottery.slug}`}
                variant="outline"
                label="复制"
                className="shrink-0"
              />
            </div>
          )}

          {/* Prize distribution */}
          {prizeStats.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Gift className="h-3.5 w-3.5" />
                奖品分布
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {prizeStats.map((p) => (
                  <div
                    key={p.text}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{p.text}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.count} 次
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Records list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              抽奖记录
              {typedLogs.length > 0 && (
                <span className="text-[11px] font-normal">
                  （共 {typedLogs.length} 条）
                </span>
              )}
            </h2>

            {typedLogs.length === 0 ? (
              isDraft ? (
                <EmptyState
                  icon={<Send className="h-5 w-5 text-amber-500" />}
                  color="bg-amber-50"
                  title="活动尚未发布"
                  desc="发布后将生成可分享链接，参与者的抽奖记录会实时显示在这里"
                  action={
                    <Link
                      href={`/lottery/${id}/edit`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "rounded-full gap-2",
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      去发布
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Share2 className="h-5 w-5 text-sky-500" />}
                  color="bg-sky-50"
                  title="等待参与者"
                  desc="活动已发布，分享链接后参与记录会实时出现在这里"
                  action={
                    <CopyLinkButton
                      url={`/l/${typedLottery.slug}`}
                      variant="outline"
                      label="复制分享链接"
                      className="rounded-full"
                    />
                  }
                />
              )
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/50 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  <span>奖品</span>
                  <span className="w-28 text-right">来源</span>
                  <span className="w-40 text-right">时间</span>
                </div>
                <div className="divide-y divide-border">
                  {typedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-lg shrink-0">{log.prize_icon}</span>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {log.prize_text}
                      </span>
                      <span className="text-[11px] text-muted-foreground hidden sm:block w-28 text-right truncate">
                        {[log.location, log.ip].filter(Boolean).join(" · ") ||
                          "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 sm:w-40 text-right">
                        {new Date(log.time).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({
  icon,
  color,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 sm:p-10 text-center space-y-4">
      <div className="flex justify-center">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center",
            color,
          )}
        >
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          {desc}
        </p>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-lg",
            color,
          )}
        >
          {icon}
        </div>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

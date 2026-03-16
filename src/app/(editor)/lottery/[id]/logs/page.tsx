import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Eye,
  Trophy,
  Clock,
  Send,
  Share2,
  TrendingUp,
} from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { GAME_TYPES, type Lottery, type PrizeLog } from "@/types/lottery";
import { LogRecordList } from "./record-list";

export default async function LogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { from } = await searchParams;
  const supabase = createServerClient();
  const backHref = from === "edit" ? `/lottery/${id}/edit` : "/dashboard";

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
  const isDraft = typedLottery.status === "draft";
  const conversionRate =
    typedLottery.view_count > 0
      ? ((typedLogs.length / typedLottery.view_count) * 100).toFixed(1)
      : "0.0";

  const gameType = GAME_TYPES.find(
    (g) => g.value === typedLottery.config.gameType,
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 backdrop-blur-sm px-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={backHref}
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
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
              icon={<TrendingUp className="h-4 w-4" />}
              label="参与率"
              value={`${conversionRate}%`}
              color="text-emerald-600 bg-emerald-50"
            />
          </div>

          {/* Records */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              参与记录
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
              <LogRecordList logs={typedLogs} />
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

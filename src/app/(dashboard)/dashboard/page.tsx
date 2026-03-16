import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles, Share2, BarChart3 } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button-variants";
import { LotteryCardList } from "@/components/dashboard/lottery-card-list";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import type { Lottery } from "@/types/lottery";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createServerClient();
  const { data: lotteries } = await supabase
    .from("lotteries")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  const items = (lotteries ?? []) as Lottery[];

  const lotteryIds = items.map((l) => l.id);
  let drawCounts: Record<string, number> = {};
  if (lotteryIds.length > 0) {
    const { data: logs } = await supabase
      .from("prize_logs")
      .select("lottery_id")
      .in("lottery_id", lotteryIds);
    if (logs) {
      for (const log of logs) {
        drawCounts[log.lottery_id] = (drawCounts[log.lottery_id] ?? 0) + 1;
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg flex flex-col items-center justify-center py-20 text-center">
        <PageHeader
          variant="centered"
          icon={<Sparkles className="h-5 w-5" />}
          title="创建你的第一场心意活动"
          subtitle="填写文案、设置礼物、生成链接，三步完成一场清晰而有温度的互动"
          primaryAction={(
            <Link
              href="/lottery/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full gap-2 px-8")}
            >
              <Plus className="h-4 w-4" />
              新建活动
            </Link>
          )}
          className="mb-8"
        />

        <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-sm">
          <StepHint
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            label="写文案"
            desc="传达你的心意"
          />
          <StepHint
            icon={<Share2 className="h-4 w-4 text-sky-500" />}
            label="设礼物"
            desc="明确奖品内容"
          />
          <StepHint
            icon={<BarChart3 className="h-4 w-4 text-violet-500" />}
            label="发链接"
            desc="邀请对方参与"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        className="mb-6"
        icon={<Sparkles className="h-4 w-4" />}
        title="活动中心"
        subtitle={`当前共 ${items.length} 个活动，可继续编辑并分享`}
        primaryAction={
          <Link
            href="/lottery/new"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-2")}
          >
            <Plus className="h-3.5 w-3.5" />
            新建活动
          </Link>
        }
      />
      <LotteryCardList lotteries={items} drawCounts={drawCounts} />
    </div>
  );
}

function StepHint({
  icon,
  label,
  desc,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-1.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        {icon}
      </div>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}


import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase/server";
import { PublicLotteryClient } from "./client";
import type { Lottery } from "@/types/lottery";

export const dynamic = "force-dynamic";

export default async function PublicLotteryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug } = await params;
  const { code } = await searchParams;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("lotteries")
    .select("id, slug, title, status, config, view_count")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <PublicUnavailable
        title="活动已失效"
        subtitle="该活动可能已被删除或链接已过期，请联系发起人确认最新链接。"
      />
    );
  }

  const lottery = data as Lottery;
  const legacyShareEnabled = (lottery.config as unknown as { shareEnabled?: boolean })?.shareEnabled;
  const shareMode = lottery.config?.shareMode ?? (legacyShareEnabled === false ? "closed" : "public");
  const sharePasscode = lottery.config?.sharePasscode ?? "";

  if (lottery.status !== "published" || shareMode === "closed") {
    return (
      <PublicUnavailable
        title="活动暂不可访问"
        subtitle="发起人已关闭分享权限。请稍后再试，或联系发起人重新开启分享。"
      />
    );
  }

  if (shareMode === "passcode" && code !== sharePasscode) {
    const hasAttempt = typeof code === "string";
    return <PublicPasscodeGate slug={slug} error={hasAttempt} />;
  }

  const { error: rpcError } = await supabase.rpc("increment_view_count", { lottery_slug: slug });
  if (rpcError) {
    console.error("increment_view_count failed", rpcError);
  }

  const { sharePasscode: _removed, ...safeConfig } = lottery.config ?? {};
  const safeLottery = { ...lottery, config: safeConfig } as Lottery;

  return <PublicLotteryClient lottery={safeLottery} />;
}

function PublicPasscodeGate({ slug, error }: { slug: string; error?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center gradient-warm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/85 p-8 text-center shadow-xl backdrop-blur-sm">
        <PageHeader
          icon={<AlertCircle className="h-4 w-4" />}
          title="请输入访问口令"
          subtitle="该活动已开启口令保护，请向发起人获取口令后继续访问。"
          variant="centered"
        />
        <form method="get" action={`/l/${slug}`} className="mt-6 space-y-2">
          <div className="flex gap-2">
            <label htmlFor="passcode-input" className="sr-only">访问口令</label>
            <input
              id="passcode-input"
              name="code"
              type="text"
              placeholder="访问口令"
              autoFocus
              className={cn(
                "h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring",
                error ? "border-destructive" : "border-border",
              )}
            />
            <button type="submit" className={cn(buttonVariants(), "h-10 px-4 text-sm")}>
              进入
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive">口令不正确，请重新输入</p>
          )}
        </form>
      </div>
    </div>
  );
}

function PublicUnavailable({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center gradient-warm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/85 p-8 text-center shadow-xl backdrop-blur-sm">
        <PageHeader
          icon={<AlertCircle className="h-4 w-4" />}
          title={title}
          subtitle={subtitle}
          variant="centered"
        />
        <Link
          href="/"
          className={cn(buttonVariants(), "rounded-full gap-2 mt-6")}
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}

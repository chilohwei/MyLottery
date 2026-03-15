"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
  Gift,
  Eye,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GAME_TYPES, type Lottery } from "@/types/lottery";

const ACCENT_GRADIENTS = [
  "linear-gradient(135deg, #fed6e3, #f5e6cc)",
  "linear-gradient(135deg, #a8edea, #e8dff5)",
  "linear-gradient(135deg, #e8dff5, #fed6e3)",
  "linear-gradient(135deg, #f5e6cc, #a8edea)",
];

interface LotteryCardListProps {
  lotteries: Lottery[];
  drawCounts: Record<string, number>;
}

export function LotteryCardList({ lotteries, drawCounts }: LotteryCardListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Lottery | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lottery/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("已删除");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error("delete lottery failed", error);
      toast.error("删除失败，请稍后重试");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {lotteries.map((lottery, i) => {
          const giftCount = lottery.config.gifts?.length ?? 0;
          const recipientPhoto = lottery.config.recipientPhoto ?? "";
          const isPublished = lottery.status === "published";
          const gameType = GAME_TYPES.find((item) => item.value === lottery.config.gameType);
          const gradient = ACCENT_GRADIENTS[i % ACCENT_GRADIENTS.length];

          return (
            <div
              key={lottery.id}
              className="group rounded-2xl bg-card border border-border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="relative h-24 overflow-hidden" style={{ background: gradient }}>
                {recipientPhoto ? (
                  <img
                    src={recipientPhoto}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/80 px-2.5 py-1 text-xs text-foreground font-medium">
                    {gameType?.icon ?? "🎲"} {gameType?.label ?? "未知玩法"}
                  </span>
                  <Badge
                    variant={isPublished ? "default" : "secondary"}
                    className="text-[11px] h-6 px-2 shrink-0"
                  >
                    {isPublished ? "已发布" : "草稿"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3.5">
                {/* Title */}
                <div className="flex items-start gap-2">
                  <Link
                    href={`/lottery/${lottery.id}/edit`}
                    className="font-semibold text-base leading-snug line-clamp-1 flex-1 hover:text-primary transition-colors cursor-pointer"
                  >
                    {lottery.title}
                  </Link>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-3 w-3" />
                    {giftCount} 个奖品
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    {lottery.view_count} 次访问
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="h-3 w-3" />
                    {drawCounts[lottery.id] ?? 0} 次抽奖
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(lottery.updated_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/lottery/${lottery.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    继续编辑
                  </Link>

                  {isPublished && (
                    <a
                      href={`/l/${lottery.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      预览页面
                    </a>
                  )}

                  <Link
                    href={`/lottery/${lottery.id}/logs`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    查看数据
                  </Link>

                  <Tooltip>
                    <TooltipTrigger
                      render={<button type="button" />}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto cursor-pointer"
                      onClick={() => setDeleteTarget(lottery)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">删除</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除「{deleteTarget?.title}」后将不可恢复，相关抽奖记录也会一并清除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

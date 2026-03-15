"use client";

import { Plus, GripVertical, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/editor/emoji-picker";
import type { Gift } from "@/types/lottery";

const TEMPLATES: { icon: string; text: string }[] = [
  { icon: "🎬", text: "影视会员年卡" },
  { icon: "🎟️", text: "电影票 2 张" },
  { icon: "💸", text: "红包 188 元" },
  { icon: "🌠", text: "帮实现 1 个愿望" },
  { icon: "📸", text: "一起拍照" },
  { icon: "🍰", text: "请吃一顿大餐" },
];

interface GiftEditorProps {
  gifts: Gift[];
  onChange: (gifts: Gift[]) => void;
}

const MAX_GIFTS = 6;

export function GiftEditor({ gifts, onChange }: GiftEditorProps) {
  const isFull = gifts.length >= MAX_GIFTS;

  const addGift = () => {
    if (isFull) return;
    onChange([
      ...gifts,
      { id: crypto.randomUUID(), text: "", icon: "🎁", probability: undefined },
    ]);
  };

  const addTemplate = () => {
    const remaining = MAX_GIFTS - gifts.length;
    if (remaining <= 0) return;
    const tplGifts: Gift[] = TEMPLATES.slice(0, remaining).map((t) => ({
      id: crypto.randomUUID(),
      text: t.text,
      icon: t.icon,
      probability: undefined,
    }));
    onChange([...gifts, ...tplGifts]);
  };

  const updateGift = (index: number, updates: Partial<Gift>) => {
    const next = gifts.map((g, i) => (i === index ? { ...g, ...updates } : g));
    onChange(next);
  };

  const removeGift = (index: number) => {
    onChange(gifts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {gifts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center space-y-3">
          <div className="text-3xl">🎁</div>
          <div className="space-y-1">
            <p className="text-sm font-medium">还没有礼物</p>
            <p className="text-xs text-muted-foreground">
              添加你准备的礼物，对方抽中哪个就送哪个
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-1">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={addTemplate}>
              <Zap className="h-3 w-3" />
              填充示例
            </Button>
            <Button size="sm" className="text-xs gap-1.5" onClick={addGift}>
              <Plus className="h-3 w-3" />
              逐个添加
            </Button>
          </div>
        </div>
      )}
      {gifts.map((gift, i) => (
        <div
          key={gift.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5"
        >
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50 cursor-grab" />
          <EmojiPicker value={gift.icon} onChange={(emoji) => updateGift(i, { icon: emoji })} />
          <Input
            value={gift.text}
            onChange={(e) => updateGift(i, { text: e.target.value })}
            className="h-9 flex-1 text-sm"
            placeholder="礼物名称"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => removeGift(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {gifts.length > 0 && !isFull && (
        <Button variant="outline" size="sm" className="w-full rounded-lg text-xs gap-1.5" onClick={addGift}>
          <Plus className="h-3.5 w-3.5" />
          添加礼物（{gifts.length}/{MAX_GIFTS}）
        </Button>
      )}
      {isFull && (
        <p className="text-xs text-muted-foreground text-center">已达上限 {MAX_GIFTS} 个</p>
      )}
    </div>
  );
}

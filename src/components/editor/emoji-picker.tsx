"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "奖品",
    emojis: ["🏆", "🥇", "🥈", "🥉", "🎁", "🎀", "💎", "👑", "🏅", "⭐", "💰", "💵"],
  },
  {
    label: "食物",
    emojis: ["🍕", "🍔", "🍰", "🧁", "🍩", "🍫", "☕", "🍷", "🍜", "🍣", "🥤", "🍦"],
  },
  {
    label: "电子",
    emojis: ["📱", "💻", "🎧", "⌚", "📷", "🎮", "🖥️", "📺", "🔋", "💡", "🎵", "🎬"],
  },
  {
    label: "生活",
    emojis: ["🎟️", "✈️", "🏖️", "🎭", "🎪", "🛍️", "💐", "🧸", "🎈", "🎯", "🎲", "🃏"],
  },
  {
    label: "表情",
    emojis: ["🎉", "🎊", "✨", "🌟", "💫", "❤️", "🔥", "🍀", "🌈", "🦄", "🐱", "🐶"],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" />}
        className="h-8 w-10 rounded-md border border-border bg-background text-center text-base hover:bg-muted transition-colors shrink-0 cursor-pointer"
      >
        {value || "🎁"}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="space-y-2">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-muted-foreground font-medium px-1 mb-1">{group.label}</p>
              <div className="grid grid-cols-6 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`h-8 w-full rounded-md text-base hover:bg-muted transition-colors ${
                      value === emoji ? "bg-primary/10 ring-1 ring-primary/30" : ""
                    }`}
                    onClick={() => {
                      onChange(emoji);
                      setOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

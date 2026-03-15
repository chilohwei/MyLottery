"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Gift } from "@/types/lottery";

interface BlindBoxProps {
  gifts: Gift[];
  showPrizeList?: boolean;
  allowRetry?: boolean;
  interactive?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

export function BlindBox({ gifts, showPrizeList = true, allowRetry = false, interactive = false, onResult }: BlindBoxProps) {
  const [state, setState] = useState<"idle" | "shaking" | "opened">("idle");
  const [winGift, setWinGift] = useState<Gift | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const open = useCallback(() => {
    if (!interactive || state !== "idle" || gifts.length === 0) return;

    setState("shaking");
    const wi = Math.floor(Math.random() * gifts.length);
    const gift = gifts[wi];

    setTimeout(() => {
      setState("opened");
      setWinGift(gift);
      onResultRef.current?.(gift, { inline: true });
    }, 1200);
  }, [interactive, state, gifts]);

  const reset = () => {
    setState("idle");
    setWinGift(null);
  };

  if (gifts.length === 0) return null;
  const maxHints = gifts.length <= 4 ? gifts.length : 4;
  const hintGifts = gifts.slice(0, maxHints);
  const hiddenCount = gifts.length - hintGifts.length;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {showPrizeList && state !== "opened" && (
        <div className="flex flex-wrap gap-1.5 justify-center mb-3 max-w-[280px]">
          {hintGifts.map((gift, i) => (
            <span
              key={gift.id}
              className="inline-flex items-center gap-1 bg-white/50 rounded-full px-2 py-0.5 text-[10px] text-foreground/50"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-sm leading-none">{gift.icon}</span>
              {gift.text}
            </span>
          ))}
          {hiddenCount > 0 ? (
            <span className="inline-flex items-center bg-white/50 rounded-full px-2 py-0.5 text-[10px] text-foreground/55">
              +{hiddenCount} 个
            </span>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "relative w-40 h-48 cursor-pointer transition-transform touch-manipulation",
          state === "opened" && "scale-105",
          interactive && state === "idle" && "hover:scale-105 active:scale-95"
        )}
        style={state === "shaking" ? { animation: "blindbox-shake 0.15s ease-in-out infinite" } : undefined}
        onClick={open}
      >
        {state === "opened" && winGift ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl border-2 border-amber-200 shadow-xl animate-in zoom-in-75 duration-500">
            <span className="text-6xl mb-1">{winGift.icon}</span>
            <span className="text-sm font-semibold text-amber-800 px-3 text-center truncate max-w-full">{winGift.text}</span>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 top-5 bg-gradient-to-b from-rose-300 to-rose-400 rounded-2xl border-2 border-rose-300/80 shadow-xl" />
            <div className="absolute top-5 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-amber-300/70 rounded-sm" />
            <div className="absolute top-1/2 left-0 right-0 h-5 bg-amber-300/70 rounded-sm translate-y-1" />
            <div className={cn(
              "absolute -left-2 -right-2 top-0 h-14 bg-gradient-to-b from-rose-400 to-rose-500 rounded-xl border-2 border-rose-500 shadow-lg transition-transform duration-300 z-10",
              state === "shaking" && "-translate-y-2"
            )}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-5 bg-amber-300 rounded-full border border-amber-400/50 shadow-sm" />
            </div>
            <div className="absolute inset-0 top-14 flex items-center justify-center">
              <span className="text-5xl opacity-50">❓</span>
            </div>
          </>
        )}
      </div>

      {state === "opened" && winGift ? (
        <p className="text-sm text-amber-700 mt-3 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
          🎉 恭喜获得「{winGift.text}」
        </p>
      ) : (
        <p className="text-sm text-foreground/60 mt-3 font-medium">
          {state === "idle"
            ? gifts.length === 1
              ? "📦 点击开启奖品"
              : "📦 点击开启盲盒"
            : state === "shaking"
            ? "✨ 正在开启..."
            : ""}
        </p>
      )}

      {state === "opened" && interactive && allowRetry && (
        <button
          type="button"
          className="mt-2 text-xs text-foreground/55 hover:text-foreground/75 transition-colors cursor-pointer"
          onClick={reset}
        >
          ↻ 重新抽取
        </button>
      )}
    </div>
  );
}

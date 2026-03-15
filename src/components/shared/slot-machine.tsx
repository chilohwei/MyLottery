"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Gift } from "@/types/lottery";

interface SlotMachineProps {
  gifts: Gift[];
  allowRetry?: boolean;
  interactive?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

const REEL_ITEMS = 20;
const ITEM_H = 72;
const VISIBLE = 3;
const VIEWPORT_H = ITEM_H * VISIBLE;
const REEL_W = 100;

export function SlotMachine({ gifts, allowRetry = false, interactive = false, onResult }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]);
  const [resultGift, setResultGift] = useState<Gift | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const buildReel = useCallback(() => {
    if (gifts.length === 0) return [];
    const items: Gift[] = [];
    for (let i = 0; i < REEL_ITEMS; i++) {
      items.push(gifts[i % gifts.length]);
    }
    return items;
  }, [gifts]);

  const reelItems = buildReel();
  const reelCount = gifts.length === 1 ? 1 : gifts.length === 2 ? 2 : 3;
  const reelWidth = reelCount <= 2 ? REEL_W + 12 : REEL_W;

  useEffect(() => {
    setReelOffsets(Array.from({ length: reelCount }).map(() => 0));
  }, [reelCount]);

  const spin = useCallback(() => {
    if (!interactive || spinning || gifts.length === 0) return;
    setSpinning(true);
    setResultGift(null);

    const wi = Math.floor(Math.random() * gifts.length);
    const targetPos = (REEL_ITEMS - VISIBLE) * ITEM_H - (wi * ITEM_H);
    const offsets = Array.from({ length: reelCount }).map((_, idx) =>
      idx === reelCount - 1
        ? targetPos
        : targetPos + Math.floor(Math.random() * 2) * ITEM_H * gifts.length
    );

    setReelOffsets(offsets);

    setTimeout(() => {
      setSpinning(false);
      const gift = gifts[wi];
      setResultGift(gift);
      onResultRef.current?.(gift, { inline: true });
    }, 3200);
  }, [interactive, spinning, gifts, reelCount]);

  if (gifts.length === 0) return null;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[340px]">
      {gifts.length <= 2 ? (
        <p className="text-xs text-foreground/55 mb-2">
          当前奖品较少，建议至少设置 3 项以获得更完整体验
        </p>
      ) : null}
      {/* Machine frame */}
      <div className="relative bg-gradient-to-b from-amber-100/80 to-amber-200/60 rounded-3xl p-3 border border-amber-300/40 shadow-lg">
        <div className="flex gap-2 bg-foreground/5 rounded-2xl p-2 border border-foreground/8 shadow-inner justify-center">
          {Array.from({ length: reelCount }).map((_, reelIdx) => (
            <div
              key={reelIdx}
              className="relative overflow-hidden rounded-xl bg-white/90"
              style={{ width: reelWidth, height: VIEWPORT_H }}
            >
              <div
                className="flex flex-col transition-transform"
                style={{
                  transform: `translateY(${spinning ? -(reelOffsets[reelIdx] ?? 0) : 0}px)`,
                  transition: spinning
                    ? `transform ${2.2 + reelIdx * 0.5}s cubic-bezier(0.2, 0.8, 0.3, 1)`
                    : "none",
                }}
              >
                {reelItems.map((gift, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center shrink-0"
                    style={{ height: ITEM_H }}
                  >
                    <span className="text-3xl">{gift.icon}</span>
                    <span className="text-[10px] text-foreground/50 truncate max-w-[96px] mt-0.5">
                      {gift.text}
                    </span>
                  </div>
                ))}
              </div>
              {/* Win line */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none" style={{ height: ITEM_H }}>
                <div className="absolute inset-x-0 top-0 h-px bg-primary/25" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-primary/25" />
              </div>
              {/* Top/bottom fade */}
              <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Result display or spin button */}
      {resultGift && !spinning ? (
        <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full px-5 py-2 border border-amber-200 shadow-sm">
            <span className="text-2xl">{resultGift.icon}</span>
            <span className="text-sm font-semibold text-amber-800">{resultGift.text}</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1.5">🎉 恭喜获得</p>
          {interactive && allowRetry && (
            <button
              type="button"
              className="mt-2 text-xs text-foreground/55 hover:text-foreground/75 transition-colors cursor-pointer"
              onClick={() => { setResultGift(null); }}
            >
              ↻ 重新抽取
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "mt-5 min-h-11 px-10 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg cursor-pointer",
            interactive && !spinning
              ? "bg-gradient-to-b from-rose-400 to-rose-500 text-white hover:scale-105 active:scale-95 cursor-pointer shadow-rose-200/60 ring-4 ring-white/50"
              : spinning
              ? "bg-gradient-to-b from-rose-400 to-rose-500 text-white animate-pulse ring-4 ring-white/50"
              : "bg-muted text-muted-foreground"
          )}
          onClick={spin}
          disabled={!interactive || spinning}
        >
          {spinning ? "✨ 抽奖进行中..." : "🎰 开始抽奖"}
        </button>
      )}
    </div>
  );
}

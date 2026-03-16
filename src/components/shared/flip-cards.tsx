"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Gift } from "@/types/lottery";

const CARD_COLORS = [
  "from-rose-200 to-rose-300",
  "from-amber-200 to-amber-300",
  "from-emerald-200 to-emerald-300",
  "from-sky-200 to-sky-300",
  "from-violet-200 to-violet-300",
  "from-pink-200 to-pink-300",
  "from-orange-200 to-orange-300",
  "from-cyan-200 to-cyan-300",
];

interface FlipCardsProps {
  gifts: Gift[];
  showPrizeList?: boolean;
  allowRetry?: boolean;
  interactive?: boolean;
  highContrastText?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

export function FlipCards({
  gifts,
  showPrizeList = true,
  allowRetry = false,
  interactive = false,
  highContrastText = false,
  onResult,
}: FlipCardsProps) {
  const [flippedIdx, setFlippedIdx] = useState<number | null>(null);
  const [winGift, setWinGift] = useState<Gift | null>(null);
  const [shuffledGifts, setShuffledGifts] = useState<Gift[]>(() => [...gifts]);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    setShuffledGifts([...gifts]);
    setFlippedIdx(null);
    setWinGift(null);
  }, [gifts]);

  const handlePick = useCallback((idx: number) => {
    if (!interactive || flippedIdx !== null || gifts.length === 0) return;

    const displayCards = gifts.length <= 6 ? gifts : gifts.slice(0, 6);
    const wi = Math.floor(Math.random() * displayCards.length);
    const gift = displayCards[wi];

    const newShuffled = [...shuffledGifts];
    newShuffled[idx] = gift;
    setShuffledGifts(newShuffled);

    setFlippedIdx(idx);
    setWinGift(gift);

    setTimeout(() => {
      onResultRef.current?.(gift, { inline: true });
    }, 800);
  }, [interactive, flippedIdx, gifts, shuffledGifts]);

  const reset = () => {
    setFlippedIdx(null);
    setWinGift(null);
    setShuffledGifts([...gifts]);
  };

  if (gifts.length === 0) return null;

  const displayCards = gifts.length <= 6 ? gifts : gifts.slice(0, 6);
  const cols = displayCards.length <= 2 ? displayCards.length : displayCards.length === 4 ? 2 : 3;
  const cardW = displayCards.length <= 2 ? 120 : displayCards.length <= 4 ? 106 : 96;
  const cardH = displayCards.length <= 2 ? 156 : displayCards.length <= 4 ? 140 : 128;

  return (
    <div className="flex flex-col items-center select-none w-full px-4">
      <p className={`text-sm mb-4 font-medium ${highContrastText ? "text-white/85" : "text-foreground/60"}`}>
        {flippedIdx === null ? "🃏 请选择一张卡牌" : ""}
      </p>

      <div
        className="grid gap-3.5 justify-center"
        style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)` }}
      >
        {displayCards.map((gift, i) => {
          const isFlipped = flippedIdx === i;
          const isOther = flippedIdx !== null && flippedIdx !== i;
          const colorClass = CARD_COLORS[i % CARD_COLORS.length];

          return (
            <div key={i} className="perspective-[600px]" style={{ width: cardW, height: cardH }}>
              <div
                className={cn(
                  "relative w-full h-full transition-all duration-700 [transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]",
                  isOther && "opacity-30 scale-90 blur-[1px]"
                )}
                onClick={() => handlePick(i)}
                style={{ cursor: interactive && flippedIdx === null ? "pointer" : "default", touchAction: "manipulation" }}
              >
                {/* Card face-down */}
                <div className={cn(
                  "absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-gradient-to-br shadow-lg flex flex-col items-center justify-center border border-white/60 gap-1.5",
                  colorClass,
                  interactive && flippedIdx === null && "hover:scale-105 hover:shadow-xl transition-all"
                )}>
                  <span className="text-3xl">{showPrizeList ? gift.icon : "❓"}</span>
                  <span className="text-[10px] text-foreground/50 font-medium px-2 text-center truncate max-w-full leading-tight">
                    {showPrizeList ? gift.text : "未知奖品"}
                  </span>
                </div>
                {/* Card face-up: reveal result */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100 shadow-lg flex flex-col items-center justify-center border-2 border-amber-200 gap-1">
                  <span className="text-4xl">{isFlipped && winGift ? winGift.icon : "?"}</span>
                  <span className="text-xs text-amber-800 font-semibold px-2 text-center truncate max-w-full">
                    {isFlipped && winGift ? winGift.text : ""}
                  </span>
                  {isFlipped && winGift && (
                    <span className="text-[10px] text-amber-600 mt-0.5">🎉 恭喜获得</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {flippedIdx !== null && winGift && (
        <p className="text-sm text-amber-700 mt-4 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
          🎉 恭喜获得「{winGift.text}」
        </p>
      )}

      {flippedIdx !== null && interactive && allowRetry && (
        <button
          type="button"
          className="mt-2 text-xs text-foreground/55 hover:text-foreground/75 transition-colors cursor-pointer"
          onClick={reset}
        >
          ↻ 重新抽取
        </button>
      )}
      {gifts.length > 6 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">当前展示前 6 个奖品</p>
      ) : null}
    </div>
  );
}

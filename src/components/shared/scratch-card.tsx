"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Gift } from "@/types/lottery";

interface ScratchCardProps {
  gifts: Gift[];
  showPrizeList?: boolean;
  allowRetry?: boolean;
  interactive?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

const W = 260;
const H = 160;
const REVEAL_THRESHOLD = 0.45;

export function ScratchCard({ gifts, showPrizeList = true, allowRetry = false, interactive = false, onResult }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [winGift, setWinGift] = useState<Gift | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const revealedRef = useRef(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#c4b5fd");
    grad.addColorStop(0.5, "#a78bfa");
    grad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ 轻刮开奖 ✨", W / 2, H / 2);

    revealedRef.current = false;
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (gifts.length === 0) return;
    const wi = Math.floor(Math.random() * gifts.length);
    setWinGift(gifts[wi]);
    initCanvas();
  }, [gifts, initCanvas]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive || revealedRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const sx = (x - rect.left) * (canvas.width / rect.width);
    const sy = (y - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(sx, sy, 22 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const total = imageData.data.length / 4;
    if (transparent / total > REVEAL_THRESHOLD && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
      if (winGift) onResultRef.current?.(winGift, { inline: true });
    }
  }, [interactive, winGift]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!scratching) return;
    scratch(e.clientX, e.clientY);
  }, [scratching, scratch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) scratch(touch.clientX, touch.clientY);
  }, [scratch]);

  const reset = useCallback(() => {
    const wi = Math.floor(Math.random() * gifts.length);
    setWinGift(gifts[wi]);
    initCanvas();
  }, [gifts, initCanvas]);

  if (gifts.length === 0) return null;
  const maxHints = gifts.length <= 4 ? gifts.length : 4;
  const hintGifts = gifts.slice(0, maxHints);
  const hiddenCount = gifts.length - hintGifts.length;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {showPrizeList && !revealed && (
        <div className="flex flex-wrap gap-1.5 justify-center mb-3 max-w-[280px]">
          {hintGifts.map((gift) => (
            <span
              key={gift.id}
              className="inline-flex items-center gap-1 bg-white/50 rounded-full px-2 py-0.5 text-[10px] text-foreground/50"
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

      <div className="bg-gradient-to-br from-violet-100/60 to-purple-100/60 rounded-3xl p-3 shadow-lg border border-violet-200/40 mx-auto">
        <div className="relative" style={{ width: W, height: H }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            {winGift && (
              <>
                <span className="text-5xl">{winGift.icon}</span>
                <span className="text-base font-semibold text-amber-800 mt-1.5">{winGift.text}</span>
              </>
            )}
          </div>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 rounded-2xl"
            style={{ width: W, height: H, cursor: interactive && !revealed ? "crosshair" : "default", touchAction: "none" }}
            onMouseDown={() => setScratching(true)}
            onMouseUp={() => setScratching(false)}
            onMouseLeave={() => setScratching(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setScratching(true)}
            onTouchEnd={() => setScratching(false)}
            onTouchMove={handleTouchMove}
          />
        </div>
      </div>

      {revealed && winGift ? (
        <p className="text-sm text-amber-700 mt-3 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
          🎉 恭喜获得「{winGift.text}」
        </p>
      ) : (
        <p className="text-sm text-foreground/60 mt-3 font-medium">
          {gifts.length === 1
            ? "🎟️ 轻刮即可领取奖品"
            : "🎟️ 用手指刮开涂层查看结果"}
        </p>
      )}

      {revealed && interactive && allowRetry && (
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

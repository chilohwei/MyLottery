"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Gift } from "@/types/lottery";

interface ScratchCardProps {
  gifts: Gift[];
  showPrizeList?: boolean;
  allowRetry?: boolean;
  interactive?: boolean;
  highContrastText?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

const W = 260;
const H = 160;
const REVEAL_THRESHOLD = 0.45;
const BRUSH_R = 20;
const CHECK_INTERVAL = 16;

export function ScratchCard({
  gifts,
  showPrizeList = true,
  allowRetry = false,
  interactive = false,
  highContrastText = false,
  onResult,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [winGift, setWinGift] = useState<Gift | null>(null);
  const [revealed, setRevealed] = useState(false);
  const scratchingRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const revealedRef = useRef(false);
  const winGiftRef = useRef<Gift | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const strokeCountRef = useRef(0);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;

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
    lastPosRef.current = null;
    strokeCountRef.current = 0;
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (gifts.length === 0) return;
    const wi = Math.floor(Math.random() * gifts.length);
    const g = gifts[wi];
    setWinGift(g);
    winGiftRef.current = g;
    initCanvas();
  }, [gifts, initCanvas]);

  const checkReveal = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    const data = imageData.data;
    const len = data.length;
    for (let i = 3; i < len; i += 16) {
      if (data[i] === 0) transparent++;
    }
    const total = len / 16;
    if (transparent / total > REVEAL_THRESHOLD && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
      const g = winGiftRef.current;
      if (g) onResultRef.current?.(g, { inline: true });
    }
  }, []);

  const scratch = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !interactive) return;

    const rect = canvas.getBoundingClientRect();
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    const curX = cssX;
    const curY = cssY;
    const r = BRUSH_R;

    ctx.globalCompositeOperation = "destination-out";

    const last = lastPosRef.current;
    if (last) {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(curX, curY, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    lastPosRef.current = { x: curX, y: curY };

    strokeCountRef.current++;
    if (strokeCountRef.current % CHECK_INTERVAL === 0) {
      checkReveal(canvas, ctx);
    }
  }, [interactive, checkReveal]);

  const endStroke = useCallback(() => {
    scratchingRef.current = false;
    lastPosRef.current = null;
    if (strokeCountRef.current > 0 && !revealedRef.current) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) checkReveal(canvas, ctx);
    }
  }, [checkReveal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      scratchingRef.current = true;
      lastPosRef.current = null;
      const t = e.touches[0];
      if (t) scratch(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) scratch(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endStroke();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [interactive, scratch, endStroke]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    scratchingRef.current = true;
    lastPosRef.current = null;
    scratch(e.clientX, e.clientY);
  }, [scratch]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!scratchingRef.current) return;
    scratch(e.clientX, e.clientY);
  }, [scratch]);

  const reset = useCallback(() => {
    const wi = Math.floor(Math.random() * gifts.length);
    const g = gifts[wi];
    setWinGift(g);
    winGiftRef.current = g;
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
            onMouseDown={handleMouseDown}
            onMouseUp={endStroke}
            onMouseLeave={endStroke}
            onMouseMove={handleMouseMove}
          />
        </div>
      </div>

      {revealed && winGift ? (
        <p className={`text-sm mt-3 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500 ${highContrastText ? "text-amber-200" : "text-amber-700"}`}>
          🎉 恭喜获得「{winGift.text}」
        </p>
      ) : (
        <p className={`text-sm mt-3 font-medium ${highContrastText ? "text-white/85" : "text-foreground/60"}`}>
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

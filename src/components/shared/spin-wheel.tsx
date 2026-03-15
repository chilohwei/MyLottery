"use client";

import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Gift } from "@/types/lottery";

const COLORS = [
  "#fca5a5", "#fcd34d", "#86efac", "#7dd3fc",
  "#c4b5fd", "#f9a8d4", "#fdba74", "#67e8f9",
  "#fda4af", "#bef264", "#a5b4fc", "#fbbf24",
];

interface SpinWheelProps {
  gifts: Gift[];
  interactive?: boolean;
  allowRetry?: boolean;
  onResult?: (gift: Gift, opts?: { inline?: boolean }) => void;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function SpinWheel({ gifts, allowRetry = false, interactive = false, onResult }: SpinWheelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const animRef = useRef<number>(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(el.clientWidth, el.clientHeight);
      setWheelSize(s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const n = gifts.length;
  const sliceAngle = n > 0 ? 360 / n : 360;

  const conicGradient = useMemo(() => {
    if (n === 0) return "transparent";
    return gifts
      .map((_, i) => {
        const start = (i * sliceAngle).toFixed(2);
        const end = ((i + 1) * sliceAngle).toFixed(2);
        return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [gifts, n, sliceAngle]);

  const spin = useCallback(() => {
    if (!interactive || spinning || n === 0) return;
    setSpinning(true);

    const winIndex = Math.floor(Math.random() * n);
    const currentOffset = rotation % 360;
    const targetOffset = 360 - (winIndex * sliceAngle + sliceAngle / 2);
    const delta = ((targetOffset - currentOffset) % 360 + 360) % 360;
    const totalSpin = 360 * (5 + Math.floor(Math.random() * 3)) + delta;
    const duration = 4500;
    const startTime = performance.now();
    const baseRotation = rotation;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = baseRotation + totalSpin * eased;
      setRotation(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const gift = gifts[winIndex];
        if (gift) onResultRef.current?.(gift);
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, [interactive, spinning, n, sliceAngle, rotation, gifts]);

  if (n === 0) return null;

  if (n === 1) {
    const onlyGift = gifts[0];
    return (
      <div ref={wrapRef} className="w-full h-full flex items-center justify-center select-none">
        <div className="relative rounded-full" style={{ width: wheelSize, height: wheelSize }}>
          <div className="absolute inset-0 rounded-full border-[5px] border-white shadow-xl bg-gradient-to-br from-rose-200 to-amber-200" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-6xl">{onlyGift.icon}</span>
            <span className="text-sm font-semibold text-foreground/80 max-w-[65%] truncate text-center">
              {onlyGift.text}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
            <button
              type="button"
              className={cn(
                "rounded-full px-6 py-2 text-sm font-bold transition-all shadow-lg cursor-pointer",
                interactive && !spinning
                  ? "bg-gradient-to-b from-rose-400 to-rose-500 text-white hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={() => {
                if (!interactive || spinning || !onlyGift) return;
                setSpinning(true);
                setTimeout(() => {
                  setSpinning(false);
                  onResultRef.current?.(onlyGift);
                }, 800);
              }}
              disabled={!interactive || spinning}
            >
              {spinning ? "✨ 抽奖中..." : "开始抽奖"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const btnPct = 22;
  const pointerLen = 18;

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center select-none">
      <div className="relative rounded-full" style={{ width: wheelSize, height: wheelSize }}>
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full border-[5px] border-white shadow-xl" />

        {/* Rotating disc */}
        <div
          className="absolute inset-[5px] rounded-full overflow-hidden"
          style={{
            background: `conic-gradient(${conicGradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "none" : undefined,
          }}
        >
          {gifts.map((gift, i) => {
            const midAngle = i * sliceAngle + sliceAngle / 2;
            return (
              <div
                key={gift.id}
                className="absolute inset-0"
                style={{ transform: `rotate(${midAngle}deg)` }}
              >
                <div
                  className="absolute left-1/2 flex flex-col items-center gap-0.5 pointer-events-none"
                  style={{
                    top: "8%",
                    transform: "translateX(-50%)",
                    width: n <= 2 ? "46%" : n <= 4 ? "40%" : "30%",
                  }}
                >
                  <span className={cn("leading-none", n <= 2 ? "text-[34px]" : n <= 4 ? "text-2xl" : n <= 6 ? "text-xl" : "text-lg")}>
                    {gift.icon}
                  </span>
                  <span
                    className={cn(
                      "font-semibold text-gray-800/80 truncate max-w-full text-center leading-tight",
                      n <= 2 ? "text-[12px]" : n <= 4 ? "text-[11px]" : n <= 6 ? "text-[10px]" : "text-[9px]"
                    )}
                  >
                    {gift.text}
                  </span>
                </div>

                <div
                  className="absolute left-1/2 top-0 origin-bottom bg-white/60"
                  style={{
                    width: 1.5,
                    height: "50%",
                    transform: `translateX(-50%) rotate(${-sliceAngle / 2}deg)`,
                    transformOrigin: "bottom center",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Center hub: pointer + GO button (non-rotating) */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative" style={{ width: `${btnPct}%`, height: `${btnPct}%` }}>
            {/* Pointer triangle pointing to 12 o'clock */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{
                bottom: "100%",
                marginBottom: -2,
                filter: "drop-shadow(0 -1px 2px rgba(0,0,0,0.15))",
              }}
            >
              <svg
                viewBox="0 0 24 32"
                style={{ width: pointerLen, height: Math.round(pointerLen * 1.33) }}
              >
                <polygon
                  points="12,0 3,28 21,28"
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* GO button */}
            <button
              type="button"
              className={cn(
                "w-full h-full rounded-full flex items-center justify-center font-black tracking-wider transition-all",
                interactive && !spinning
                  ? "bg-gradient-to-b from-rose-400 to-rose-500 text-white shadow-xl shadow-rose-300/50 hover:scale-110 active:scale-95 cursor-pointer ring-[3px] ring-white/80"
                  : spinning
                  ? "bg-gradient-to-b from-rose-400 to-rose-500 text-white shadow-xl ring-[3px] ring-white/80 animate-pulse"
                  : "bg-muted text-muted-foreground ring-[3px] ring-white/60"
              )}
              style={{ fontSize: "clamp(12px, 3.5cqi, 20px)" }}
              onClick={spin}
              disabled={!interactive || spinning || n === 0}
            >
              {spinning ? "✨" : "GO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

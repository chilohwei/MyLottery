"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PhonePreviewProps {
  children: React.ReactNode;
  className?: string;
}

const PHONE_W = 390;
const PHONE_H = 844;
const ASPECT = PHONE_W / PHONE_H;
const MAX_SCALE = 1;
const MIN_SCALE = 0.5;

export function PhonePreview({ children, className }: PhonePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.82);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const pad = 24;
      const availH = height - pad;
      const availW = width - pad;
      const scaleH = availH / PHONE_H;
      const scaleW = availW / PHONE_W;
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleH, scaleW))));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative shrink-0", className)}
      style={{
        width: PHONE_W * scale,
        height: PHONE_H * scale,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${scale})`,
        }}
      >
        <div className="relative w-full h-full rounded-[3rem] border-[6px] border-foreground/8 bg-background shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[100px] h-[24px] rounded-full bg-foreground/8" />
          {/* Content — children handle their own safe-area padding */}
          <div className="h-full overflow-hidden">
            {children}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[120px] h-[4px] rounded-full bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}

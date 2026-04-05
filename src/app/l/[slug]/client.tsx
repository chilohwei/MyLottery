"use client";

import { LotteryView } from "@/components/shared/lottery-view";
import { migrateConfig } from "@/lib/migrate-config";
import type { Lottery } from "@/types/lottery";

export function PublicLotteryClient({ lottery }: { lottery: Lottery }) {
  const config = migrateConfig(lottery.config as unknown as Record<string, unknown>);

  return (
    <>
      {/* Mobile: full-screen immersive, identical to editor preview */}
      <div className="md:hidden fixed inset-0 w-full h-[100dvh]">
        <LotteryView
          config={config}
          title={lottery.title}
          interactive
          autoPlay
          hideTitle
          safeArea
          lotteryId={lottery.id}
        />
      </div>

      {/* Desktop: centered phone frame */}
      <div className="hidden md:flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-neutral-950 to-neutral-900 p-6">
        <div className="relative w-[390px] h-[844px] rounded-[3rem] border-[6px] border-white/8 bg-background shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[100px] h-[24px] rounded-full bg-foreground/8" />
          <div className="h-full overflow-hidden">
            <LotteryView
              config={config}
              title={lottery.title}
              interactive
              autoPlay
              hideTitle
              safeArea
              lotteryId={lottery.id}
            />
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[120px] h-[4px] rounded-full bg-foreground/10" />
        </div>
      </div>
    </>
  );
}

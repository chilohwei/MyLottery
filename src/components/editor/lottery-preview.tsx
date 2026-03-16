"use client";

import { memo } from "react";
import { LotteryView } from "@/components/shared/lottery-view";
import type { LotteryConfig } from "@/types/lottery";

interface LotteryPreviewProps {
  config: LotteryConfig;
  title: string;
}

export const LotteryPreview = memo(function LotteryPreview({
  config,
  title,
}: LotteryPreviewProps) {
  return <LotteryView config={config} title={title} interactive autoPlay hideTitle safeArea showReplayControl />;
});

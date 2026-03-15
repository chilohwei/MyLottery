"use client";

import { LotteryView } from "@/components/shared/lottery-view";
import type { LotteryConfig } from "@/types/lottery";

interface LotteryPreviewProps {
  config: LotteryConfig;
  title: string;
}

export function LotteryPreview({ config, title }: LotteryPreviewProps) {
  return <LotteryView config={config} title={title} interactive autoPlay hideTitle />;
}

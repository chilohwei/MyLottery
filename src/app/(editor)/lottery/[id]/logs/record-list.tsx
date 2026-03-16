"use client";

import { useState } from "react";
import { ChevronDown, Monitor, MapPin, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_RECIPIENT_AVATAR, GAME_TYPES, type PrizeLog } from "@/types/lottery";

function parseDevice(ua: string | null): string {
  if (!ua) return "—";
  let os = "未知";
  let browser = "未知";
  if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS/.test(ua)) os = "Mac";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";

  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  return `${os} ${browser}`;
}

export function LogRecordList({ logs }: { logs: PrizeLog[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </div>
  );
}

function LogRow({ log }: { log: PrizeLog }) {
  const [open, setOpen] = useState(false);
  const snapshot = log.snapshot;
  const hasSnapshot = snapshot && snapshot.gifts && snapshot.gifts.length > 0;
  const gameType = snapshot?.gameType
    ? GAME_TYPES.find((g) => g.value === snapshot.gameType)
    : null;
  const location = [log.location, log.ip].filter(Boolean).join(" · ") || "—";
  const device = parseDevice(log.user_agent);
  const recipientPhoto = snapshot?.recipientPhoto || DEFAULT_RECIPIENT_AVATAR;

  return (
    <div>
      {/* Main row */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors",
          hasSnapshot ? "cursor-pointer hover:bg-muted/30" : "",
        )}
        onClick={hasSnapshot ? () => setOpen((v) => !v) : undefined}
      >
        {/* Prize */}
        <span className="text-lg shrink-0">{log.prize_icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{log.prize_text}</span>
          {/* Mobile-only meta */}
          <span className="text-[11px] text-muted-foreground sm:hidden">
            {location} · {device}
          </span>
        </div>

        {/* Game type badge */}
        {gameType && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 shrink-0">
            {gameType.icon} {gameType.label}
          </span>
        )}

        {/* Location */}
        <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground w-36 justify-end truncate shrink-0">
          <MapPin className="h-3 w-3 shrink-0" />
          {location}
        </span>

        {/* Device */}
        <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground w-28 justify-end shrink-0">
          <Monitor className="h-3 w-3 shrink-0" />
          {device}
        </span>

        {/* Time */}
        <span className="text-[11px] text-muted-foreground shrink-0 w-32 sm:w-40 text-right">
          {new Date(log.time).toLocaleString("zh-CN")}
        </span>

        {/* Expand toggle */}
        {hasSnapshot && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        )}
      </div>

      {/* Expanded detail */}
      {open && hasSnapshot && (
        <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border/50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recipient photo */}
            <div className="shrink-0">
              <p className="text-[11px] text-muted-foreground mb-1.5">Ta 的照片</p>
              <img
                src={recipientPhoto}
                alt=""
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-border bg-muted"
              />
            </div>

            {/* Game type + all prizes at draw time */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {gameType && (
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-3 w-3" />
                    当时玩法：{gameType.icon} {gameType.label}
                  </span>
                )}
                <span>共 {snapshot.gifts.length} 项奖品</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {snapshot.gifts.map((gift) => (
                  <span
                    key={gift.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                      gift.id === log.prize
                        ? "border-primary/30 bg-primary/5 font-medium"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {gift.icon} {gift.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

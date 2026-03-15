import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  titleSlot?: ReactNode;
  subtitleSlot?: ReactNode;
  primaryAction?: ReactNode;
  variant?: "default" | "compact" | "centered";
  className?: string;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  titleSlot,
  subtitleSlot,
  primaryAction,
  variant = "default",
  className,
}: PageHeaderProps) {
  const compact = variant === "compact";
  const centered = variant === "centered";

  if (centered) {
    return (
      <div className={cn("flex flex-col items-center text-center gap-4", className)}>
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground/80">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          {titleSlot ?? (
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          )}
          {(subtitleSlot ?? subtitle) ? (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {subtitleSlot ?? subtitle}
            </p>
          ) : null}
        </div>
        {primaryAction ? <div>{primaryAction}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div
            className={cn(
              "mt-0.5 flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80",
              compact ? "h-8 w-8" : "h-9 w-9"
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          {titleSlot ?? (
            <h1 className={cn("font-bold tracking-tight truncate", compact ? "text-lg" : "text-2xl")}>
              {title}
            </h1>
          )}
          {(subtitleSlot ?? subtitle) ? (
            <p className={cn("mt-1 text-muted-foreground leading-relaxed", compact ? "text-xs" : "text-sm")}>
              {subtitleSlot ?? subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {primaryAction ? <div className="shrink-0">{primaryAction}</div> : null}
    </div>
  );
}

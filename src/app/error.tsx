"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <PageHeader
          icon={<AlertTriangle className="h-4 w-4" />}
          title="页面暂时不可用"
          subtitle={error.message || "系统处理请求时出现异常，请稍后重试"}
          variant="centered"
        />
        <button
          className="mt-5 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={reset}
        >
          重试
        </button>
      </div>
    </div>
  );
}

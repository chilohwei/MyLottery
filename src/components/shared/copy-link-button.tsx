"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyLinkButtonProps {
  url: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default";
  label?: string;
  className?: string;
}

export function CopyLinkButton({
  url,
  variant = "ghost",
  size = "sm",
  label = "复制链接",
  className,
}: CopyLinkButtonProps) {
  const handleCopy = async () => {
    const fullUrl = typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("链接已复制到剪贴板");
  };

  return (
    <Button variant={variant} size={size} className={`text-xs gap-2 ${className ?? ""}`} onClick={handleCopy}>
      <Copy className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

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
    try {
      await copyToClipboard(fullUrl);
      toast.success("链接已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  return (
    <Button variant={variant} size={size} className={`text-xs gap-2 ${className ?? ""}`} onClick={handleCopy}>
      <Copy className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

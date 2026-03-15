"use client";

import { useRef, useState } from "react";
import { Camera, Link2, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  shape?: "circle" | "rounded";
  compact?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function PhotoUpload({ value, onChange, className, shape = "circle", compact = false }: PhotoUploadProps) {
  const sizeClass = compact ? "w-14 h-14" : "w-20 h-20";
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("图片不能超过 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("relative inline-block group", className)}>
      {value ? (
        <img
          src={value}
          alt=""
          className={cn(sizeClass, "object-cover border-2 border-border bg-muted", shapeClass)}
        />
      ) : (
        <div
          className={cn(
            sizeClass,
            "border-2 bg-muted/60 flex items-center justify-center",
            shapeClass,
            dragOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <User className={cn("text-muted-foreground/50", compact ? "h-6 w-6" : "h-8 w-8")} />
        </div>
      )}

      {/* Hover overlay — upload / replace */}
      <button
        type="button"
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
          shapeClass,
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Camera className={cn("text-white", compact ? "h-4 w-4" : "h-5 w-5")} />
        {!compact && <span className="text-white text-[10px] font-medium mt-0.5">{value ? "替换" : "上传"}</span>}
      </button>

      {/* Remove button */}
      {value && (
        <button
          type="button"
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

      {!compact && !value && (
        <div className="mt-2 space-y-1">
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <Link2 className="h-3 w-3" />
            {showUrlInput ? "收起" : "或粘贴图片链接"}
          </button>
          {showUrlInput && (
            <Input
              value=""
              onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
              placeholder="https://..."
              className="h-7 text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
}

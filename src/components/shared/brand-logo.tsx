import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const textSizeMap = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export function BrandLogo({ size = "md", className, showText = true }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className={cn("inline-flex items-center justify-center shrink-0", sizeMap[size])}>
        <svg viewBox="0 0 512 512" className="h-full w-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7E7E"/>
              <stop offset="100%" stopColor="#C8507A"/>
            </linearGradient>
            <radialGradient id="logoShine" cx="35%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#FFA5A0" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#FF7E7E" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="logoBox" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF"/>
              <stop offset="100%" stopColor="#EDE3EA"/>
            </linearGradient>
            <linearGradient id="logoLid" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF"/>
              <stop offset="100%" stopColor="#F3EBF0"/>
            </linearGradient>
            <linearGradient id="logoRib" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8A80"/>
              <stop offset="100%" stopColor="#D9534F"/>
            </linearGradient>
            <linearGradient id="logoGem" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#FFE57F"/>
              <stop offset="50%" stopColor="#FFC107"/>
              <stop offset="100%" stopColor="#FFA000"/>
            </linearGradient>
          </defs>

          <rect width="512" height="512" rx="112" fill="url(#logoBg)"/>
          <rect width="512" height="512" rx="112" fill="url(#logoShine)"/>

          <rect x="146" y="272" width="220" height="148" rx="22" fill="url(#logoBox)"/>
          <rect x="240" y="272" width="32" height="148" rx="2" fill="url(#logoRib)" opacity="0.8"/>

          <g transform="rotate(-5, 256, 252)">
            <rect x="132" y="236" width="248" height="42" rx="14" fill="url(#logoLid)"/>
            <rect x="236" y="236" width="40" height="42" rx="3" fill="url(#logoRib)" opacity="0.8"/>
            <ellipse cx="237" cy="232" rx="20" ry="14" fill="url(#logoRib)" opacity="0.85" transform="rotate(-20, 237, 232)"/>
            <ellipse cx="275" cy="232" rx="20" ry="14" fill="url(#logoRib)" opacity="0.85" transform="rotate(20, 275, 232)"/>
            <circle cx="256" cy="236" r="9" fill="url(#logoRib)"/>
          </g>

          <path d="M256 92 L270 158 L336 172 L270 186 L256 252 L242 186 L176 172 L242 158 Z" fill="url(#logoGem)"/>
          <path d="M256 118 L266 160 L308 172 L266 184 L256 226 L246 184 L204 172 L246 160 Z" fill="white" opacity="0.3"/>

          <path d="M168 130 L172 118 L176 130 L188 134 L176 138 L172 150 L168 138 L156 134 Z" fill="white" opacity="0.75"/>
          <path d="M344 112 L347 104 L350 112 L358 115 L350 118 L347 126 L344 118 L336 115 Z" fill="white" opacity="0.6"/>
        </svg>
      </span>
      {showText && (
        <span className={cn("font-bold text-foreground whitespace-nowrap tracking-tight", textSizeMap[size])}>
          礼遇
        </span>
      )}
    </span>
  );
}

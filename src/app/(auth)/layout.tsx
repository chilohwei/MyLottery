import { BrandLogo } from "@/components/shared/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] shrink-0 flex-col justify-between gradient-warm p-12">
        <BrandLogo size="lg" />
        <div className="space-y-4">
          <p className="text-4xl font-bold leading-snug text-foreground/85 tracking-tight">
            专业创建抽奖活动
            <br />
            轻松分享每一份心意
          </p>
          <p className="text-base text-foreground/65 max-w-sm leading-relaxed">
            从文案到礼物一步配置，发布后即可分享链接，体验清晰、稳定、可追踪
          </p>
        </div>
        <p className="text-xs text-foreground/40">
          &copy; {new Date().getFullYear()} 礼遇
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(254,214,227,0.28),transparent_38%),radial-gradient(circle_at_80%_75%,rgba(168,237,234,0.25),transparent_40%)]" />
        <div className="relative w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

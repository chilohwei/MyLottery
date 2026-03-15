import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 backdrop-blur-sm px-4 sm:px-6">
        <Link href="/dashboard">
          <BrandLogo size="sm" />
        </Link>
        <UserButton />
      </header>
      <main className="flex-1 overflow-auto px-4 sm:px-6 py-5 sm:py-7">
        <TooltipProvider>{children}</TooltipProvider>
      </main>
      <Toaster />
    </div>
  );
}

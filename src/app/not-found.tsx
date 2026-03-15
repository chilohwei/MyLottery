import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-warm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
        <PageHeader
          icon={<SearchX className="h-4 w-4" />}
          title="未找到对应页面"
          subtitle="该链接可能已失效，或页面已被移除，请返回首页继续操作"
          variant="centered"
        />
        <Link
          href="/"
          className={cn(buttonVariants(), "rounded-full gap-2 mt-6")}
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}

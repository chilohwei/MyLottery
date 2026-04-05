import { TooltipProvider } from "@/components/ui/tooltip";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

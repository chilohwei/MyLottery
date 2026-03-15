import type { Viewport } from "next";

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PublicLotteryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

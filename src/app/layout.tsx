import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "礼遇 - 创建与分享心意抽奖",
  description: "轻松创建专属抽奖活动，配置玩法与礼物，一键分享链接，实时查看参与数据",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={zhCN}
      appearance={{
        elements: {
          logoBox: "hidden",
          footer: "hidden",
          badge: "hidden",
          footerAction: "hidden",
          userButtonPopoverFooter: "hidden",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldInput: "border-border",
          socialButtonsBlockButton: "border-border",
        },
      }}
    >
      <html
        lang="zh-CN"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body>
          {children}
          <Toaster richColors position="top-center" />
          <Script
            src="https://tongji.chiloh.com/script.js"
            data-website-id="a8b312ff-5b37-4374-af4a-fb16defe1336"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

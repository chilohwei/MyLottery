import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          logoBox: "hidden",
          cardBox: "shadow-none border-0",
          card: "rounded-3xl border border-border/70 bg-card/92 px-6 py-7 shadow-xl backdrop-blur-sm sm:px-7 sm:py-8",
          headerTitle: "text-[1.7rem] font-bold tracking-tight text-foreground",
          headerSubtitle: "text-muted-foreground text-sm leading-relaxed",
          socialButtonsBlockButton: "h-11 rounded-xl border-border bg-background hover:bg-muted/55 transition-all duration-200",
          socialButtonsBlockButtonText: "text-sm font-medium text-foreground",
          dividerLine: "bg-border",
          dividerText: "text-xs text-muted-foreground",
          formFieldLabel: "text-xs font-medium text-foreground/80",
          formFieldInput:
            "h-11 rounded-xl border-border bg-background text-sm shadow-none focus-visible:ring-2 focus-visible:ring-ring/60",
          formButtonPrimary:
            "mt-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm",
          formFieldAction: "text-primary hover:text-primary/80 text-xs",
          footerActionLink: "text-primary hover:text-primary/80 font-medium",
          footerActionText: "text-muted-foreground",
          footerAction: "hidden",
          badge: "hidden",
          footer: "hidden",
        },
      }}
    />
  );
}

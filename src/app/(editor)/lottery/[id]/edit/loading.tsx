export default function EditorLoading() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-44 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="order-2 md:order-1 w-full md:w-[340px] shrink-0 md:border-r border-border bg-background p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-9 w-full bg-muted rounded-lg" />
            </div>
          ))}
        </div>
        <div className="order-1 md:order-2 flex-1 min-h-[360px] md:min-h-0 flex items-center justify-center bg-muted/30">
          <div className="w-[280px] h-[600px] bg-muted/50 rounded-[3rem] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

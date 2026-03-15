export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded mt-2 animate-pulse" />
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse"
          >
            <div className="h-20 w-full bg-muted rounded-xl" />
            <div className="h-5 w-2/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-14 bg-muted rounded-md" />
              <div className="h-8 w-14 bg-muted rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

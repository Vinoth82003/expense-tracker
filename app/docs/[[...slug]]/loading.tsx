export default function DocsLoading() {
  return (
    <div className="min-w-0 w-full animate-pulse">
      {/* Hero Skeleton */}
      <div className="border-b border-border-subtle bg-gradient-to-br from-primary-500/[0.03] via-transparent to-accent-500/[0.03]">
        <div className="w-full px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="h-4 w-28 rounded-full bg-surface-variant" />
            <div className="h-14 sm:h-16 md:h-20 w-3/4 rounded-2xl bg-surface-variant" />
            <div className="h-5 w-2/3 rounded-full bg-surface-variant" />
            <div className="h-14 w-full max-w-xl rounded-2xl bg-surface-variant" />
          </div>
          <div className="mt-12 flex gap-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant" />
              <div className="space-y-1.5">
                <div className="h-6 w-8 rounded bg-surface-variant" />
                <div className="h-3 w-16 rounded-full bg-surface-variant" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant" />
              <div className="space-y-1.5">
                <div className="h-6 w-8 rounded bg-surface-variant" />
                <div className="h-3 w-20 rounded-full bg-surface-variant" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant" />
              <div className="space-y-1.5">
                <div className="h-6 w-12 rounded bg-surface-variant" />
                <div className="h-3 w-16 rounded-full bg-surface-variant" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="w-full px-5 sm:px-8 lg:px-12 py-16 sm:py-20 space-y-16">
        {[1, 2].map((category) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-surface-variant" />
              <div className="h-8 w-36 rounded-xl bg-surface-variant" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="p-6 sm:p-7 rounded-2xl border border-border-subtle bg-surface space-y-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-variant" />
                  <div className="h-5 w-3/4 rounded-lg bg-surface-variant" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-surface-variant" />
                    <div className="h-3 w-2/3 rounded-full bg-surface-variant" />
                  </div>
                  <div className="h-3 w-24 rounded-full bg-surface-variant" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

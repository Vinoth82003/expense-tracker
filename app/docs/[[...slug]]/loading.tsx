export default function DocsLoading() {
  return (
    <div className="w-full max-w-4xl px-6 md:px-12 py-12">
      <div className="space-y-12 animate-pulse">
        {/* Breadcrumbs Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-12 bg-surface-variant rounded-full" />
          <div className="h-3 w-3 bg-surface-variant rounded-full" />
          <div className="h-3.5 w-20 bg-surface-variant rounded-full" />
        </div>

        {/* Page Header Skeleton */}
        <div className="space-y-4">
          <div className="h-12 w-3/4 bg-surface-variant rounded-2xl" />
          <div className="h-4 w-40 bg-surface-variant rounded-full" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6 pt-6">
          <div className="h-4 w-full bg-surface-variant rounded-full" />
          <div className="h-4 w-[95%] bg-surface-variant rounded-full" />
          <div className="h-4 w-[90%] bg-surface-variant rounded-full" />
          <div className="h-4 w-[98%] bg-surface-variant rounded-full" />
          <div className="h-4 w-[85%] bg-surface-variant rounded-full" />
        </div>

        {/* Another block */}
        <div className="space-y-6 pt-6">
          <div className="h-4 w-full bg-surface-variant rounded-full" />
          <div className="h-4 w-[92%] bg-surface-variant rounded-full" />
          <div className="h-4 w-[88%] bg-surface-variant rounded-full" />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { FileQuestion, ArrowLeft, BookOpen } from "lucide-react";

// Scoped to /docs so the 404 renders inside DocsLayoutClient (navbar, sidebar,
// footer). The root app/not-found.tsx sits above that client boundary, so a
// notFound() thrown from /docs/[[...slug]] would otherwise leave the docs shell
// rendered around an empty main region.
export default function DocsNotFound() {
  return (
    <div className="w-full flex items-center justify-center px-6 py-24 lg:py-32">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-surface-variant border border-border-subtle flex items-center justify-center">
          <FileQuestion size={36} className="text-muted" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 mb-3">
          404
        </p>

        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
          Document not found
        </h1>

        <p className="text-secondary leading-relaxed mb-10">
          This documentation page doesn&apos;t exist, may have been renamed, or is
          not published yet. Try the sidebar, or browse all guides below.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <BookOpen size={16} />
            All documentation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border-subtle text-foreground font-bold text-sm hover:bg-surface-variant transition-colors"
          >
            <ArrowLeft size={16} />
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

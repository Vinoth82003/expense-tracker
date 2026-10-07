import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current page (last crumb). */
  href?: string;
}

/**
 * Visible breadcrumb trail for intent-led hubs (compare, tools, docs peers).
 * Always starts at Home. Keep trails ≤ 3 levels so the hierarchy stays scannable.
 */
export function SiteBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-secondary mb-5"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-muted" aria-hidden />
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-primary-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-foreground truncate max-w-[220px]"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight size={12} className="text-muted" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Server-friendly BreadcrumbList JSON-LD for hub pages. */
export function breadcrumbJsonLd(
  siteOrigin: string,
  trail: { name: string; path?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      ...(step.path ? { item: `${siteOrigin}${step.path}` } : {}),
    })),
  };
}

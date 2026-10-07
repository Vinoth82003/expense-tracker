"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// First-party marketing analytics beacon.
//
// Cookie-free and anonymous: it POSTs { path, referrer, sessionId } to
// /api/analytics/pageview. sessionId is a random per-tab id kept in
// sessionStorage so "unique sessions" can be counted without cookies or
// fingerprints. It deliberately does NOT track authenticated app pages,
// admin, or auth plumbing — this exists to measure the public marketing site.

const EXCLUDED_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/login",
  "/verify-2fa",
  "/onboarding",
  "/dashboard",
  "/expenses",
  "/income",
  "/groups",
  "/reports",
  "/notifications",
  "/settings",
  "/analyze",
  "/feedback",
  "/profile",
  "/bridge",
];

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem("sp_session");
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("sp_session", id);
    return id;
  } catch {
    // Storage blocked (private mode, ITP) — anonymous view still counts.
    return "no-storage";
  }
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;

    // Skip duplicate firings of the same path (StrictMode double-invoke,
    // search-param-only changes we don't care about).
    const key = pathname;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const payload = {
      path: pathname,
      referrer: document.referrer || null,
      sessionId: getOrCreateSessionId(),
    };

    const body = JSON.stringify(payload);
    try {
      // keepalive lets the request survive a same-tab navigation/unload.
      void fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
    } catch {
      // Analytics must never break the page.
    }
  }, [pathname, searchParams]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ActivityTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    // Throttle: only update if not updated in the last hour (simple client-side check)
    const lastUpdate = localStorage.getItem("last_activity_update");
    const now = Date.now();

    if (!lastUpdate || now - parseInt(lastUpdate) > 1000 * 60 * 60) {
      fetch("/api/user/activity", { method: "POST" })
        .then(() => {
          localStorage.setItem("last_activity_update", now.toString());
        })
        .catch(err => console.error("Activity tracking failed", err));
    }
  }, [session, status]);

  return null;
}

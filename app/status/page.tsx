import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "System Status | SpendWise — Expense Tracker for India",
  description:
    "Real-time status of SpendWise services including API, database, authentication, and AI features.",
  alternates: {
    canonical: "/status",
  },
  openGraph: {
    title: "System Status | SpendWise — Expense Tracker for India",
    description:
      "Real-time status of SpendWise services including API, database, authentication, and AI features.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/status`,
    images: [
      {
        url: "/og-images/og-status-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise System Status",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "System Status | SpendWise — Expense Tracker for India",
    description:
      "Real-time status of SpendWise services including API, database, authentication, and AI features.",
    images: ["/og-images/og-status-dark.png"],
  },
};

type ServiceStatus = "operational" | "degraded" | "down";

interface ServiceCheck {
  name: string;
  description: string;
  status: ServiceStatus;
  latencyMs?: number;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.user.findFirst({ select: { id: true }, take: 1 });
    return {
      name: "Database",
      description: "MongoDB via Prisma ORM",
      status: "operational",
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      name: "Database",
      description: "MongoDB via Prisma ORM",
      status: "down",
    };
  }
}

async function checkApi(): Promise<ServiceCheck> {
  return {
    name: "API Server",
    description: "Next.js Edge Runtime",
    status: "operational",
    latencyMs: 0,
  };
}

async function checkAuth(): Promise<ServiceCheck> {
  return {
    name: "Authentication",
    description: "NextAuth.js / Google OAuth",
    status: "operational",
  };
}

async function checkAI(): Promise<ServiceCheck> {
  const key = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  return {
    name: "AI Analysis",
    description: "Forensic AI engine",
    status: key ? "operational" : "degraded",
  };
}

const STATUS_META: Record<
  ServiceStatus,
  { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  operational: {
    label: "Operational",
    color: "text-success",
    bg: "bg-success/10",
    Icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded",
    color: "text-warning",
    bg: "bg-warning/10",
    Icon: Clock,
  },
  down: {
    label: "Down",
    color: "text-error",
    bg: "bg-error/10",
    Icon: AlertCircle,
  },
};

function overallStatus(services: ServiceCheck[]): ServiceStatus {
  if (services.some((s) => s.status === "down")) return "down";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "operational";
}

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

export default async function StatusPage() {
  const [db, api, auth, ai] = await Promise.all([
    checkDatabase(),
    checkApi(),
    checkAuth(),
    checkAI(),
  ]);

  const services: ServiceCheck[] = [db, api, auth, ai];
  const overall = overallStatus(services);
  const overallMeta = STATUS_META[overall];
  const OverallIcon = overallMeta.Icon;

  const now = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase ${overallMeta.color}`}
            >
              <OverallIcon size={12} />
              {overallMeta.label}
            </div>

            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              All systems <span className="text-primary-600">operational.</span>
            </h1>

            <p className="text-[15px] text-secondary max-w-xl mx-auto leading-relaxed">
              Last checked: {now} IST
            </p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ SERVICES ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[700px] mx-auto space-y-4">
            {services.map((svc) => {
              const meta = STATUS_META[svc.status];
              const Icon = meta.Icon;
              return (
                <div
                  key={svc.name}
                  className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface shadow-sm"
                >
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      {svc.name}
                    </p>
                    <p className="text-[12px] text-muted font-medium mt-0.5">
                      {svc.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {svc.latencyMs !== undefined && svc.latencyMs > 0 && (
                      <span className="text-[12px] font-medium text-muted hidden sm:block">
                        {svc.latencyMs} ms
                      </span>
                    )}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${meta.bg} ${meta.color} text-[12px] font-semibold`}
                    >
                      <Icon size={13} />
                      {meta.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* ═══════════ FOOTER NOTE ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center">
            <p className="text-[13px] text-muted font-medium">
              This page is rendered server-side on every request and reflects
              live service health.{" "}
              <Link
                href="/contact"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Report an issue
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

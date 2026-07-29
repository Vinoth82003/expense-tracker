"use client";

import { lazy, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "./sections/HeroSection";
import { CounterStats } from "./sections/CounterStats";
import { ProblemSection } from "./sections/ProblemSection";
import { FeaturesGrid } from "./sections/FeaturesGrid";
import { BentoHighlights } from "./sections/BentoHighlights";
import { AISection } from "./sections/AISection";
import { ComparisonTable } from "./sections/ComparisonTable";
import { FreeToolsCTA } from "./sections/FreeToolsCTA";
import { FinalCTA } from "./sections/FinalCTA";
import { FAQSection } from "./sections/FAQSection";
import type { PublicStatsData } from "./sections/CounterStats";

const TestimonialsSection = lazy(() =>
  import("./TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

export function HomeClient({ stats }: { stats: PublicStatsData }) {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        <HeroSection />
        <CounterStats stats={stats} />

        <ProblemSection />

        <Separator />
        <div className="bg-surface-variant">
          <AISection />
        </div>

        <Separator />
        <FeaturesGrid />

        <Separator />
        <div className="bg-surface-variant">
          <ComparisonTable />
        </div>

        <Separator />
        <FreeToolsCTA />

        <Separator />
        <div className="bg-surface-variant">
          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            }
          >
            <TestimonialsSection />
          </Suspense>
        </div>

        <Separator />
        <FAQSection />

        <Separator />
        <div className="bg-surface-variant">
          <FinalCTA />
        </div>
      </main>

      <Footer />
    </>
  );
}

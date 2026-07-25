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

const TestimonialsSection = lazy(() =>
  import("./TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">
        <HeroSection />
        <CounterStats />

        {/* 1 — default bg */}
        <ProblemSection />

        {/* 2 — tinted bg */}
        <div className="bg-surface-variant/30">
          <AISection />
        </div>

        {/* 3 — default bg */}
        <FeaturesGrid />

        {/* 4 — tinted bg */}
        <div className="bg-surface-variant/30">
          <ComparisonTable />
        </div>

        {/* 5 — default bg */}
        <FreeToolsCTA />

        {/* 6 — tinted bg */}
        <div className="bg-surface-variant/30">
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

        {/* 7 — default bg */}
        <FAQSection />

        {/* 8 — tinted bg */}
        <div className="bg-surface-variant/30">
          <FinalCTA />
        </div>
      </main>

      <Footer />
    </>
  );
}

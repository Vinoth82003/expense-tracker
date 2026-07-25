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
import { FinalCTA } from "./sections/FinalCTA";

const TestimonialsSection = lazy(() => import("./TestimonialsSection"));

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">
        <HeroSection />
        <CounterStats />
        <ProblemSection />
        <AISection />
        <FeaturesGrid />
        <BentoHighlights />

        {/* ━━━━ TESTIMONIALS ━━━━ */}
        <section className="py-20 px-5 md:px-10 bg-surface-variant/30 relative">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              What Our Users Say
            </h2>
          </div>
          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            }
          >
            <TestimonialsSection />
          </Suspense>
        </section>

        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}

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
      </main>

      <Footer />
    </>
  );
}

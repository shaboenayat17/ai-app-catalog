import { Suspense } from "react";
import { CompareClient } from "@/components/CompareClient";
import { PairBuilder } from "@/components/PairBuilder";
import { PopularComparisonsSection } from "@/components/PopularComparisonsSection";
import { PopularComparisonsByCategory } from "@/components/PopularComparisonsByCategory";
import { apps, comparisons } from "@/lib/data";

export const metadata = {
  title: "Compare AI apps — AI App Catalog",
  description:
    "Side-by-side comparisons for any two AI apps — pricing, output quality, pros and cons, and a verdict.",
};

export default function ComparePage() {
  const sorted = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pb-16 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Compare apps
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-strong sm:text-base">
          Pick any two apps and we'll show pricing, ratings, pros &amp; cons, and an
          honest verdict — pre-built for the most-searched pairs and auto-generated
          for everything else.
        </p>
      </header>

      <div className="mb-8">
        <PairBuilder apps={sorted} />
      </div>

      <div className="mb-8">
        <PopularComparisonsSection
          comparisons={comparisons}
          apps={apps}
          limit={6}
        />
      </div>

      <div className="mb-8">
        <PopularComparisonsByCategory apps={apps} />
      </div>

      <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">
        Or pick 2–3 apps for a multi-column table
      </h2>
      <Suspense fallback={null}>
        <CompareClient apps={sorted} />
      </Suspense>
    </div>
  );
}

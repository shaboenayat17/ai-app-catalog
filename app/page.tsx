import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { apps, getAllTags, getLastUpdated, trending } from "@/lib/data";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeClient
        apps={apps}
        allTags={getAllTags()}
        lastUpdated={getLastUpdated()}
        trending={trending}
      />
    </Suspense>
  );
}

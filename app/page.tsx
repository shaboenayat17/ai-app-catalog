import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { getApps, getAllTagsFrom, getLastUpdatedFrom } from "@/lib/db";
import trendingData from "@/data/trending.json";
import type { TrendingData } from "@/lib/types";

// Revalidate the home page every 60s so newly approved apps appear without
// a full redeploy.
export const revalidate = 60;

const trending = trendingData as TrendingData;

export default async function HomePage() {
  const apps = await getApps();
  return (
    <Suspense fallback={null}>
      <HomeClient
        apps={apps}
        allTags={getAllTagsFrom(apps)}
        lastUpdated={getLastUpdatedFrom(apps, [])}
        trending={trending}
      />
    </Suspense>
  );
}

import { notFound } from "next/navigation";
import { AppDetailClient, type CompareSuggestion } from "@/components/AppDetailClient";
import {
  getAppById,
  getApps,
  getComparisonsForApp,
  getReviewsByAppId,
} from "@/lib/db";
import { suggestComparisonsForApp, pairSlug } from "@/lib/build-comparison";

export const revalidate = 60;

export async function generateStaticParams() {
  const apps = await getApps();
  return apps.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const app = await getAppById(params.id);
  if (!app) return { title: "App not found" };
  return {
    title: `${app.name} — AI App Catalog`,
    description: app.description,
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [app, apps] = await Promise.all([
    getAppById(params.id),
    getApps(),
  ]);
  if (!app) notFound();

  // Refresh reviews from the live table so newly-submitted ones show up
  // without waiting for the next app upsert.
  const reviews = await getReviewsByAppId(app.id);
  if (reviews.length > 0) app.reviews = reviews;

  // Build a unified suggestion list:
  // 1) Pre-built comparisons (Expert badge)
  // 2) Same-category competitors (auto)
  // 3) Compatible-with apps (auto)
  const expert = await getComparisonsForApp(app.id);
  const seen = new Set<string>();
  const suggestions: CompareSuggestion[] = [];

  for (const c of expert) {
    const otherId = c.app1 === app.id ? c.app2 : c.app1;
    const other = apps.find((a) => a.id === otherId);
    if (!other) continue;
    suggestions.push({
      id: c.id,
      title: c.title,
      otherAppId: other.id,
      expert: true,
    });
    seen.add(other.id);
  }

  const auto = suggestComparisonsForApp(app, apps, {
    sameCategory: 3,
    compatible: 2,
  });
  for (const a of auto) {
    if (seen.has(a.otherApp.id)) continue;
    suggestions.push({
      id: pairSlug(app.id, a.otherApp.id),
      title: a.title,
      otherAppId: a.otherApp.id,
      expert: false,
    });
    seen.add(a.otherApp.id);
  }

  return (
    <AppDetailClient app={app} apps={apps} compareSuggestions={suggestions} />
  );
}

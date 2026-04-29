import { notFound } from "next/navigation";
import { AppDetailClient, type CompareSuggestion } from "@/components/AppDetailClient";
import { apps, getAppById, getComparisonsForApp } from "@/lib/data";
import { suggestComparisonsForApp, pairSlug } from "@/lib/build-comparison";

export function generateStaticParams() {
  return apps.map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const app = getAppById(params.id);
  if (!app) return { title: "App not found" };
  return {
    title: `${app.name} — AI App Catalog`,
    description: app.description,
  };
}

export default function AppDetailPage({ params }: { params: { id: string } }) {
  const app = getAppById(params.id);
  if (!app) notFound();

  // Build a unified suggestion list:
  // 1) Pre-built comparisons (Expert badge)
  // 2) Same-category competitors (auto)
  // 3) Compatible-with apps (auto)
  const expert = getComparisonsForApp(app.id);
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

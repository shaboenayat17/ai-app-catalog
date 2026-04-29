import appsData from "@/data/apps.json";
import newsData from "@/data/news.json";
import trendingData from "@/data/trending.json";
import comparisonsData from "@/data/comparisons.json";
import type { AIApp, Comparison, NewsItem, TrendingData } from "./types";

export const apps: AIApp[] = appsData as AIApp[];
export const news: NewsItem[] = newsData as NewsItem[];
export const trending: TrendingData = trendingData as TrendingData;
export const comparisons: Comparison[] = comparisonsData as Comparison[];

export function getAppById(id: string): AIApp | null {
  return apps.find((a) => a.id === id) ?? null;
}

export function getComparisonById(id: string): Comparison | null {
  return comparisons.find((c) => c.id === id) ?? null;
}

export function getComparisonsForApp(appId: string): Comparison[] {
  return comparisons.filter((c) => c.app1 === appId || c.app2 === appId);
}

export function getLastUpdated(): string {
  const dates = [
    ...apps.map((a) => a.addedDate),
    ...news.map((n) => n.date),
  ].sort();
  return dates[dates.length - 1] ?? "";
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const app of apps) for (const tag of app.tags) set.add(tag);
  return Array.from(set).sort();
}

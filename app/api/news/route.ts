import { NextResponse } from "next/server";

export const runtime = "nodejs";
// ISR: cache for 1 hour, then refresh in the background.
export const revalidate = 3600;

interface FeedSource {
  url: string;
  source: string;
  color: "orange" | "purple" | "blue" | "green";
}

const FEEDS: FeedSource[] = [
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    source: "TechCrunch",
    color: "orange",
  },
  {
    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    source: "The Verge",
    color: "purple",
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    source: "VentureBeat",
    color: "blue",
  },
  {
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    source: "MIT Tech Review",
    color: "green",
  },
];

// Source reputation order — used to keep the best version when titles dupe.
const SOURCE_RANK: Record<string, number> = {
  "MIT Tech Review": 4,
  TechCrunch: 3,
  "The Verge": 2,
  VentureBeat: 1,
};

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  date: string; // ISO
  source: string;
  sourceColor: string;
  category: string;
}

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }
  const deduped = dedupe(articles);
  deduped.sort((a, b) => b.date.localeCompare(a.date));
  return NextResponse.json(
    {
      ok: true,
      articles: deduped.slice(0, 20),
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}

/* -------------------- Feed fetching -------------------- */

async function fetchFeed(feed: FeedSource): Promise<NewsArticle[]> {
  try {
    const res = await fetch(feed.url, {
      // Identify ourselves; some feeds reject fetches without a UA.
      headers: { "User-Agent": "AI-App-Catalog/1.0 (news aggregator)" },
      // Native fetch revalidation — Next.js will dedupe identical URLs across requests.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, feed).slice(0, 10);
  } catch {
    return [];
  }
}

/* -------------------- Parsing -------------------- */

/**
 * Minimal RSS 2.0 + Atom parser. Only pulls the fields we need.
 * Avoids any XML parser dependency to keep the bundle clean.
 */
function parseFeed(xml: string, feed: FeedSource): NewsArticle[] {
  const isAtom = /<feed[\s>][^]*?xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xml);
  const entryTag = isAtom ? "entry" : "item";
  const items: NewsArticle[] = [];
  const itemRegex = new RegExp(`<${entryTag}[\\s\\S]*?</${entryTag}>`, "gi");
  const matches = xml.match(itemRegex) ?? [];

  for (const block of matches) {
    const title = stripTags(decode(matchTag(block, "title") ?? "")).trim();
    if (!title) continue;

    let url: string;
    if (isAtom) {
      // <link href="..." />  — prefer rel="alternate"
      const link =
        block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ||
        block.match(/<link[^>]*href=["']([^"']+)["']/i);
      url = link ? link[1] : "";
    } else {
      url = decode(matchTag(block, "link") ?? "").trim();
    }
    if (!url) continue;

    const dateRaw =
      matchTag(block, "pubDate") ??
      matchTag(block, "published") ??
      matchTag(block, "updated") ??
      matchTag(block, "dc:date") ??
      "";
    const date = parseDate(dateRaw) || new Date().toISOString();

    const rawSummary =
      matchTag(block, "description") ??
      matchTag(block, "summary") ??
      matchTag(block, "content:encoded") ??
      matchTag(block, "content") ??
      "";
    const summary = truncate(stripTags(decode(rawSummary)).replace(/\s+/g, " ").trim(), 200);

    const category = inferCategory(`${title} ${summary}`);

    items.push({
      title,
      summary,
      url,
      date,
      source: feed.source,
      sourceColor: feed.color,
      category,
    });
  }
  return items;
}

function matchTag(block: string, tag: string): string | null {
  // <tag ...>content</tag> — handle CDATA inside.
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag.split(":")[0]}(?::${tag.split(":")[1] ?? ""})?>`, "i");
  const simple = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(simple) ?? block.match(re);
  if (!m) return null;
  let val = m[1];
  // Unwrap CDATA
  const cdata = val.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdata) val = cdata[1];
  return val;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  // Trim at last word boundary before max.
  const cut = s.slice(0, max);
  const idx = cut.lastIndexOf(" ");
  return (idx > max - 30 ? cut.slice(0, idx) : cut) + "…";
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* -------------------- Dedupe + categorise -------------------- */

function dedupe(articles: NewsArticle[]): NewsArticle[] {
  // Bucket by normalized first-50-chars of title.
  const byKey = new Map<string, NewsArticle>();
  for (const a of articles) {
    const key = normalize(a.title).slice(0, 50);
    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, a);
      continue;
    }
    // Keep the more reputable source's version.
    const priorRank = SOURCE_RANK[prior.source] ?? 0;
    const thisRank = SOURCE_RANK[a.source] ?? 0;
    if (thisRank > priorRank) byKey.set(key, a);
  }
  return Array.from(byKey.values());
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
}

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/\b(image|art|visual|photo|illustration)\b/.test(t)) return "Image & Art";
  if (/\b(video|film|cinem|streaming)\b/.test(t)) return "Video";
  if (/\b(audio|voice|music|podcast|sound)\b/.test(t)) return "Audio & Music";
  if (/\b(code|coding|developer|programming|sdk|api)\b/.test(t)) return "Coding";
  if (/\b(research|paper|study|university|academ)\b/.test(t)) return "Research";
  if (/\b(gpt|llm|model|chatbot|assistant)\b/.test(t)) return "Text & Writing";
  return "Productivity";
}

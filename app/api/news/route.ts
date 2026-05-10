import { NextResponse } from "next/server";

export const runtime = "nodejs";
// ISR: cache for 1 hour, then refresh in the background.
export const revalidate = 3600;

interface FeedSource {
  url: string;
  source: string;
  color: string;
  /** 1 = official AI lab blogs (always included), 2 = top tech news, 3 = product blogs. */
  priority: 1 | 2 | 3;
}

const FEEDS: FeedSource[] = [
  // TIER 1 — Official AI Company Blogs
  {
    url: "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml",
    source: "Anthropic",
    color: "orange",
    priority: 1,
  },
  {
    url: "https://openai.com/news/rss.xml",
    source: "OpenAI",
    color: "green",
    priority: 1,
  },
  {
    url: "https://deepmind.google/blog/rss/feed/",
    source: "Google DeepMind",
    color: "blue",
    priority: 1,
  },
  {
    url: "https://ai.meta.com/blog/rss/",
    source: "Meta AI",
    color: "blue",
    priority: 1,
  },
  {
    url: "https://huggingface.co/blog/feed.xml",
    source: "Hugging Face",
    color: "yellow",
    priority: 1,
  },
  {
    url: "https://mistral.ai/news/rss",
    source: "Mistral AI",
    color: "purple",
    priority: 1,
  },

  // TIER 2 — Top Tech News
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    source: "TechCrunch",
    color: "orange",
    priority: 2,
  },
  {
    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    source: "The Verge",
    color: "purple",
    priority: 2,
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    source: "VentureBeat",
    color: "blue",
    priority: 2,
  },
  {
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    source: "MIT Tech Review",
    color: "green",
    priority: 2,
  },
  {
    url: "https://www.wired.com/feed/tag/artificial-intelligence/latest/rss",
    source: "Wired",
    color: "gray",
    priority: 2,
  },

  // TIER 3 — AI Tool and Product News
  {
    url: "https://research.google/blog/rss/",
    source: "Google Research",
    color: "blue",
    priority: 3,
  },
  {
    url: "https://blogs.microsoft.com/ai/feed/",
    source: "Microsoft AI",
    color: "blue",
    priority: 3,
  },
  {
    url: "https://stability.ai/news/rss.xml",
    source: "Stability AI",
    color: "purple",
    priority: 3,
  },
];

// When two sources publish near-identical headlines, prefer the higher-rank one.
const SOURCE_RANK: Record<string, number> = {
  Anthropic: 10,
  OpenAI: 10,
  "Google DeepMind": 10,
  "Meta AI": 9,
  "Hugging Face": 9,
  "Mistral AI": 9,
  "MIT Tech Review": 7,
  TechCrunch: 6,
  "The Verge": 5,
  VentureBeat: 4,
  Wired: 4,
  "Google Research": 3,
  "Microsoft AI": 3,
  "Stability AI": 3,
};

// Quick lookup of priority by source name (used for tier-1-first ordering).
const PRIORITY_BY_SOURCE: Record<string, 1 | 2 | 3> = Object.fromEntries(
  FEEDS.map((f) => [f.source, f.priority]),
);

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
  // Fetch every feed in parallel — one failure never blocks the rest.
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }

  // Dedupe by normalized title prefix, then sort newest first.
  const deduped = dedupe(articles);
  deduped.sort((a, b) => b.date.localeCompare(a.date));

  // Tier-1 sources (official AI lab blogs) always come first, then fill with
  // tier-2+ (general tech news) up to a 30-article cap.
  const tier1 = deduped.filter(
    (a) => PRIORITY_BY_SOURCE[a.source] === 1,
  );
  const tier2plus = deduped.filter(
    (a) => PRIORITY_BY_SOURCE[a.source] !== 1,
  );
  const final = [...tier1, ...tier2plus].slice(0, 30);

  return NextResponse.json(
    {
      ok: true,
      articles: final,
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

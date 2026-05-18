import { NextResponse } from "next/server";

export const runtime = "nodejs";
// ISR: cache for 30 minutes.
export const revalidate = 604800;

interface FeedSource {
  url: string;
  source: string;
  color: string;
}

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  date: string;
  source: string;
  sourceColor: string;
  category: string;
}

/* -------------------- Feed list -------------------- */

const FEEDS: FeedSource[] = [
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    source: "TechCrunch",
    color: "orange",
  },
  {
    url: "https://feeds.feedburner.com/venturebeat/SZYF",
    source: "VentureBeat",
    color: "blue",
  },
  {
    url: "https://www.artificialintelligence-news.com/feed/",
    source: "AI News",
    color: "purple",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    source: "The Verge",
    color: "purple",
  },
  {
    url: "https://thenextweb.com/feed/",
    source: "The Next Web",
    color: "red",
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    source: "Ars Technica",
    color: "orange",
  },
  {
    url: "https://www.wired.com/feed/rss",
    source: "Wired",
    color: "gray",
  },
  {
    url: "https://huggingface.co/blog/feed.xml",
    source: "Hugging Face",
    color: "yellow",
  },
  {
    url: "https://openai.com/news/rss.xml",
    source: "OpenAI",
    color: "green",
  },
  {
    url: "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml",
    source: "Anthropic",
    color: "orange",
  },
  {
    url: "https://deepmind.google/blog/rss/feed/",
    source: "Google DeepMind",
    color: "blue",
  },
  {
    url: "https://blogs.microsoft.com/ai/feed/",
    source: "Microsoft AI",
    color: "blue",
  },
  {
    url: "https://nvidianews.nvidia.com/rss/all.rss",
    source: "NVIDIA",
    color: "green",
  },
  {
    url: "https://news.mit.edu/rss/topic/artificial-intelligence2",
    source: "MIT News",
    color: "red",
  },
  {
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    source: "MIT Tech Review",
    color: "green",
  },
];

// Sources that publish only AI content. We never apply the AI keyword filter to
// them — every article they ship is on-topic by definition.
const AI_SPECIFIC_SOURCES = new Set<string>([
  "OpenAI",
  "Anthropic",
  "Google DeepMind",
  "Hugging Face",
  "Microsoft AI",
  "NVIDIA",
  "MIT News",
  "AI News",
  "MIT Tech Review",
]);

// Keywords used to keep only AI-adjacent stories from general tech outlets.
const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "chatgpt",
  "claude",
  "gemini",
  "openai",
  "anthropic",
  "llm",
  "gpt",
  "neural",
  "deep learning",
  "model",
  "nvidia",
  "automation",
  "robot",
  "agent",
  "copilot",
  "midjourney",
  "stable diffusion",
  "generative",
];

/* -------------------- Route -------------------- */

export async function GET() {
  const articles = await fetchAllFeeds();

  if (articles.length === 0) {
    // Every live feed failed — serve the static fallback so users never see
    // an empty page.
    const fallback = await getStaticFallback();
    return NextResponse.json(
      {
        ok: true,
        articles: fallback,
        source: "fallback",
        fetchedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      articles,
      source: "live",
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } },
  );
}

/* -------------------- Fetch -------------------- */

async function fetchFeed(feed: FeedSource): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        // Some publishers reject the default Node fetch UA — a browser-shaped
        // UA gets through far more reliably.
        "User-Agent":
          "Mozilla/5.0 (compatible; RSS Reader Bot/1.0)",
        Accept:
          "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      // Let Next.js dedupe identical concurrent fetches and revalidate on a 30-min cadence.
      next: { revalidate: 1800 },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Feed ${feed.source} returned ${response.status}`);
      return [];
    }

    const text = await response.text();
    if (!text || text.length < 100) {
      console.warn(`Feed ${feed.source} returned empty response`);
      return [];
    }

    return parseRSS(text, feed);
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`Feed ${feed.source} failed: ${msg}`);
    return [];
  }
}

async function fetchAllFeeds(): Promise<NewsArticle[]> {
  console.log("Fetching all news feeds...");

  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));

  const allArticles: NewsArticle[] = results
    .filter(
      (r): r is PromiseFulfilledResult<NewsArticle[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) => r.value);

  console.log(`Total raw articles: ${allArticles.length}`);

  // Deduplicate by normalized title prefix (first 50 chars).
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first.
  unique.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da;
  });

  console.log(`Unique articles after dedup: ${unique.length}`);
  return unique.slice(0, 40);
}

/* -------------------- Parse -------------------- */

function parseRSS(xml: string, feed: FeedSource): NewsArticle[] {
  const articles: NewsArticle[] = [];
  try {
    const isAtom = xml.includes("<entry>");

    // Regex-based item extraction is more forgiving than XML parsers when
    // feeds emit slightly malformed markup (very common in the wild).
    const itemPattern = isAtom
      ? /<entry>([\s\S]*?)<\/entry>/g
      : /<item>([\s\S]*?)<\/item>/g;

    const matches = [...xml.matchAll(itemPattern)];
    for (const match of matches.slice(0, 8)) {
      const item = match[1];

      const title = decodeEntities(extractTag(item, "title")).trim();
      if (!title || title.length < 5) continue;

      // For general-tech outlets, only keep AI-adjacent articles.
      const titleLower = title.toLowerCase();
      const isAISpecific = AI_SPECIFIC_SOURCES.has(feed.source);
      const hasAIKeyword = AI_KEYWORDS.some((kw) => titleLower.includes(kw));
      if (!isAISpecific && !hasAIKeyword) continue;

      // Link: RSS uses <link>url</link>, Atom uses <link href="url" />.
      let url = "";
      const linkText = item.match(/<link[^>]*>([^<]+)<\/link>/);
      if (linkText) {
        url = linkText[1].trim();
      } else {
        const linkAttr = item.match(/<link[^>]*href="([^"]+)"/);
        if (linkAttr) url = linkAttr[1].trim();
      }
      if (!url || !url.startsWith("http")) continue;

      // Description / summary.
      let description =
        extractTag(item, "description") ||
        extractTag(item, "summary") ||
        extractTag(item, "content");
      description = stripHtml(decodeEntities(description)).slice(0, 200);

      // Date.
      const rawDate =
        extractTag(item, "pubDate") ||
        extractTag(item, "published") ||
        extractTag(item, "updated") ||
        extractTag(item, "dc:date");
      const date = parseDate(rawDate);

      const category = inferCategory(titleLower);

      articles.push({
        title,
        summary: description || `Latest AI news from ${feed.source}`,
        source: feed.source,
        sourceColor: feed.color,
        url,
        date,
        category,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`Parse error for ${feed.source}: ${msg}`);
  }
  return articles;
}

/* -------------------- Tag/HTML helpers -------------------- */

function extractTag(item: string, tag: string): string {
  // Handles <tag>X</tag>, <tag attr="...">X</tag>, and <tag><![CDATA[X]]></tag>.
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<${escaped}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${escaped}>`,
    "i",
  );
  const m = item.match(re);
  return m ? m[1].trim() : "";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/* -------------------- Category inference -------------------- */

function inferCategory(titleLower: string): string {
  if (/(video|film|animation|runway|pika|sora)/.test(titleLower)) return "Video";
  if (
    /(image|art|photo|visual|midjourney|dall-e|stable diffusion)/.test(titleLower)
  )
    return "Image & Art";
  if (
    /(audio|voice|music|sound|speech|elevenlabs|suno)/.test(titleLower)
  )
    return "Audio & Music";
  if (/(code|coding|developer|programming|github|cursor)/.test(titleLower))
    return "Coding";
  if (/(research|paper|study|benchmark|model release)/.test(titleLower))
    return "Research";
  if (/(gpt|claude|gemini|llm|language model|chatbot)/.test(titleLower))
    return "Text & Writing";
  if (/(data|analytics|database|search)/.test(titleLower))
    return "Data & Analytics";
  return "Productivity";
}

/* -------------------- Static fallback -------------------- */

async function getStaticFallback(): Promise<NewsArticle[]> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "news.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const items: unknown = Array.isArray(data) ? data : (data as { articles?: unknown[] }).articles ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((raw): NewsArticle => {
      const r = raw as Partial<NewsArticle>;
      return {
        title: r.title ?? "",
        summary: r.summary ?? "",
        url: r.url ?? "",
        date: r.date ?? new Date().toISOString(),
        source: r.source ?? "",
        sourceColor: r.sourceColor ?? "gray",
        category: r.category ?? "Productivity",
      };
    });
  } catch {
    return [];
  }
}

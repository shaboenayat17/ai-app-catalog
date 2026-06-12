// One-shot migration: push every record from data/*.json into Supabase.
//
// Usage:
//   1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and
//      SUPABASE_SERVICE_ROLE_KEY filled in with real values.
//   2. Run the schema in the Supabase SQL editor (scripts/setup-database.sql).
//   3. npm run migrate
//
// Safe to run multiple times — every write is an upsert.
//
// JavaScript (not TS) so we don't need ts-node in CI.

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load env from .env.local at the repo root.
require("dotenv").config({
  path: path.join(__dirname, "..", ".env.local"),
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing Supabase environment variables!");
  console.error(
    "   Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
if (
  SUPABASE_URL.startsWith("your_") ||
  SERVICE_KEY.startsWith("your_")
) {
  console.error(
    "❌ Supabase env vars are still placeholders. Replace them with real values in .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

/* -------------------- helpers -------------------- */

function readJson(relativePath) {
  const full = path.join(__dirname, "..", relativePath);
  if (!fs.existsSync(full)) return null;
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    console.warn(`⚠️ Could not parse ${relativePath}:`, err.message);
    return null;
  }
}

async function batchUpsert(table, rows, options = {}) {
  const batchSize = 50;
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, options);
    if (error) {
      console.error(`   ❌ ${table} batch starting at ${i} failed:`, error.message);
    } else {
      total += batch.length;
      console.log(
        `   ✅ ${table} ${i + 1}–${Math.min(i + batchSize, rows.length)} of ${rows.length}`,
      );
    }
  }
  return total;
}

/* -------------------- apps -------------------- */

async function migrateApps() {
  console.log("\n📱 Migrating apps...");
  const parsed = readJson("data/apps.json");
  if (!parsed) {
    console.log("   ⚠️ No data/apps.json — skipping.");
    return [];
  }
  const apps = Array.isArray(parsed) ? parsed : parsed.apps || [];
  console.log(`   Found ${apps.length} apps in JSON.`);

  const rows = apps.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description ?? "",
    category: app.category ?? "Productivity",
    tags: app.tags || [],
    pricing: app.pricing || "Free",
    url: app.url || "",
    logo_url: app.logoUrl ?? null,
    featured: !!app.featured,
    added_date: app.addedDate || new Date().toISOString().split("T")[0],
    is_new: !!app.isNew,
    weekly_views: app.weeklyViews || 0,
    saved_count: app.savedCount || 0,
    trending_score: app.trendingScore || 50,
    trending_direction: app.trendingDirection || "stable",
    rating: parseFloat(app.rating) || 4.0,
    review_count: app.reviewCount || 0,
    best_for: app.bestFor || [],
    workflow: app.workflow || "create",
    compatible_with: app.compatibleWith || [],
    pros: app.pros || [],
    cons: app.cons || [],
    verdict: app.verdict || "",
    not_good_for: app.notGoodFor || "",
    pricing_details: app.pricing_details || {},
  }));

  const n = await batchUpsert("apps", rows);
  console.log(`✅ Apps migrated: ${n}/${rows.length}`);
  return apps;
}

/* -------------------- reviews (embedded in apps.json) -------------------- */

async function migrateReviews(apps) {
  console.log("\n⭐ Migrating reviews...");
  const reviews = [];
  for (const app of apps) {
    if (!Array.isArray(app.reviews) || app.reviews.length === 0) continue;
    for (const r of app.reviews) {
      reviews.push({
        app_id: app.id,
        author: r.author || "Anonymous",
        rating: typeof r.rating === "number" ? r.rating : 4,
        text: r.text || "",
        use_case: r.useCase || "",
        date: r.date || new Date().toISOString().split("T")[0],
      });
    }
  }
  if (reviews.length === 0) {
    console.log("   No embedded reviews to migrate.");
    return;
  }
  console.log(`   Found ${reviews.length} embedded reviews.`);

  // --- diagnostics ---
  const { data: tables, error: tableError } =
    await supabase
      .from('reviews')
      .select('count')
      .limit(1);
  console.log('Reviews table check:',
    tableError ?
    'ERROR: ' + tableError.message :
    'EXISTS ✅');

  const { data: appCount } = await supabase
    .from('apps')
    .select('count')
    .limit(1);
  console.log('Apps in database:', appCount);

  console.log('First review sample:',
    JSON.stringify(reviews[0], null, 2));
  // --- end diagnostics ---

  // Reviews don't have a stable client id; use plain insert. The migration is
  // idempotent at the app level (upsert), but reviews will duplicate if you
  // re-run — wipe the table first if you need a clean re-import.
  const batchSize = 100;
  let total = 0;
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const { error } = await supabase.from("reviews").insert(batch);
    if (error) {
      console.error(`   ❌ reviews batch ${i} failed:`, error.message);
    } else {
      total += batch.length;
    }
  }
  console.log(`✅ Reviews migrated: ${total}/${reviews.length}`);
}

/* -------------------- comparisons -------------------- */

async function migrateComparisons() {
  console.log("\n⚖️ Migrating comparisons...");
  const parsed = readJson("data/comparisons.json");
  if (!parsed) {
    console.log("   No data/comparisons.json — skipping.");
    return;
  }
  const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
  console.log(`   Found ${list.length} comparisons.`);
  const rows = list.map((c) => ({
    id: c.id,
    app1_id: c.app1 || c.app1_id || null,
    app2_id: c.app2 || c.app2_id || null,
    title: c.title || "",
    subtitle: c.subtitle || "",
    verdict: c.verdict || "",
    updated_date:
      c.updatedDate || new Date().toISOString().split("T")[0],
    dimensions: c.dimensions || [],
    quick_picks: c.quickPicks || [],
  }));
  const n = await batchUpsert("comparisons", rows);
  console.log(`✅ Comparisons migrated: ${n}/${rows.length}`);
}

/* -------------------- news -------------------- */

async function migrateNews() {
  console.log("\n📰 Migrating news...");
  const parsed = readJson("data/news.json");
  if (!parsed) {
    console.log("   No data/news.json — skipping.");
    return;
  }
  const list = Array.isArray(parsed) ? parsed : parsed.articles || [];
  if (list.length === 0) {
    console.log("   News file is empty — skipping.");
    return;
  }
  console.log(`   Found ${list.length} news items.`);
  // Dedupe by URL within the batch — the table has a UNIQUE constraint on url.
  const seen = new Set();
  const rows = list
    .filter((n) => {
      if (!n.url || seen.has(n.url)) return false;
      seen.add(n.url);
      return true;
    })
    .map((n) => ({
      title: n.title,
      summary: n.summary || "",
      source: n.source || "",
      source_color: n.sourceColor || n.color || "gray",
      url: n.url,
      date: n.date || new Date().toISOString(),
      category: n.category || "Productivity",
    }));
  const n = await batchUpsert("news", rows, {
    onConflict: "url",
    ignoreDuplicates: true,
  });
  console.log(`✅ News migrated: ${n}/${rows.length}`);
}

/* -------------------- main -------------------- */

async function main() {
  console.log("🚀 Starting Supabase migration");
  console.log("   URL:", SUPABASE_URL);

  const apps = await migrateApps();
  await migrateReviews(apps);
  await migrateComparisons();
  await migrateNews();

  console.log("\n🎉 Migration complete!");
  console.log("   Check your Supabase dashboard to verify data.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

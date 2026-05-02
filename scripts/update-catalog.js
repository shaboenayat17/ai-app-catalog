#!/usr/bin/env node
/**
 * Auto-update script for the AI app catalog.
 *
 * Calls the OpenAI API once, asks for 3-5 new app suggestions,
 * validates them carefully, and appends the survivors to data/apps.json.
 * Writes a markdown summary to scripts/last-update-summary.txt for the
 * GitHub Action to embed in the Pull Request body.
 *
 * Safety rules (see PART 3 of the spec):
 *   - Never adds more than MAX_NEW_APPS apps per run
 *   - Never modifies or removes existing apps
 *   - Exits cleanly (code 0) on any OpenAI / parse error so the workflow
 *     just produces no PR rather than failing red
 *   - Logs every accept/skip with a reason
 */

const fs = require("fs");
const path = require("path");

/* -------------------- Config -------------------- */

const APPS_PATH = path.join(__dirname, "..", "data", "apps.json");
const SUMMARY_PATH = path.join(__dirname, "last-update-summary.txt");

const MAX_NEW_APPS = 5;
const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.7;

const ALLOWED_CATEGORIES = new Set([
  "Text & Writing",
  "Image & Art",
  "Video",
  "Audio & Music",
  "Coding",
  "Productivity",
  "Research",
  "Data & Analytics",
  "Avatar & Meetings",
  "3D & Design",
]);
const ALLOWED_PRICING = new Set(["Free", "Freemium", "Paid"]);
const ALLOWED_WORKFLOW = new Set([
  "create",
  "edit",
  "publish",
  "analyze",
  "automate",
]);
const ALLOWED_TREND = new Set(["up", "down", "stable"]);

/* -------------------- Logging -------------------- */

function log(msg) {
  console.log(`[catalog-update] ${msg}`);
}

/** Exit cleanly without changes — used when OpenAI is unreachable / returns junk. */
function bailClean(reason) {
  log(`Bailing without changes: ${reason}`);
  writeSummary({
    accepted: [],
    rejected: [],
    note: `Run completed without changes: ${reason}`,
  });
  process.exit(0);
}

/* -------------------- Main -------------------- */

(async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    bailClean("OPENAI_API_KEY env var not set");
    return;
  }

  log(`Reading ${APPS_PATH}…`);
  let apps;
  try {
    apps = JSON.parse(fs.readFileSync(APPS_PATH, "utf8"));
  } catch (err) {
    bailClean(`could not read apps.json: ${err.message}`);
    return;
  }
  if (!Array.isArray(apps)) {
    bailClean("apps.json is not an array");
    return;
  }

  const existingIds = new Set(apps.map((a) => a.id));
  const existingNames = apps.map((a) => a.name);
  log(`Catalog has ${apps.length} apps`);

  const today = new Date().toISOString().slice(0, 10);
  const prompt = buildPrompt(existingNames, today);

  log(`Calling OpenAI API (${MODEL})…`);
  let raw;
  try {
    raw = await callOpenAI(apiKey, prompt);
  } catch (err) {
    bailClean(`OpenAI request failed: ${err.message}`);
    return;
  }
  if (!raw) {
    bailClean("OpenAI returned no content");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log(`raw response (first 500 chars): ${String(raw).slice(0, 500)}`);
    bailClean(`could not parse OpenAI JSON: ${err.message}`);
    return;
  }

  if (!parsed || !Array.isArray(parsed.newApps)) {
    bailClean("response did not contain a newApps array");
    return;
  }

  const candidates = parsed.newApps.slice(0, MAX_NEW_APPS);
  log(`Got ${parsed.newApps.length} candidates, capped at ${candidates.length}`);

  const accepted = [];
  const rejected = [];
  for (const cand of candidates) {
    const issues = validate(cand, existingIds);
    if (issues.length > 0) {
      const label = (cand && (cand.name || cand.id)) || "(unknown)";
      log(`SKIP "${label}": ${issues.join("; ")}`);
      rejected.push({ name: label, issues });
      continue;
    }
    accepted.push(cand);
    existingIds.add(cand.id); // prevent dupes within this batch
    log(`ACCEPT "${cand.name}" (${cand.id})`);
  }

  if (accepted.length === 0) {
    log("No valid new apps to add.");
    writeSummary({
      accepted: [],
      rejected,
      note: "OpenAI suggested apps but none passed validation.",
    });
    process.exit(0);
    return;
  }

  // SAFETY: append-only, never mutate existing entries.
  const updated = [...apps, ...accepted];
  fs.writeFileSync(APPS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
  log(`Wrote ${accepted.length} new app(s) to apps.json (total now ${updated.length})`);

  writeSummary({ accepted, rejected });
})().catch((err) => {
  // Catch any escaped error and exit cleanly
  log(`FATAL (caught): ${err && err.stack ? err.stack : err}`);
  process.exit(0);
});

/* -------------------- Prompt -------------------- */

function buildPrompt(existingNames, today) {
  const existingList = existingNames.join(", ");
  return `You are a researcher helping maintain an AI app catalog. The catalog currently has these apps: ${existingList}.

Research and suggest 3-5 NEW AI apps that have launched or gained significant attention recently that are NOT already in the catalog above.

For each app return ONLY valid JSON in this exact format:
{
  "newApps": [
    {
      "id": "unique-slug-lowercase",
      "name": "App Name",
      "description": "One sentence description",
      "category": "one of: Text & Writing, Image & Art, Video, Audio & Music, Coding, Productivity, Research, Data & Analytics, Avatar & Meetings, 3D & Design",
      "tags": ["tag1", "tag2"],
      "pricing": "Free or Freemium or Paid",
      "url": "https://...",
      "logoUrl": null,
      "featured": false,
      "addedDate": "${today}",
      "isNew": true,
      "weeklyViews": 0,
      "savedCount": 0,
      "trendingScore": 50,
      "trendingDirection": "up",
      "rating": 4.0,
      "reviewCount": 0,
      "reviews": [],
      "bestFor": [],
      "workflow": "create",
      "compatibleWith": [],
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2", "Con 3"],
      "verdict": "Who this is best for",
      "notGoodFor": "Who should avoid this",
      "pricing_details": {
        "free_tier": true,
        "free_tier_limits": "description or null",
        "starting_price": "$X/month or null",
        "most_popular_plan": "$X/month or null",
        "annual_discount": "X% or null",
        "has_student_discount": false,
        "free_trial": "X days or none",
        "estimated_monthly_cost": {
          "light_user": "$0-5",
          "regular_user": "$10-20",
          "power_user": "$30-50"
        }
      }
    }
  ]
}

Rules:
- Return ONLY the JSON object. No preamble, no markdown fences, no commentary.
- Every "id" must be lowercase-with-hyphens, unique, and NOT match any existing app.
- Every "url" must start with "https://".
- "category" must be exactly one of the values listed above.
- "pricing" must be exactly "Free", "Freemium", or "Paid".
- "addedDate" must be "${today}".
- "pros" and "cons" must each be a non-empty array of short, specific strings.`;
}

/* -------------------- OpenAI call -------------------- */

async function callOpenAI(apiKey, prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a careful AI researcher. Always return strictly valid JSON matching the schema you're given.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  return data && data.choices && data.choices[0]
    ? data.choices[0].message && data.choices[0].message.content
    : null;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/* -------------------- Validation -------------------- */

const REQUIRED_TOP_FIELDS = [
  "id",
  "name",
  "description",
  "category",
  "tags",
  "pricing",
  "url",
  "logoUrl",
  "featured",
  "addedDate",
  "isNew",
  "weeklyViews",
  "savedCount",
  "trendingScore",
  "trendingDirection",
  "rating",
  "reviewCount",
  "reviews",
  "bestFor",
  "workflow",
  "compatibleWith",
  "pros",
  "cons",
  "verdict",
  "notGoodFor",
  "pricing_details",
];

const REQUIRED_PRICING_FIELDS = [
  "free_tier",
  "free_tier_limits",
  "starting_price",
  "most_popular_plan",
  "annual_discount",
  "has_student_discount",
  "free_trial",
  "estimated_monthly_cost",
];

function validate(app, existingIds) {
  const issues = [];
  if (!app || typeof app !== "object" || Array.isArray(app)) {
    return ["candidate is not an object"];
  }

  for (const k of REQUIRED_TOP_FIELDS) {
    if (!(k in app)) issues.push(`missing field: ${k}`);
  }

  // ID
  if (typeof app.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(app.id || "")) {
    issues.push("id must be lowercase slug (a-z, 0-9, hyphens)");
  } else if (existingIds.has(app.id)) {
    issues.push(`duplicate id: ${app.id}`);
  }

  // Strings
  if (typeof app.name !== "string" || !app.name.trim()) issues.push("name must be a non-empty string");
  if (typeof app.description !== "string" || !app.description.trim()) issues.push("description must be a non-empty string");
  if (typeof app.verdict !== "string" || !app.verdict.trim()) issues.push("verdict must be a non-empty string");
  if (typeof app.notGoodFor !== "string") issues.push("notGoodFor must be a string");

  // URL
  if (typeof app.url !== "string" || !app.url.startsWith("https://")) {
    issues.push("url must start with https://");
  }

  // Enums
  if (!ALLOWED_CATEGORIES.has(app.category)) {
    issues.push(`invalid category: ${app.category}`);
  }
  if (!ALLOWED_PRICING.has(app.pricing)) {
    issues.push(`invalid pricing: ${app.pricing}`);
  }
  if (!ALLOWED_WORKFLOW.has(app.workflow)) {
    issues.push(`invalid workflow: ${app.workflow}`);
  }
  if (!ALLOWED_TREND.has(app.trendingDirection)) {
    issues.push(`invalid trendingDirection: ${app.trendingDirection}`);
  }

  // Arrays
  if (!Array.isArray(app.tags)) issues.push("tags must be an array");
  if (!Array.isArray(app.bestFor)) issues.push("bestFor must be an array");
  if (!Array.isArray(app.compatibleWith)) issues.push("compatibleWith must be an array");
  if (!Array.isArray(app.reviews)) issues.push("reviews must be an array");
  if (!Array.isArray(app.pros) || app.pros.length === 0) issues.push("pros must be a non-empty array");
  if (!Array.isArray(app.cons) || app.cons.length === 0) issues.push("cons must be a non-empty array");

  // Numbers / booleans
  if (typeof app.featured !== "boolean") issues.push("featured must be boolean");
  if (typeof app.isNew !== "boolean") issues.push("isNew must be boolean");
  if (typeof app.rating !== "number") issues.push("rating must be number");
  if (typeof app.reviewCount !== "number") issues.push("reviewCount must be number");
  if (typeof app.weeklyViews !== "number") issues.push("weeklyViews must be number");
  if (typeof app.savedCount !== "number") issues.push("savedCount must be number");
  if (typeof app.trendingScore !== "number") issues.push("trendingScore must be number");

  // Date
  if (typeof app.addedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(app.addedDate)) {
    issues.push("addedDate must be YYYY-MM-DD");
  }

  // Pricing details object
  if (!app.pricing_details || typeof app.pricing_details !== "object") {
    issues.push("pricing_details must be an object");
  } else {
    for (const k of REQUIRED_PRICING_FIELDS) {
      if (!(k in app.pricing_details)) issues.push(`pricing_details.${k} missing`);
    }
    const emc = app.pricing_details.estimated_monthly_cost;
    if (!emc || typeof emc !== "object") {
      issues.push("pricing_details.estimated_monthly_cost must be an object");
    } else {
      for (const k of ["light_user", "regular_user", "power_user"]) {
        if (typeof emc[k] !== "string") issues.push(`pricing_details.estimated_monthly_cost.${k} must be a string`);
      }
    }
    if (typeof app.pricing_details.free_tier !== "boolean") {
      issues.push("pricing_details.free_tier must be boolean");
    }
    if (typeof app.pricing_details.has_student_discount !== "boolean") {
      issues.push("pricing_details.has_student_discount must be boolean");
    }
  }

  return issues;
}

/* -------------------- Summary writer -------------------- */

function writeSummary({ accepted, rejected, note }) {
  const lines = [];

  if (note) {
    lines.push(`> ${note}`);
    lines.push("");
  }

  if (accepted.length === 0) {
    lines.push("_No new apps were added in this run._");
  } else {
    for (const a of accepted) {
      lines.push(`- **${escapeMd(a.name)}** — _${escapeMd(a.category)}_ · ${escapeMd(a.pricing)}`);
      lines.push(`  ${escapeMd(a.description)}`);
      lines.push(`  [${escapeMd(a.url)}](${a.url})`);
      lines.push("");
    }
  }

  if (rejected.length > 0) {
    lines.push("");
    lines.push("### Skipped suggestions");
    for (const r of rejected) {
      lines.push(`- ${escapeMd(r.name)} — ${r.issues.map(escapeMd).join("; ")}`);
    }
  }

  fs.writeFileSync(SUMMARY_PATH, lines.join("\n") + "\n", "utf8");
  log(`Wrote summary → ${SUMMARY_PATH}`);
}

function escapeMd(s) {
  return String(s).replace(/[*_`<>]/g, (c) => `\\${c}`);
}

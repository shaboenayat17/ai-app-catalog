-- AI App Catalog — Supabase schema.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → paste →
-- Run). It's idempotent: every CREATE uses IF NOT EXISTS and every policy is
-- dropped/recreated so you can run it again after schema tweaks without
-- losing data.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------- apps
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  pricing TEXT,
  url TEXT,
  logo_url TEXT,
  featured BOOLEAN DEFAULT false,
  added_date DATE,
  is_new BOOLEAN DEFAULT false,
  weekly_views INTEGER DEFAULT 0,
  saved_count INTEGER DEFAULT 0,
  trending_score INTEGER DEFAULT 50,
  trending_direction TEXT DEFAULT 'stable',
  rating DECIMAL(3,2) DEFAULT 4.0,
  review_count INTEGER DEFAULT 0,
  best_for TEXT[] DEFAULT '{}',
  workflow TEXT DEFAULT 'create',
  compatible_with TEXT[] DEFAULT '{}',
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  verdict TEXT DEFAULT '',
  not_good_for TEXT DEFAULT '',
  pricing_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Useful indexes for the most-common queries.
CREATE INDEX IF NOT EXISTS apps_featured_idx       ON apps (featured)       WHERE featured = true;
CREATE INDEX IF NOT EXISTS apps_is_new_idx         ON apps (is_new)         WHERE is_new = true;
CREATE INDEX IF NOT EXISTS apps_trending_idx       ON apps (trending_score DESC);
CREATE INDEX IF NOT EXISTS apps_added_date_idx     ON apps (added_date DESC);
CREATE INDEX IF NOT EXISTS apps_category_idx       ON apps (category);

-- ---------------------------------------------------------------- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  use_case TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_app_id_idx ON reviews (app_id);

-- ---------------------------------------------------------------- news
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  source_color TEXT,
  url TEXT UNIQUE,
  date TIMESTAMPTZ,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_date_idx ON news (date DESC);

-- ---------------------------------------------------------------- pending_apps
CREATE TABLE IF NOT EXISTS pending_apps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pending_apps_status_idx ON pending_apps (status);

-- ---------------------------------------------------------------- comparisons
CREATE TABLE IF NOT EXISTS comparisons (
  id TEXT PRIMARY KEY,
  app1_id TEXT,
  app2_id TEXT,
  title TEXT,
  subtitle TEXT,
  verdict TEXT,
  updated_date DATE,
  dimensions JSONB DEFAULT '[]',
  quick_picks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comparisons_app1_idx ON comparisons (app1_id);
CREATE INDEX IF NOT EXISTS comparisons_app2_idx ON comparisons (app2_id);

-- =============================================================== RLS
ALTER TABLE apps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE news          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_apps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so we can re-run this script.
DROP POLICY IF EXISTS "public_read_apps"         ON apps;
DROP POLICY IF EXISTS "public_read_reviews"      ON reviews;
DROP POLICY IF EXISTS "public_insert_reviews"    ON reviews;
DROP POLICY IF EXISTS "public_read_news"         ON news;
DROP POLICY IF EXISTS "public_read_comparisons"  ON comparisons;
DROP POLICY IF EXISTS "public_read_pending"      ON pending_apps;

-- Public read policies — anyone can read catalog content.
CREATE POLICY "public_read_apps" ON apps
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_reviews" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

-- Users can submit a review without authentication. The app rating gets
-- recalculated server-side after each insert (service role bypasses RLS).
CREATE POLICY "public_insert_reviews" ON reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_read_news" ON news
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_comparisons" ON comparisons
  FOR SELECT TO anon, authenticated USING (true);

-- pending_apps is intentionally not exposed to anon — only the service role
-- (admin panel + robot) can read or modify it. No public policy is created.

-- Service role bypasses RLS automatically, so writes from admin API routes
-- and the robot script work without any additional policy. No additional
-- policies are needed.

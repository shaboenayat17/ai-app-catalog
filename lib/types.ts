export type Category =
  | "Text & Writing"
  | "Image & Art"
  | "Video"
  | "Audio & Music"
  | "Coding"
  | "Productivity"
  | "Research"
  | "Data & Analytics"
  | "Avatar & Meetings"
  | "3D & Design";

export type Pricing = "Free" | "Freemium" | "Paid";
export type Workflow = "create" | "edit" | "publish" | "analyze" | "automate";

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  useCase: string;
  helpfulCount?: number;
}

export interface PricingDetails {
  free_tier: boolean;
  free_tier_limits: string;
  starting_price: string;
  most_popular_plan: string;
  annual_discount: string;
  has_student_discount: boolean;
  free_trial: string;
  estimated_monthly_cost: {
    light_user: string;
    regular_user: string;
    power_user: string;
  };
}

export type TrendingDirection = "up" | "down" | "stable";

export interface AIApp {
  id: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  pricing: Pricing;
  url: string;
  logoUrl: string | null;
  featured: boolean;
  addedDate: string;
  compatibleWith: string[];
  bestFor: string[];
  workflow: Workflow;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  pricing_details: PricingDetails;
  weeklyViews: number;
  savedCount: number;
  trendingScore: number;
  trendingDirection: TrendingDirection;
  isNew: boolean;
  pros: string[];
  cons: string[];
  verdict: string;
  notGoodFor: string;
}

export interface ComparisonDimension {
  name: string;
  winner: string; // appId or "tie"
  app1Score: number; // 1-5
  app2Score: number; // 1-5
  explanation: string;
}

export interface ComparisonQuickPick {
  app: string; // appId
  label: string;
  points: string[];
}

export interface Comparison {
  id: string;
  app1: string;
  app2: string;
  title: string;
  subtitle: string;
  verdict: string;
  updatedDate: string;
  dimensions: ComparisonDimension[];
  quickPicks: ComparisonQuickPick[];
}

export interface TrendingStack {
  id: string;
  title: string;
  subtitle: string;
  apps: string[];
  saves: number;
  useCase: string;
  week: string;
}

export interface TrendingData {
  trending_stacks: TrendingStack[];
  trending_apps: string[];
  new_this_week: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  category: string;
}

export const CATEGORIES: Category[] = [
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
];

export const PRICING_OPTIONS: Pricing[] = ["Free", "Freemium", "Paid"];

export interface CategoryMeta {
  emoji: string;
  hex: string;
  badge: string;       // chip class for inline badges
  bar: string;         // bg class for left color strip
  glow: string;        // box-shadow class
  pillActive: string;  // selected filter pill class
  pillIdle: string;    // idle filter pill class
  ring: string;        // ring class for focused/active nodes
  text: string;        // text color
  headerBg: string;    // background for compare table header
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Text & Writing": {
    emoji: "✍️",
    hex: "#60a5fa",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    bar: "bg-blue-500",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.25)]",
    pillActive: "bg-blue-500/20 text-blue-100 border-blue-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-blue-400/50 hover:text-blue-200",
    ring: "ring-blue-400/60",
    text: "text-blue-300",
    headerBg: "bg-blue-500/15",
  },
  "Image & Art": {
    emoji: "🎨",
    hex: "#a855f7",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    bar: "bg-purple-500",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.25)]",
    pillActive: "bg-purple-500/20 text-purple-100 border-purple-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-purple-400/50 hover:text-purple-200",
    ring: "ring-purple-400/60",
    text: "text-purple-300",
    headerBg: "bg-purple-500/15",
  },
  Video: {
    emoji: "🎬",
    hex: "#fb923c",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    bar: "bg-orange-500",
    glow: "shadow-[0_0_30px_rgba(251,146,60,0.25)]",
    pillActive: "bg-orange-500/20 text-orange-100 border-orange-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-orange-400/50 hover:text-orange-200",
    ring: "ring-orange-400/60",
    text: "text-orange-300",
    headerBg: "bg-orange-500/15",
  },
  "Audio & Music": {
    emoji: "🎵",
    hex: "#34d399",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bar: "bg-emerald-500",
    glow: "shadow-[0_0_30px_rgba(52,211,153,0.25)]",
    pillActive: "bg-emerald-500/20 text-emerald-100 border-emerald-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-emerald-400/50 hover:text-emerald-200",
    ring: "ring-emerald-400/60",
    text: "text-emerald-300",
    headerBg: "bg-emerald-500/15",
  },
  Coding: {
    emoji: "💻",
    hex: "#facc15",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    bar: "bg-yellow-500",
    glow: "shadow-[0_0_30px_rgba(250,204,21,0.25)]",
    pillActive: "bg-yellow-500/20 text-yellow-100 border-yellow-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-yellow-400/50 hover:text-yellow-200",
    ring: "ring-yellow-400/60",
    text: "text-yellow-300",
    headerBg: "bg-yellow-500/15",
  },
  Productivity: {
    emoji: "⚡",
    hex: "#2dd4bf",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    bar: "bg-teal-500",
    glow: "shadow-[0_0_30px_rgba(45,212,191,0.25)]",
    pillActive: "bg-teal-500/20 text-teal-100 border-teal-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-teal-400/50 hover:text-teal-200",
    ring: "ring-teal-400/60",
    text: "text-teal-300",
    headerBg: "bg-teal-500/15",
  },
  Research: {
    emoji: "🔬",
    hex: "#818cf8",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    bar: "bg-indigo-500",
    glow: "shadow-[0_0_30px_rgba(129,140,248,0.25)]",
    pillActive: "bg-indigo-500/20 text-indigo-100 border-indigo-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-indigo-400/50 hover:text-indigo-200",
    ring: "ring-indigo-400/60",
    text: "text-indigo-300",
    headerBg: "bg-indigo-500/15",
  },
  "Data & Analytics": {
    emoji: "📊",
    hex: "#22d3ee",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    bar: "bg-cyan-500",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.25)]",
    pillActive: "bg-cyan-500/20 text-cyan-100 border-cyan-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-cyan-400/50 hover:text-cyan-200",
    ring: "ring-cyan-400/60",
    text: "text-cyan-300",
    headerBg: "bg-cyan-500/15",
  },
  "Avatar & Meetings": {
    emoji: "🧑‍💼",
    hex: "#f472b6",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    bar: "bg-pink-500",
    glow: "shadow-[0_0_30px_rgba(244,114,182,0.25)]",
    pillActive: "bg-pink-500/20 text-pink-100 border-pink-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-pink-400/50 hover:text-pink-200",
    ring: "ring-pink-400/60",
    text: "text-pink-300",
    headerBg: "bg-pink-500/15",
  },
  "3D & Design": {
    emoji: "🧊",
    hex: "#fbbf24",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bar: "bg-amber-500",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.25)]",
    pillActive: "bg-amber-500/20 text-amber-100 border-amber-400/60",
    pillIdle: "border-border bg-bg-card text-muted hover:border-amber-400/50 hover:text-amber-200",
    ring: "ring-amber-400/60",
    text: "text-amber-300",
    headerBg: "bg-amber-500/15",
  },
};

export const PRICING_COLORS: Record<Pricing, string> = {
  Free: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Freemium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Paid: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

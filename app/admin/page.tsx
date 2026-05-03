import { AdminPanel } from "@/components/AdminPanel";
import { apps } from "@/lib/data";

export const metadata = {
  title: "Admin — AI App Catalog",
  description: "Review and approve robot-suggested apps.",
  robots: { index: false, follow: false },
};

// Always render fresh — admin actions mutate JSON we read on first paint.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  const githubRepo =
    process.env.GITHUB_REPOSITORY ||
    process.env.NEXT_PUBLIC_GITHUB_REPOSITORY ||
    undefined;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return (
    <AdminPanel
      initialApps={apps}
      githubRepo={githubRepo}
      siteUrl={siteUrl}
    />
  );
}

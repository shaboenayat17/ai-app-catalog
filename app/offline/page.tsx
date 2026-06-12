import { OfflineClient } from "@/components/OfflineClient";
import { getApps } from "@/lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Offline — AI App Catalog",
  description: "You're offline. Reconnect to discover new AI apps.",
  robots: { index: false, follow: false },
};

export default async function OfflinePage() {
  // Pass the full catalog so we can resolve recently-viewed IDs from localStorage.
  const apps = await getApps();
  return <OfflineClient apps={apps} />;
}

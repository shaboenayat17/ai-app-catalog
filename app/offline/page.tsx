import { OfflineClient } from "@/components/OfflineClient";
import { apps } from "@/lib/data";

export const metadata = {
  title: "Offline — AI App Catalog",
  description: "You're offline. Reconnect to discover new AI apps.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  // Pass the full catalog so we can resolve recently-viewed IDs from localStorage.
  return <OfflineClient apps={apps} />;
}

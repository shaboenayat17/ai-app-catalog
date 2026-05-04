import { NewsClient } from "@/components/NewsClient";
import { news } from "@/lib/data";

export const metadata = {
  title: "News — AI App Catalog",
  description: "Live AI news pulled hourly from TechCrunch, The Verge, VentureBeat, and MIT Tech Review.",
};

export default function NewsPage() {
  return <NewsClient fallback={news} />;
}

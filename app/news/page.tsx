import { NewsClient } from "@/components/NewsClient";
import { getNewsFromDB } from "@/lib/db";

export const revalidate = 60;

export const metadata = {
  title: "News — AI App Catalog",
  description:
    "Live AI news pulled weekly from TechCrunch, The Verge, VentureBeat, and MIT Tech Review.",
};

export default async function NewsPage() {
  const fallback = await getNewsFromDB();
  return <NewsClient fallback={fallback} />;
}

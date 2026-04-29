import Link from "next/link";
import { news } from "@/lib/data";

export const metadata = {
  title: "News — AI App Catalog",
  description: "Recent updates and launches across the AI app landscape.",
};

export default function NewsPage() {
  const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          News
        </h1>
        <p className="mt-3 text-muted-strong">
          Short, hand-picked updates across AI apps and models. Curated weekly.
        </p>
      </header>

      <ul className="space-y-4">
        {sorted.map((item, i) => (
          <li
            key={i}
            className="group rounded-xl border border-border bg-bg-card p-5 transition hover:border-accent/40 hover:bg-bg-hover"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
              <span className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5">
                {item.category}
              </span>
              <span>{formatDate(item.date)}</span>
              <span>·</span>
              <span>{item.source}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block text-lg font-semibold text-white transition group-hover:text-accent"
            >
              {item.title}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-muted-strong">
              {item.summary}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl border border-dashed border-border bg-bg-card/40 p-6 text-center text-sm text-muted">
        <p>
          Want to suggest a story?{" "}
          <Link href="/" className="text-accent hover:text-accent-hover">
            Open the catalog
          </Link>{" "}
          and use “Suggest an app” in the header.
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

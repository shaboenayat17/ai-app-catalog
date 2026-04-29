export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-bg/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          AI App Catalog — a curated, static directory.{" "}
          <span className="text-muted-strong">Built with Next.js + Tailwind.</span>
        </p>
        <p className="text-xs">
          Data is hand-curated. Pricing and features change — always check the source.
        </p>
      </div>
    </footer>
  );
}

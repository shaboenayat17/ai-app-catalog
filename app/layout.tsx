import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/lib/compare-context";
import { CompareDock } from "@/components/CompareDock";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { BottomNav } from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { apps } from "@/lib/data";

export const metadata: Metadata = {
  title: "AI App Catalog — Find your perfect AI stack",
  description:
    "A curated, searchable directory of AI-powered apps across writing, image, video, audio, coding, and more. Drag, compare, and connect.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        <CompareProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CompareDock apps={apps} />
          <KeyboardShortcuts />
          <FAB />
          <BottomNav />
        </CompareProvider>
      </body>
    </html>
  );
}

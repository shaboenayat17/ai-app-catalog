import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/lib/compare-context";
import { MenuProvider } from "@/lib/menu-context";
import { CompareDock } from "@/components/CompareDock";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { BottomNav } from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { InstallBanner } from "@/components/InstallBanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { getApps } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";
import { adminEnabled, readPendingCount } from "@/lib/admin";

export const metadata: Metadata = {
  title: "AI App Catalog — Find your perfect AI stack",
  description:
    "A curated, searchable directory of AI-powered apps across writing, image, video, audio, coding, and more. Drag, compare, and connect.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Catalog",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#6366f1",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showAdmin = adminEnabled();
  // Pull apps + pending count in parallel — single round trip per request.
  const [apps, pendingCount] = await Promise.all([
    getApps(),
    showAdmin ? readPendingCount() : Promise.resolve(0),
  ]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        <CompareProvider>
          <MenuProvider>
            <Header adminEnabled={showAdmin} pendingCount={pendingCount} />
            <main>{children}</main>
            <Footer />
            <CompareDock apps={apps} />
            <KeyboardShortcuts />
            <FAB apps={apps} />
            <BottomNav />
            <HamburgerMenu
              appCount={apps.length}
              categoryCount={CATEGORIES.length}
              adminEnabled={showAdmin}
            />
            <InstallBanner />
          </MenuProvider>
        </CompareProvider>
      </body>
    </html>
  );
}

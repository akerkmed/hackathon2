import type { Metadata, Viewport } from "next";
import { PresentationProvider } from "@/components/presentation/presentation-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "M3ak — Life doesn't come in forms",
    template: "%s · M3ak",
  },
  description:
    "M3ak is the life-event operating system for Moroccan public services: one conversation, one consent, every agency.",
  applicationName: "M3ak",
  authors: [{ name: "M3ak" }],
  keywords: ["Morocco", "public services", "AI agent", "life events", "Darija", "hackathon"],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "M3ak — Life doesn't come in forms",
    description: "One conversation. One consent. Six public services orchestrated.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3a2a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-cream text-ink antialiased">
        <PresentationProvider>{children}</PresentationProvider>
      </body>
    </html>
  );
}

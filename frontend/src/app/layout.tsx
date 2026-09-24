import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import Providers from "@/components/Providers";
import TerrainBackground from "@/components/TerrainBackground";
import ScrollProgress from "@/components/ScrollProgress";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060B1C",
};

export const metadata: Metadata = {
  title: "Building Damage Assessment — Post-Disaster Satellite Analysis",
  description:
    "Interactive visualization of building damage from post-disaster satellite imagery using AI-powered change detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans text-paper antialiased">
        <Providers>
          <TerrainBackground />
          <ScrollProgress />
          {children}
        </Providers>
      </body>
    </html>
  );
}

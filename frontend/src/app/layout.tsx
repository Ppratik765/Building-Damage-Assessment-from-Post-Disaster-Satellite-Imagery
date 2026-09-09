import type { Metadata } from "next";
import { Fira_Code, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

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
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased bg-[#0f172a] text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CosmicTasha — AI-Native SOC 2 Compliance",
    template: "%s | CosmicTasha",
  },
  description:
    "Generate SOC 2 compliance documents in under 30 minutes. AI-powered intake, real-time gap analysis, and 14 audit-ready policies tailored to your company.",
  keywords: [
    "SOC 2",
    "compliance",
    "audit",
    "security policy",
    "gap analysis",
    "compliance documents",
    "AI compliance",
    "SOC 2 Type II",
  ],
  authors: [{ name: "CosmicTasha" }],
  openGraph: {
    type: "website",
    title: "CosmicTasha — AI-Native SOC 2 Compliance",
    description:
      "Generate SOC 2 compliance documents in under 30 minutes.",
    siteName: "CosmicTasha",
  },
  twitter: {
    card: "summary_large_image",
    title: "CosmicTasha — AI-Native SOC 2 Compliance",
    description:
      "Generate SOC 2 compliance documents in under 30 minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

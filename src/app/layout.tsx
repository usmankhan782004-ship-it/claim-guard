import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClaimGuard — AI Bill Dispute Agent",
  description:
    "AI-powered bill dispute agent for Medical, Auto Insurance, Rent, and Utility bills. Identify overcharges and generate legal dispute letters instantly.",
  keywords: [
    "bill dispute",
    "overcharge detection",
    "medical bills",
    "auto insurance",
    "rent fees",
    "utility billing",
    "AI agent",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ClaimGuard — AI Bill Dispute Agent",
    description:
      "AI-powered bill analysis. Only pay 20% of what we save you — or $10 Quick Win for small bills.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="font-sans antialiased cyber-grid min-h-screen"
        style={{ background: "linear-gradient(180deg, #020617 0%, #0a0f1e 100%)" }}
      >
        {/* Scan line effect */}
        <div className="scan-line" />

        {/* Main Content */}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getMetadataBase } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
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
  verification:
    googleSiteVerification || bingSiteVerification
      ? {
          ...(googleSiteVerification
            ? { google: googleSiteVerification }
            : {}),
          ...(bingSiteVerification
            ? { other: { "msvalidate.01": bingSiteVerification } }
            : {}),
        }
      : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        {bingSiteVerification ? (
          <meta name="msvalidate.01" content={bingSiteVerification} />
        ) : null}
      </head>
      <body
        className="font-sans antialiased cyber-grid min-h-screen"
        style={{ background: "linear-gradient(180deg, #020617 0%, #0a0f1e 100%)" }}
      >
        <div className="scan-line" />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}

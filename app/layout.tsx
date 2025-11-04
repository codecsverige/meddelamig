import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MEDDELA - SMS-plattform för svenska företag",
    template: "%s | MEDDELA",
  },
  description:
    "Automatiska SMS-påminnelser för restauranger, salonger och verkstäder i Sverige. Minska no-shows med 35% och spara tid med vår smarta SMS-plattform.",
  keywords: [
    "sms",
    "påminnelser",
    "restaurang",
    "salong",
    "verkstad",
    "bokningssystem",
    "sverige",
    "46elks",
    "automatisering",
    "no-shows",
  ],
  authors: [{ name: "MEDDELA" }],
  creator: "MEDDELA",
  publisher: "MEDDELA",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "/",
    siteName: "MEDDELA",
    title: "MEDDELA - SMS-plattform för svenska företag",
    description: "Automatiska SMS-påminnelser för restauranger, salonger och verkstäder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MEDDELA SMS Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEDDELA - SMS-plattform för svenska företag",
    description: "Automatiska SMS-påminnelser för restauranger, salonger och verkstäder",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

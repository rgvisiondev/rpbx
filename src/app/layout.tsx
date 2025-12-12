import type { Metadata } from "next";
import { Poppins, Saira_Condensed } from "next/font/google";
import Footer from "./components/Footer";
import CookieConsentWrapper from "@/components/cookieconsent";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-saira",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rioplexbizx.com"),
  title: "RioPlex Business Exchange",
  description: "Premier business brokerage platform connecting business owners with investors. Find business brokers, sell your business fast, search businesses for sale near you. Serving Texas including Houston, Austin business brokers. Expert business valuations and CIM services.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    images: [
      {
        url: "/RPBX-opengraph-logo.png",
        width: 1200,
        height: 630,
      },
      {
        url: "/RPBX-opengraph-icon.png",
        width: 800,
        height: 800,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Existing GA4 script */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />

        {/* Google Ads additional tag */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17790035839"
          strategy="afterInteractive"
        />

        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('js', new Date());

            // Existing GA4 config
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });

            // Additional Google Ads tag
            gtag('config', 'AW-17790035839');
          `}
        </Script>
      </head>
      <body
        className={`${poppins.variable} ${sairaCondensed.variable} antialiased`}
      >
        {children}
        <Analytics />
        <Footer />
        <CookieConsentWrapper />
      </body>
    </html>
  );
}

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
  keywords: [
    "business broker business",
    "confidential information memorandum",
    "business brokerage",
    "business for sales near me",
    "broker business",
    "small business brokers",
    "what is a cim",
    "what is a business broker",
    "buiness brokers",
    "how to value a small company",
    "sell my business fast",
    "small business broker",
    "best business brokers",
    "business broker houston",
    "business broker sites",
    "business brokerage firm",
    "business brokers chicago area",
    "business brokers for small business",
    "businessbroker.net",
    "seller financing how does it work",
    "seller financing meaning",
    "texas business brokers",
    "what are the best websites where you can buy businesses",
    "asset vs stock purchase",
    "business brokers austin",
    "business brokers houston",
    "business brokers texas",
    "cim investment banking",
    "houston business brokers",
    "kensington company business broker",
    "sale my business online",
    "stock versus asset purchase",
    "what is a confidential information memorandum",
    "best business broker",
    "best company to sell your business",
    "businesses for sale with seller financing",
    "buying internet businesses",
    "how to do seller financing",
    "how to find small businesses for sale",
    "leading business brokers for small business valuation",
    "most recommended business brokers for small business",
    "valuations",
    "sales broker",
    "sell a manufacturing business",
    "sell small business",
    "small business brokerage",
    "where to sell my business",
    "asset deal vs stock deal",
    "best business broker firm for small business valuation",
    "best business broker for small business valuation",
    "best way to find business brokers for selling",
    "business broker services",
    "business brokers houston tx",
    "business selling sites",
    "franchise business brokers",
    "internet business broker",
    "sell my business quickly",
    "selling a business tax",
    "top business brokers",
    "websites for sales",
    "best business broker websites",
    "broker businesses",
    "cim mergers and acquisitions",
    "confidential information memorandum example",
    "list my business for sale",
    "middle market business brokers",
    "post a business for sale",
    "preparing to sell your business austin tx",
    "taxes on selling a business",
    "what is a seller's note",
    "where to sell a business",
    "be a business broker",
    "business broker franchises",
    "business brokers in my area",
    "buy online businesses for sale",
    "cim meaning finance",
    "flippa online business for sale",
    "list your business for sale",
    "selling a company capital gains tax",
    "stock vs asset deal",
    "taxes when selling a business",
    "transworld business advisors houston",
    "trust business brokers",
    "where do i advertise my business for sale",
    "best business for sale sites",
    "broker for business sale",
    "broker for small business",
    "brokers business",
    "buisness brokers",
    "busines brokers",
    "business broker for small business",
    "business broker texas",
    "business brokers fort worth",
    "business brokers in the usa",
    "business broking",
    "business sale owner",
    "business sales broker",
    "business seller financing",
    "cim business meaning",
    "commercial business brokers",
    "company broker"
  ],
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

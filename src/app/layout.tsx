import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ServiceWorkerRegistration } from "@/components/service-worker-reg";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rapigo.ml';

export const metadata: Metadata = {
  title: "Rapigo Mali V3.0 — Rapide, Fiable, Partout au Mali",
  description:
    "Votre plateforme de livraison N°1 au Mali. Restaurants, supermarchés, pharmacies, boutiques - tout livré chez vous en quelques minutes.",
  keywords: [
    "Rapigo",
    "Mali",
    "Bamako",
    "livraison",
    "restaurant",
    "commande",
    "delivery",
    "Uber Eats Mali",
    "Glovo Mali",
    "Rapigo Mali",
    "livraison Bamako",
  ],
  authors: [{ name: "Mr. Diarra Moussa" }],
  creator: "Rapigo Mali",
  publisher: "Rapigo Mali",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rapigo Mali",
    startupImage: "/rapigo-logo.jpg",
  },
  openGraph: {
    title: "Rapigo Mali V3.0 — Rapide, Fiable, Partout au Mali",
    description:
      "Votre plateforme de livraison N°1 au Mali. Restaurants, supermarchés, pharmacies, boutiques - tout livré chez vous en quelques minutes.",
    url: APP_URL,
    siteName: "Rapigo Mali",
    images: [
      {
        url: "/rapigo-logo.jpg",
        width: 591,
        height: 1280,
        alt: "Rapigo Mali",
      },
    ],
    locale: "fr_ML",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rapigo Mali V3.0 — Rapide, Fiable, Partout au Mali",
    description:
      "Votre plateforme de livraison N°1 au Mali. Restaurants, supermarchés, pharmacies, boutiques - tout livré chez vous en quelques minutes.",
    images: ["/rapigo-logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "application-name": "Rapigo Mali",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#064e3b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Rapigo Mali",
              url: APP_URL,
              logo: `${APP_URL}/rapigo-logo.jpg`,
              description:
                "Plateforme de livraison N°1 au Mali. Restaurants, supermarchés, pharmacies, boutiques - tout livré chez vous.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Bamako",
                addressCountry: "ML",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+223 77 16 38 70",
                contactType: "customer service",
                availableLanguage: ["fr"],
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          <PwaInstallPrompt />
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
import "./globals.css";
import { themeConfig } from "@/config/theme";
import FloatingTabBar from "@/components/FloatingTabBar";
import ReactQueryProvider from "@/shared/providers/ReactQueryProvider";
import DisableBrowserAutofill from "@/shared/components/DisableBrowserAutofill";

if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://myownpms.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MYOWNPMS - Next-Gen Cloud Hotel Management & PMS Software",
    template: "%s | MYOWNPMS",
  },
  description:
    "All-in-one Cloud Hotel Management System (PMS), Front Desk Booking Engine, Real-Time Room Inventory, GST Billing, Restaurant POS & Multi-Tenant Hotel Platform.",
  keywords: [
    "hotel management software",
    "cloud pms",
    "hotel booking system",
    "property management system",
    "hotel reception software",
    "hotel billing software",
    "multi-tenant hotel software",
    "india hotel pms",
    "room reservation system",
    "MYOWNPMS",
  ],
  authors: [{ name: "MYOWNPMS Team" }],
  creator: "MYOWNPMS",
  publisher: "MYOWNPMS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MYOWNPMS - Next-Gen Cloud Hotel Management Software",
    description:
      "Automate room bookings, check-ins, guest billing, restaurant orders and hotel operations with ease.",
    url: siteUrl,
    siteName: "MYOWNPMS",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "MYOWNPMS Hotel PMS Software",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MYOWNPMS - Cloud Hotel Management System",
    description:
      "Next-Gen All-in-one Cloud Hotel Management Software & Multi-Tenant PMS Platform.",
    images: ["/logo.png"],
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
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "MYOWNPMS",
      "operatingSystem": "All Web Browsers, Cloud-based",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "128",
      },
      "description":
        "All-in-one multi-tenant cloud hotel management software and PMS for bookings, billing, housekeeping, and front-desk automation.",
    },
    {
      "@type": "Organization",
      "name": "MYOWNPMS",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "availableLanguage": ["English", "Hindi", "Gujarati"],
      },
    },
    {
      "@type": "WebSite",
      "name": "MYOWNPMS",
      "url": siteUrl,
    },
  ],
};

// Runs before first paint on themed (signed-in / login) routes so a saved dark theme never flashes light.
// Public marketing pages keep their own light design and are intentionally excluded.
const themeBootScript = `(function(){try{var p=location.pathname;var themed=/^\/(app|login|admin|receptionist|super-admin)(\/|$)/.test(p);if(!themed)return;if(localStorage.getItem("admin_theme_mode")==="dark"){var d=document.documentElement;d.classList.add("dark-theme");d.setAttribute("data-theme-mode","dark");d.style.colorScheme="dark";var v={"--color-primary":"#0d9488","--color-primary-dark":"#0f766e","--color-primary-light":"#5eead4","--color-primary-glow":"rgba(45,212,191,0.16)","--color-bg-main":"#0a1312","--color-bg-card":"#111e1c","--color-bg-header":"#0e1a18","--color-bg-footer":"#0e1a18","--color-text-main":"#e7f2f0","--color-text-muted":"#9db5b0","--color-border":"rgba(148,210,198,0.14)","--color-border-hover":"#2dd4bf"};for(var k in v)d.style.setProperty(k,v[k]);}}catch(e){}})();`;

export default function RootLayout({ children }) {
  const themeStyles = {
    "--color-primary": themeConfig.primary,
    "--color-primary-dark": themeConfig.primaryDark,
    "--color-primary-light": themeConfig.primaryLight,
    "--color-primary-glow": themeConfig.primaryGlow || "rgba(0, 0, 0, 0.15)",
    "--color-bg-main": themeConfig.bgMain,
    "--color-bg-header": themeConfig.bgHeader || "#ffffff",
    "--color-bg-card": themeConfig.bgCard || "#ffffff",
    "--color-bg-footer": themeConfig.bgFooter || "#ffffff",
    "--color-text-main": themeConfig.textMain,
    "--color-text-muted": themeConfig.textMuted,
    "--color-border": themeConfig.border,
    "--color-border-hover": themeConfig.borderHover || themeConfig.primary,
  };

  return (
    <html
      lang="en"
      style={themeStyles}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen pb-14 md:pb-0 font-sans antialiased" style={{ backgroundColor: themeConfig.bgMain, color: themeConfig.textMain }}>
        <ReactQueryProvider>
          <DisableBrowserAutofill />
          {children}
          <FloatingTabBar />
        </ReactQueryProvider>
      </body>
    </html>
  );
}



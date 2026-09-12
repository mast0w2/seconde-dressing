import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://seconde-dressing.com";

export const siteConfig = {
  name: "Seconde",
  url: SITE_URL,
  locale: "fr_FR",
  title: "Seconde - On vous aide à vendre vos vêtements",
  description:
    "Seconde vient chercher votre dressing, trie, photographie et vend vos vêtements pour vous. Donnez-leur une seconde vie.",
  ogImage: "/dressing-sort-1.jpg",
};

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  absolute = false,
}: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const fullTitle = absolute ? title : `${title} | ${siteConfig.name}`;

  return {
    // The layout's title.template appends " | Seconde" to plain-string titles.
    // Use an absolute title to bypass the template (e.g. for the homepage).
    title: absolute ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: "Seconde - conciergerie de seconde main",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Seconde",
    serviceType: "Conciergerie de seconde main",
    description: siteConfig.description,
    url: SITE_URL,
    areaServed: "FR",
    inLanguage: "fr-FR",
    offers: {
      "@type": "Offer",
      description: "Récupération, photographie et vente de vêtements de seconde main",
    },
    provider: {
      "@type": "Organization",
      name: "Seconde",
      url: SITE_URL,
    },
  };
}

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

export function noIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}

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
    provider: buildOrganizationLd(),
  };
}

export function buildOrganizationLd() {
  return {
    "@type": "Organization",
    name: "Seconde",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: siteConfig.description,
    areaServed: "FR",
  };
}

export function buildWebsiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Seconde",
    url: SITE_URL,
    inLanguage: "fr-FR",
    publisher: buildOrganizationLd(),
  };
}

export function buildBreadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export type ReviewData = {
  author: string;
  rating: number;
  body: string;
};

export function buildReviewsLd(reviews: ReviewData[]) {
  const reviewCount = reviews.length;
 const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const ratingValue = reviewCount > 0 ? ratingSum / reviewCount : 0;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Seconde",
    url: `${SITE_URL}/reviews`,
    provider: buildOrganizationLd(),
    aggregateRating:
      reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.round(ratingValue * 10) / 10,
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: reviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author },
      reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
      reviewBody: review.body,
    })),
  };
}

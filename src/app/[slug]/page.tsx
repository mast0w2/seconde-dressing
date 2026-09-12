import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cities, getCity, getCityLabel } from "@/lib/cities";
import { siteConfig, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import CityPageContent from "./CityPageContent";

export function generateStaticParams() {
  return cities.map((city) => ({ slug: city.slug }));
}

type Params = { params: { slug: string } };

export function generateMetadata({ params }: Params): Metadata {
  const city = getCity(params.slug);
  if (!city) return {};

  const url = `${siteConfig.url}/${city.slug}`;
  return {
    title: city.title,
    description: city.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: city.title,
      description: city.metaDescription,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: city.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: city.title,
      description: city.metaDescription,
      images: [siteConfig.ogImage],
    },
  };
}

function buildCityJsonLd(slug: string) {
  const city = getCity(slug);
  if (!city) return {};
  const url = `${siteConfig.url}/${city.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Seconde — Conciergerie de seconde main à ${getCityLabel(slug)}`,
    description: city.jsonLdDescription,
    url,
    areaServed: {
      "@type": "City",
      name: getCityLabel(slug),
    },
    provider: {
      "@type": "LocalBusiness",
      name: "Seconde",
      url: siteConfig.url,
      areaServed: "Paris et petite couronne (92, 93, 94)",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Devis gratuit, réponse sous 24 heures",
    },
  };
}

export default function Page({ params }: Params) {
  const city = getCity(params.slug);
  if (!city) notFound();

  return (
    <>
      <CityPageContent city={city} />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: getCityLabel(params.slug), path: `/${city.slug}` },
        ])}
      />
      <JsonLd data={buildCityJsonLd(params.slug)} />
    </>
  );
}

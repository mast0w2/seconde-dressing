import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { cities } from "@/lib/cities";

const ROUTES = [
  "/",
  "/concept",
  "/about",
  "/impact",
  "/contact",
  "/vendeur",
  "/demande-rdv",
  "/reviews",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ROUTES.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const cityRoutes = cities.map((city) => ({
    url: `${siteConfig.url}/${city.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...cityRoutes];
}

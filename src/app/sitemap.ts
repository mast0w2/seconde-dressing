import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

const ROUTES = [
  "/",
  "/concept",
  "/impact",
  "/contact",
  "/vendeur",
  "/reviews",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

// Public, indexable pages only. Each one must exist under src/app: a URL
// listed here that answers 404 is reported as an error by search consoles.
const ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/concept", priority: 0.8, changeFrequency: "monthly" },
  { path: "/impact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/reviews", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal-notice", priority: 0.1, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

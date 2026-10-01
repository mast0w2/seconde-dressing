import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or one-off pages: they also carry a noindex tag.
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/profile",
          "/appointment-request",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

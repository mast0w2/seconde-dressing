import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

// Lets Android and desktop browsers use the right icon and colours when the
// site is pinned to a home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "browser",
    background_color: "#f4f1ea",
    theme_color: "#f4f1ea",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import HomePage from "./HomePage";

export const metadata: Metadata = buildPageMetadata({
  title: "Seconde - On vous aide à vendre vos vêtements",
  description:
    "Seconde vient chercher votre dressing, trie, photographie et vend vos vêtements pour vous. Donnez-leur une seconde vie.",
  path: "/",
  absolute: true,
});

export default function Page() {
  return <HomePage />;
}

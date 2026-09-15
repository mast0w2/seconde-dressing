import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import HomePage from "./HomePage";

export const metadata: Metadata = buildPageMetadata({
  title: "Seconde - Videz votre dressing, on s'occupe de tout",
  description:
    "Conciergerie de seconde main à Paris. On vient chez vous, on trie, on photographie et on vend vos vêtements. Vous touchez 50 % de chaque vente.",
  path: "/",
  absolute: true,
});

export default function Page() {
  return <HomePage />;
}

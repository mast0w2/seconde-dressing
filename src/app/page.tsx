import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import HomePage from "./HomePage";

export const metadata: Metadata = buildPageMetadata({
  title: "Seconde - Videz votre dressing, on s'occupe de tout",
  description:
    "On récupère, on trie, on photographie et on vend vos vêtements pour vous. Donnez-leur une seconde vie.",
  path: "/",
  absolute: true,
});

export default function Page() {
  return <HomePage />;
}

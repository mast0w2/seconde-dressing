import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import ConceptPage from "./ConceptPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Notre Concept - conciergerie de seconde main",
  description:
    "Découvrez le concept Seconde : on récupère votre dressing, on trie, on photographie et on vend vos vêtements sur nos plateformes partenaires. Vous touchez 50% de chaque vente.",
  path: "/concept",
});

export default function Page() {
  return <ConceptPage />;
}

import type { Metadata } from "next";
import { buildPageMetadata, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import ConceptPage from "./ConceptPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Notre Concept - conciergerie de seconde main",
  description:
    "Découvrez le concept Seconde : on récupère votre dressing, on trie, on photographie et on vend vos vêtements sur nos plateformes partenaires. Vous touchez 50% de chaque vente.",
  path: "/concept",
});

export default function Page() {
  return (
    <>
      <ConceptPage />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Notre Concept", path: "/concept" },
        ])}
      />
    </>
  );
}

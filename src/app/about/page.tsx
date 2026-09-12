import type { Metadata } from "next";
import { buildPageMetadata, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import AboutPage from "./AboutPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Découvrez Seconde - revente de vêtements simplifiée",
  description:
    "La plateforme innovante qui révolutionne la revente de vêtements. Seconde s'occupe de tout : récupération, photographie, mise en vente et expédition.",
  path: "/about",
});

export default function Page() {
  return (
    <>
      <AboutPage />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "À propos", path: "/about" },
        ])}
      />
    </>
  );
}

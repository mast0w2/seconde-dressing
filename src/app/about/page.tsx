import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import AboutPage from "./AboutPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Découvrez Seconde - revente de vêtements simplifiée",
  description:
    "La plateforme innovante qui révolutionne la revente de vêtements. Seconde s'occupe de tout : récupération, photographie, mise en vente et expédition.",
  path: "/about",
});

export default function Page() {
  return <AboutPage />;
}

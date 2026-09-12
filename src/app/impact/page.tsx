import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import ImpactPage from "./ImpactPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Économie circulaire - l'impact de la seconde main",
  description:
    "Donner une seconde vie à vos vêtements réduit la production textile, les déchets et l'empreinte carbone. Découvrez l'impact écologique de la mode circulaire avec Seconde.",
  path: "/impact",
});

export default function Page() {
  return <ImpactPage />;
}

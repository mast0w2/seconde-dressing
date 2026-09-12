import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import DemandeRdvPage from "./DemandeRdvPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Demande de rendez-vous",
  description:
    "Demandez un rendez-vous gratuit : on vient chercher votre dressing, on trie, on photographie et on vend vos vêtements pour vous. Réponse sous 24h.",
  path: "/demande-rdv",
});

export default function Page() {
  return <DemandeRdvPage />;
}

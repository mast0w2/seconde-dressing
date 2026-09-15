import type { Metadata } from "next";
import LaisserAvisPage from "./LaisserAvisPage";

// Page atteinte par lien privé envoyé aux clientes : pas d'indexation.
export const metadata: Metadata = {
  title: "Laisser un avis",
  description: "Donnez votre avis sur le service Seconde après la vente de vos pièces.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LaisserAvisPage />;
}

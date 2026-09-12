import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import VendeurPage from "./VendeurPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Espace Vendeur",
  description:
    "Espace vendeur Seconde : gérez vos demandes, votre inventaire et vos ventes de vêtements de seconde main.",
  path: "/vendeur",
});

export default function Page() {
  return <VendeurPage />;
}

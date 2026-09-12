import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import SellerDashboardPage from "./SellerDashboardPage";

export const metadata: Metadata = noIndexMetadata("Tableau de bord vendeur");

export default function Page() {
  return <SellerDashboardPage />;
}

import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import ClientDashboardPage from "./ClientDashboardPage";

export const metadata: Metadata = noIndexMetadata("Tableau de bord client");

export default function Page() {
  return <ClientDashboardPage />;
}

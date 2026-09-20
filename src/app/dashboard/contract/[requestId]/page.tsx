import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import ContractPage from "./ContractPage";

export const metadata: Metadata = noIndexMetadata("Contrat de dépôt-vente");

export default function Page({ params }: { params: { requestId: string } }) {
  return <ContractPage requestId={params.requestId} />;
}

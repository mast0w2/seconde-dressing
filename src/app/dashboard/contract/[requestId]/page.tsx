import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import ContractPage from "./ContractPage";

export const metadata: Metadata = noIndexMetadata("Contrat de dépôt-vente");

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return <ContractPage requestId={requestId} />;
}

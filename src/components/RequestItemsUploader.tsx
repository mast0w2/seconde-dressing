"use client";

// Point d'entrée de l'inventaire d'une demande.
//
// Le composant garde son nom et sa signature pour ne rien casser dans les
// deux tableaux de bord, mais il ne fait plus que choisir la bonne vue :
//   * la vendeuse travaille dans un tableau dense, triable et filtrable ;
//   * la cliente lit un tableau qui ne montre que ce qui la concerne.
//
// Les règles (prix verrouillés, finalisation irréversible, qui écrit quoi)
// sont appliquées en base par le trigger request_items_pricing_guard
// (migrations 0007 et 0024). Les deux vues se contentent de ne pas proposer
// ce qui sera refusé.

import { InventaireCliente } from "@/components/inventaire/InventaireCliente";
import { InventaireVendeuse } from "@/components/inventaire/InventaireVendeuse";

export { minPriceEditorFor } from "@/lib/formules";

interface RequestItemsUploaderProps {
  requestId: string;
  role: "client" | "seller";
  /** Slug de la formule : détermine qui saisit le prix minimal. */
  formulaSlug?: string | null;
  /** Appelé après chaque changement persistant (le tableau de bord recompte). */
  onItemsChange?: () => void;
}

export function RequestItemsUploader({
  requestId,
  role,
  formulaSlug,
  onItemsChange,
}: RequestItemsUploaderProps) {
  if (role === "client") {
    return (
      <InventaireCliente
        requestId={requestId}
        formulaSlug={formulaSlug}
        onItemsChange={onItemsChange}
      />
    );
  }
  return (
    <InventaireVendeuse
      requestId={requestId}
      formulaSlug={formulaSlug}
      onItemsChange={onItemsChange}
    />
  );
}

export default RequestItemsUploader;

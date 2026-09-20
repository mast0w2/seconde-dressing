"use client";

// Panneau « Contrat de dépôt-vente » affiché dans le détail d'une demande
// acceptée (tableaux de bord cliente et vendeuse). Il rend le parcours
// explicite en trois étapes :
//   1. la vendeuse prépare le contrat au moment de la remise des pièces ;
//   2. la vendeuse ET la cliente le signent ;
//   3. la vendeuse confirme la récupération des articles — impossible avant
//      les deux signatures (trigger requests_require_signed_contract).
// Le contrat lui-même est chargé par le tableau de bord (embarqué dans la
// requête) : ce composant est purement présentationnel + actions.

import { useState } from "react";
import Link from "next/link";
import { Check, FileSignature, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ContractSetupDialog } from "@/components/ContractSetupDialog";
import { isFullySigned, isSignedBy, type ContractRole } from "@/lib/contract";
import { generateContract, type ContractSetup } from "@/lib/contract-api";
import type { RequestContract, RequestStatus } from "@/types/database";

interface ContractStatusProps {
  requestId: string;
  status: RequestStatus;
  role: ContractRole;
  contract: RequestContract | null;
  /** Nombre estimé lors de la demande, proposé par défaut à la génération. */
  defaultItemsCount?: number | null;
  /** Appelé après une génération réussie (le tableau de bord recharge). */
  onGenerated?: (contract: RequestContract) => void;
  /** Vendeuse : confirme la récupération des articles (statut items_collected). */
  onConfirmCollected?: () => Promise<void>;
}

const COLLECTED_STATUSES: RequestStatus[] = ["items_collected", "items_on_sale", "completed"];

export function ContractStatus({
  requestId,
  status,
  role,
  contract,
  defaultItemsCount,
  onGenerated,
  onConfirmCollected,
}: ContractStatusProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (status !== "accepted" && !COLLECTED_STATUSES.includes(status)) return null;

  const collected = COLLECTED_STATUSES.includes(status);
  const sellerSigned = !!contract && isSignedBy(contract, "seller");
  const clientSigned = !!contract && isSignedBy(contract, "client");
  const fullySigned = !!contract && isFullySigned(contract);
  const signedByMe = !!contract && isSignedBy(contract, role);
  const href = `/dashboard/contract/${requestId}`;

  const handleGenerate = async (setup: ContractSetup) => {
    setGenerating(true);
    try {
      const { contract: created } = await generateContract(requestId, setup);
      setDialogOpen(false);
      onGenerated?.(created);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!onConfirmCollected) return;
    setConfirming(true);
    try {
      await onConfirmCollected();
    } finally {
      setConfirming(false);
    }
  };

  // Message principal + action, selon le rôle et l'avancement.
  let message: string;
  let action: React.ReactNode = null;

  if (!contract) {
    if (role === "seller") {
      message =
        "Au moment de la remise des pièces, préparez le contrat de dépôt-vente : il doit être signé par la cliente et par vous avant de confirmer la récupération des articles.";
      action = (
        <Button onClick={() => setDialogOpen(true)}>
          <FileSignature className="h-4 w-4 mr-2" />
          Préparer le contrat
        </Button>
      );
    } else {
      message =
        "Lors du rendez-vous, la vendeuse prépare un contrat de dépôt-vente. Vous le signerez ici, depuis votre espace, avant qu'elle emporte vos pièces.";
    }
  } else if (!signedByMe) {
    message =
      role === "seller"
        ? "Le contrat est prêt : signez-le, puis faites-le signer à la cliente depuis son espace."
        : "La vendeuse a préparé le contrat de dépôt-vente. Lisez-le et signez-le pour confirmer la remise de vos pièces.";
    action = (
      <Button asChild>
        <Link href={href}>
          <PenLine className="h-4 w-4 mr-2" />
          Lire et signer le contrat
        </Link>
      </Button>
    );
  } else if (!fullySigned) {
    message =
      role === "seller"
        ? "Vous avez signé. Il manque la signature de la cliente : elle peut le faire depuis son espace Seconde (rubrique « Mes demandes »)."
        : "Vous avez signé. Il manque la signature de la vendeuse.";
    action = (
      <Button asChild variant="outline">
        <Link href={href}>Voir le contrat</Link>
      </Button>
    );
  } else if (!collected) {
    message =
      role === "seller"
        ? "Contrat signé par les deux parties. Vous pouvez confirmer la récupération des articles."
        : "Contrat signé par les deux parties. La vendeuse va confirmer la récupération de vos articles.";
    action = (
      <div className="flex flex-wrap gap-2">
        {role === "seller" && onConfirmCollected && (
          <Button onClick={handleConfirm} disabled={confirming}>
            <Check className="h-4 w-4 mr-2" />
            {confirming ? "Confirmation…" : "Confirmer la récupération des articles"}
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={href}>Voir le contrat</Link>
        </Button>
      </div>
    );
  } else {
    message = "Contrat signé par les deux parties. Les articles ont été récupérés.";
    action = (
      <Button asChild variant="outline">
        <Link href={href}>Voir le contrat</Link>
      </Button>
    );
  }

  const highlight = (role === "seller" && !contract) || (!!contract && !signedByMe);

  return (
    <div
      className={`mt-4 border p-4 sm:p-5 space-y-4 ${
        highlight ? "border-sauge-fonce bg-sauge-clair/30" : "border-noir/10 bg-gris-tres-clair"
      }`}
    >
      <div className="eyebrow">Contrat de dépôt-vente</div>

      <ol className="grid grid-cols-3 gap-2">
        <Step index={1} label="Contrat préparé" done={!!contract} />
        <Step
          index={2}
          label="Signatures"
          done={fullySigned}
          detail={
            contract ? (
              <>
                <SignerMark label="Vendeuse" done={sellerSigned} />
                <SignerMark label="Cliente" done={clientSigned} />
              </>
            ) : undefined
          }
        />
        <Step index={3} label="Articles récupérés" done={collected} />
      </ol>

      <p className="text-sm text-noir">{message}</p>
      {action}

      {role === "seller" && (
        <ContractSetupDialog
          open={dialogOpen}
          defaultCount={defaultItemsCount}
          submitting={generating}
          onCancel={() => setDialogOpen(false)}
          onConfirm={handleGenerate}
        />
      )}
    </div>
  );
}

function Step({
  index,
  label,
  done,
  detail,
}: {
  index: number;
  label: string;
  done: boolean;
  detail?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
            done ? "bg-sauge-fonce text-blanc" : "border border-noir/30 text-gris-moyen"
          }`}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : index}
        </span>
        <span className={`text-xs sm:text-sm ${done ? "text-noir" : "text-gris-moyen"}`}>{label}</span>
      </div>
      {detail && <div className="ml-8 flex flex-col gap-0.5 text-xs">{detail}</div>}
    </li>
  );
}

function SignerMark({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={done ? "text-sauge-fonce" : "text-gris-moyen"}>
      {done ? "✓" : "○"} {label}
    </span>
  );
}

export default ContractStatus;

"use client";

// Paramètres demandés à la vendeuse avant de générer le contrat de
// dépôt-vente : le nombre de pièces réellement confiées (constaté à la
// remise) et le choix de la cliente pour les invendus (don ou restitution).
// Ces deux informations sont figées dans le contrat.

import { useEffect, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UnsoldItemsChoice } from "@/types/database";
import type { ContractSetup } from "@/lib/contract-api";

interface ContractSetupDialogProps {
  open: boolean;
  /** Nombre estimé lors de la demande, proposé par défaut. */
  defaultCount?: number | null;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (setup: ContractSetup) => void;
}

export const UNSOLD_CHOICE_LABEL: Record<UnsoldItemsChoice, string> = {
  return: "Les récupérer",
  donate: "En faire don",
};

export function ContractSetupDialog({
  open,
  defaultCount,
  submitting = false,
  onCancel,
  onConfirm,
}: ContractSetupDialogProps) {
  const [count, setCount] = useState<string>("");
  const [unsold, setUnsold] = useState<UnsoldItemsChoice | "">("");

  // Repart des valeurs par défaut à chaque ouverture.
  useEffect(() => {
    if (open) {
      setCount(defaultCount != null ? String(defaultCount) : "");
      setUnsold("");
    }
  }, [open, defaultCount]);

  const parsedCount = Number.parseInt(count, 10);
  const countValid = Number.isInteger(parsedCount) && parsedCount >= 1;
  const canConfirm = countValid && unsold !== "" && !submitting;

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && !submitting && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-noir/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-blanc border border-noir/10 p-6 sm:p-8 space-y-6 focus:outline-none">
          <div className="space-y-2">
            <div className="eyebrow">Contrat de dépôt-vente</div>
            <AlertDialog.Title className="text-2xl font-serif">
              Préparer le contrat
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gris-moyen">
              À remplir au moment de la remise des pièces. Ces deux informations sont inscrites
              dans le contrat que la cliente et vous signez ensuite, avant de confirmer la
              récupération des articles.
            </AlertDialog.Description>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-items-count">Nombre de pièces confiées</Label>
            <Input
              id="contract-items-count"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-gris-moyen">
              Le nombre réellement compté au moment de la remise.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Pièces invendues : que souhaite la cliente ?</Label>
            <RadioGroup
              value={unsold}
              onValueChange={(v) => setUnsold(v as UnsoldItemsChoice)}
              disabled={submitting}
              className="gap-3"
            >
              {(Object.keys(UNSOLD_CHOICE_LABEL) as UnsoldItemsChoice[]).map((choice) => (
                <label
                  key={choice}
                  className={`flex items-start gap-3 border p-3 cursor-pointer transition-colors ${
                    unsold === choice
                      ? "border-noir bg-sauge-clair/30"
                      : "border-noir/20 hover:border-noir/50"
                  }`}
                >
                  <RadioGroupItem value={choice} className="mt-0.5" />
                  <span className="text-sm">
                    <span className="block text-noir">{UNSOLD_CHOICE_LABEL[choice]}</span>
                    <span className="block text-gris-moyen">
                      {choice === "return"
                        ? "Les pièces non vendues lui sont restituées."
                        : "Les pièces non vendues partent vers les filières de réemploi."}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={submitting}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              onClick={() =>
                canConfirm && onConfirm({ items_count: parsedCount, unsold_items: unsold as UnsoldItemsChoice })
              }
              disabled={!canConfirm}
            >
              {submitting ? "Génération…" : "Générer le contrat"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default ContractSetupDialog;

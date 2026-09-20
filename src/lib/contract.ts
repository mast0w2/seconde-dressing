// src/lib/contract.ts
// Contrat de dépôt-vente entre la cliente (déposante) et la vendeuse.
//
// Le contrat est généré quand la vendeuse passe la demande en
// « Articles récupérés » : on fige à ce moment-là un instantané des deux
// parties, de la formule, des pièces et de la répartition (src/lib/pricing.ts).
// Les clauses sont dérivées de cet instantané, jamais des données vivantes,
// pour qu'un contrat signé ne change plus.

import { REVENUE_SPLIT, sharePercent } from "@/lib/pricing";
import type {
  ContractContent,
  ContractParty,
  Formula,
  Profile,
  Request,
  RequestContract,
  UnsoldItemsChoice,
} from "@/types/database";

/** À incrémenter à chaque changement de wording des clauses. */
export const CONTRACT_VERSION = "2026-09-v4";

/** Rôle d'un utilisateur vis-à-vis d'un contrat. */
export type ContractRole = "client" | "seller";

export interface ContractArticle {
  title: string;
  paragraphs: string[];
}

function partyFromProfile(profile: Profile | null, fallback: Partial<ContractParty>): ContractParty {
  return {
    first_name: (profile?.first_name ?? fallback.first_name ?? "").trim(),
    last_name: (profile?.last_name ?? fallback.last_name ?? "").trim(),
    email: profile?.email ?? fallback.email ?? null,
    phone: profile?.phone ?? fallback.phone ?? null,
    address: fallback.address ?? profile?.street_address ?? null,
  };
}

/** Référence lisible affichée sur le contrat : SD-XXXXXXXX. */
export function contractReference(requestId: string): string {
  return `SD-${requestId.slice(0, 8).toUpperCase()}`;
}

/**
 * Construit l'instantané du contrat à partir de la demande, des profils et
 * des paramètres saisis par la vendeuse à la remise (nombre de pièces
 * constaté, choix de la cliente pour les invendus).
 * La cliente peut être anonyme (demande faite avant création de compte) :
 * on retombe alors sur les coordonnées saisies dans la demande.
 */
export function buildContractContent(params: {
  request: Request;
  client: Profile | null;
  seller: Profile;
  formula: Formula | null;
  itemsCount: number;
  unsoldItems: UnsoldItemsChoice;
  now?: Date;
}): ContractContent {
  const { request, client, seller, formula, itemsCount, unsoldItems, now = new Date() } = params;

  return {
    reference: contractReference(request.id),
    generated_at: now.toISOString(),
    client: partyFromProfile(client, {
      first_name: request.client_first_name ?? undefined,
      last_name: request.client_last_name ?? undefined,
      email: request.client_email,
      phone: request.client_phone,
      // L'adresse de collecte prime sur celle du profil.
      address: request.address ?? client?.street_address ?? null,
    }),
    seller: partyFromProfile(seller, {}),
    formula: formula ? { label: formula.label, price: Number(formula.price) } : null,
    items: { count: itemsCount },
    unsold_items: unsoldItems,
    split: {
      cliente: sharePercent(REVENUE_SPLIT.cliente),
      vendeuse: sharePercent(REVENUE_SPLIT.vendeuse),
      plateforme: sharePercent(REVENUE_SPLIT.plateforme),
    },
  };
}

export function partyFullName(party: ContractParty): string {
  return `${party.first_name} ${party.last_name}`.trim();
}

export function formatContractDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatContractDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEuros(value: number): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

/** Les clauses du contrat, dérivées uniquement de l'instantané. */
export function contractArticles(content: ContractContent): ContractArticle[] {
  const cliente = partyFullName(content.client);
  const vendeuse = partyFullName(content.seller);
  const count = content.items.count;
  const piecesLabel = `${count} pièce${count > 1 ? "s" : ""}`;

  return [
    {
      title: "Article 1 — Objet",
      paragraphs: [
        `${cliente} (ci-après « la Déposante ») confie à ${vendeuse} (ci-après « la Vendeuse »), intervenant pour la plateforme Seconde, ${piecesLabel} en vue de leur mise en vente sur les plateformes partenaires de Seconde.`,
        "La Déposante déclare être propriétaire des pièces confiées et garantit qu'elles correspondent aux critères de reprise acceptés lors de la demande (état, propreté, authenticité).",
      ],
    },
    {
      title: "Article 2 — Pièces confiées",
      paragraphs: [
        `La remise des pièces a lieu le ${formatContractDate(content.generated_at)}${
          content.client.address ? ` à l'adresse suivante : ${content.client.address}` : ""
        }. Le nombre de pièces confiées, compté contradictoirement au moment de la remise, est de ${piecesLabel}.`,
        "L'inventaire détaillé des pièces (photo et description de chaque pièce) est tenu dans l'espace Seconde de la demande, accessible aux deux parties. Il peut être établi ou complété après la signature du présent contrat et ne s'y substitue pas.",
        "Les deux parties reconnaissent que les pièces ont été remises en mains propres à la signature du présent contrat.",
      ],
    },
    {
      title: "Article 3 — Formule et frais de rendez-vous",
      paragraphs: [
        content.formula
          ? `La Déposante a choisi la formule « ${content.formula.label} », facturée ${formatEuros(
              content.formula.price
            )}. Ce montant constitue le seul frais dû à Seconde ; aucun autre frais n'est facturé à la Déposante.`
          : "Aucune formule payante n'a été retenue pour ce rendez-vous.",
      ],
    },
    {
      title: "Article 4 — Répartition du prix de vente",
      paragraphs: [
        `Pour chaque pièce vendue, le prix de vente est réparti comme suit : ${content.split.cliente} % pour la Déposante, ${content.split.vendeuse} % pour la Vendeuse et ${content.split.plateforme} % pour la plateforme Seconde.`,
        "La Vendeuse fixe le prix de mise en vente d'après sa connaissance du marché de la seconde main et peut l'ajuster pour favoriser la vente.",
        "La part de la Déposante lui est reversée après encaissement effectif de chaque vente.",
      ],
    },
    {
      title: "Article 5 — Obligations de la Vendeuse",
      paragraphs: [
        "La Vendeuse s'engage à conserver les pièces avec soin, à les photographier, les décrire et les mettre en vente dans les meilleurs délais, puis à gérer les échanges avec les acheteurs et l'expédition.",
        "La Vendeuse s'engage à une transparence totale sur les ventes : pour chaque pièce vendue, elle communique à la Déposante le prix de vente effectivement encaissé et le montant qui lui revient, et met à sa disposition les preuves de vente (justificatifs ou captures de la plateforme de vente) en les téléchargeant dans l'espace Seconde de la demande. La Déposante peut demander à tout moment un état des ventes.",
        "La Vendeuse tient la Déposante informée de l'avancement des ventes via son espace Seconde.",
      ],
    },
    {
      title: "Article 6 — Pièces invendues",
      paragraphs: [
        content.unsold_items === "return"
          ? "À l'issue de la période de mise en vente, la Déposante a choisi de récupérer les pièces non vendues : la Vendeuse les lui restitue en mains propres ou par envoi, à une date et un lieu convenus ensemble."
          : "À l'issue de la période de mise en vente, la Déposante a choisi de faire don des pièces non vendues : elles sont orientées vers les filières de réemploi partenaires de Seconde et ne lui sont pas restituées.",
      ],
    },
    {
      title: "Article 7 — Signature",
      paragraphs: [
        "Le présent contrat est signé électroniquement par chaque partie depuis son espace Seconde. La signature vaut acceptation de l'ensemble des clauses ci-dessus et confirmation de la remise des pièces.",
      ],
    },
  ];
}

/** Rôle de `userId` sur ce contrat, ou null s'il n'y est pour rien. */
export function contractRoleFor(contract: RequestContract, userId: string): ContractRole | null {
  if (contract.seller_id === userId) return "seller";
  if (contract.client_id === userId) return "client";
  return null;
}

export function isSignedBy(contract: RequestContract, role: ContractRole): boolean {
  return role === "client" ? !!contract.client_signed_at : !!contract.seller_signed_at;
}

export function isFullySigned(contract: RequestContract): boolean {
  return !!contract.client_signed_at && !!contract.seller_signed_at;
}

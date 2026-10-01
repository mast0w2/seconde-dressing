import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { legalEntity } from "@/lib/legal";
import { PART_CLIENTE, PART_VENDEUSE, PART_PLATEFORME, formatShare } from "@/lib/pricing";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions générales d'utilisation et de vente",
  description:
    "Les conditions du service Seconde : demande de rendez-vous, formules, dépôt-vente de vos vêtements, versement de votre part et pièces invendues.",
  path: "/terms",
});

const LINK = "text-sauge-fonce underline underline-offset-4 hover:text-noir";

// Same figures as the deposit contract (src/lib/contract.ts) and the
// /concept page: pricing.ts is the single source for the split.
const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "Objet",
    content: (
      <>
        <p>
          Les présentes conditions encadrent l&apos;utilisation du site seconde-dressing.com et
          du service {legalEntity.brand}, édité par {legalEntity.ownerName} (voir les{" "}
          <Link className={LINK} href="/legal-notice">
            mentions légales
          </Link>
          ).
        </p>
        <p>
          Toute demande de rendez-vous ou création d&apos;espace vaut acceptation de ces
          conditions. Le contrat de dépôt-vente signé lors de la remise de vos pièces les
          complète ; en cas de différence, le contrat signé prévaut.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "Le service",
    content: (
      <>
        <p>
          {legalEntity.brand} met en relation des particulières qui souhaitent vendre leurs
          vêtements (« la Déposante ») avec des vendeuses indépendantes (« la Vendeuse »). La
          Vendeuse récupère les pièces, les trie, les photographie, les décrit, les met en vente
          sur des plateformes de revente partenaires, gère les échanges avec les acheteurs et
          l&apos;expédition.
        </p>
        <p>
          {legalEntity.brand} agit comme intermédiaire : la vente des pièces est réalisée par la
          Vendeuse, professionnelle indépendante, sur des plateformes de revente tierces.{" "}
          {legalEntity.brand} n&apos;achète pas vos pièces et n&apos;en devient jamais
          propriétaire. {legalEntity.brand} encaisse le prix des formules, perçoit une commission
          sur chaque vente (voir « Dépôt-vente et répartition du prix ») et vous verse votre part.
        </p>
        <p>
          Le service est proposé à Paris et en proche banlieue (départements 75, 92, 93 et 94).
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Espace personnel",
    content: (
      <>
        <p>
          Un espace personnel permet de suivre votre demande, l&apos;inventaire de vos pièces et
          vos ventes. Vous vous y connectez par un lien envoyé par email ou par mot de passe.
          Vous vous engagez à fournir des informations exactes et à garder l&apos;accès à votre
          boîte mail pour vous-même.
        </p>
        <p>
          Vous pouvez demander la suppression de votre espace à tout moment, sous réserve des
          données que la loi nous oblige à conserver (voir la{" "}
          <Link className={LINK} href="/privacy">
            politique de confidentialité
          </Link>
          ).
        </p>
      </>
    ),
  },
  {
    id: "criteria",
    title: "Demande de rendez-vous et pièces acceptées",
    content: (
      <>
        <p>Nous reprenons les pièces femme, homme et enfant, toutes tailles, qui sont :</p>
        <ul>
          <li>en bon état : ni trouées, ni tachées, ni boulochées, ni déformées ;</li>
          <li>d&apos;une valeur d&apos;au moins 15 € en seconde main ;</li>
          <li>hors ultra fast fashion, qui ne trouve pas preneur.</li>
        </ul>
        <p>
          Nous vous recontactons sous 24 heures après votre demande pour confirmer la formule.
          Si vos pièces ne correspondent pas à ces critères, nous vous le disons avant tout
          déplacement et rien ne vous est facturé. La Vendeuse peut refuser, sur place, une pièce
          qui ne répond pas aux critères.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Formules et prix",
    content: (
      <>
        <ul>
          <li>
            <strong>Dressing déjà trié</strong> : 10 €, gratuit pour votre première commande.
          </li>
          <li>
            <strong>Tri sur place</strong> (30 min à 1 h) : 30 €.
          </li>
          <li>
            <strong>Tri &amp; conseil</strong> (1 h à 1 h 30) : 50 €.
          </li>
        </ul>
        <p>
          Les prix sont indiqués toutes taxes comprises ({legalEntity.vatMention}). Le prix de la
          formule est le seul frais à votre charge : aucune commission ne vous est facturée en
          plus de la répartition du prix de vente ci-dessous.
        </p>
      </>
    ),
  },
  {
    id: "deposit",
    title: "Dépôt-vente et répartition du prix",
    content: (
      <>
        <p>
          Lors de la remise des pièces, la Déposante et la Vendeuse signent électroniquement un
          contrat de dépôt-vente depuis leur espace. La Déposante reste propriétaire des pièces
          jusqu&apos;à leur vente et garantit qu&apos;elle en est propriétaire et qu&apos;elles
          sont authentiques.
        </p>
        <p>
          Pour chaque pièce vendue, le prix de vente est réparti ainsi :{" "}
          {formatShare(PART_CLIENTE)} pour la Déposante, {formatShare(PART_VENDEUSE)} pour la
          Vendeuse et {formatShare(PART_PLATEFORME)} pour {legalEntity.brand}.
        </p>
        <p>
          La Vendeuse fixe le prix de mise en vente d&apos;après sa connaissance du marché et peut
          l&apos;ajuster pour favoriser la vente. Elle communique, pour chaque vente, le prix
          effectivement encaissé et le justificatif correspondant, visibles dans votre espace.
        </p>
        <p>
          Votre part vous est versée par {legalEntity.brand}, par virement, après
          l&apos;encaissement effectif de la vente, au plus tard 60 jours après celle-ci.
        </p>
      </>
    ),
  },
  {
    id: "unsold",
    title: "Pièces invendues",
    content: (
      <p>
        À l&apos;issue de la période de mise en vente, les pièces non vendues vous sont rendues
        ou, si vous l&apos;avez choisi dans le contrat, données à des filières de réemploi
        partenaires.
      </p>
    ),
  },
  {
    id: "withdrawal",
    title: "Annulation et droit de rétractation",
    content: (
      <>
        <p>
          Vous pouvez annuler ou décaler votre rendez-vous gratuitement en nous prévenant avant
          celui-ci, par email ou depuis votre espace.
        </p>
        <p>
          Conformément au Code de la consommation, vous disposez de 14 jours pour vous rétracter,
          sans justification, à compter de la conclusion du contrat. Si vous demandez que le
          rendez-vous ait lieu avant la fin de ce délai et que la prestation est entièrement
          exécutée, vous ne pouvez plus vous rétracter de la formule. Vous restez libre de vous
          rétracter du dépôt-vente : les pièces non encore vendues vous sont alors restituées.
        </p>
        <p>
          Pour exercer ce droit, écrivez à{" "}
          <a className={LINK} href={`mailto:${legalEntity.email}`}>
            {legalEntity.email}
          </a>{" "}
          en indiquant clairement votre décision.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Responsabilités",
    content: (
      <>
        <p>
          La Vendeuse conserve vos pièces avec soin pendant toute la durée du dépôt. Toute perte
          ou détérioration vous est signalée sans délai, et les parties conviennent ensemble de
          la suite à lui donner.
        </p>
        <p>
          {legalEntity.brand} ne garantit ni la vente de toutes les pièces, ni un prix de vente :
          les estimations affichées sur le site sont indicatives. Les plateformes de revente
          partenaires restent seules responsables de leur propre fonctionnement.
        </p>
      </>
    ),
  },
  {
    id: "reviews",
    title: "Avis clientes",
    content: (
      <p>
        Les avis publiés sur le site sont vérifiés : ils proviennent uniquement de clientes dont
        nous avons réellement vendu des pièces, et ne sont publiés qu&apos;avec leur accord
        écrit, sans contrepartie et sans retouche. Ils sont affichés du plus récent au plus
        ancien. Aucun avis n&apos;est écarté parce qu&apos;il est négatif ; seuls les avis
        illicites ou manifestement faux peuvent l&apos;être, et leur autrice en est informée.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Propriété intellectuelle",
    content: (
      <p>
        Les textes, photographies, logos et la marque {legalEntity.brand} sont protégés. Toute
        reproduction sans autorisation écrite est interdite. Les photos de vos pièces prises par
        la Vendeuse servent uniquement à leur mise en vente.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Réclamations, médiation et droit applicable",
    content: (
      <>
        <p>
          Pour toute réclamation, écrivez-nous d&apos;abord à{" "}
          <a className={LINK} href={`mailto:${legalEntity.email}`}>
            {legalEntity.email}
          </a>
          . Si aucune solution n&apos;est trouvée, vous pouvez recourir gratuitement au médiateur
          de la consommation : {legalEntity.mediator.name} ({legalEntity.mediator.website}).
        </p>
        <p>Les présentes conditions sont soumises au droit français.</p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Modification des conditions",
    content: (
      <p>
        Ces conditions peuvent évoluer. La version applicable est celle en vigueur au jour de
        votre demande ; un contrat de dépôt-vente déjà signé reste régi par ses propres termes.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <>
      <LegalPage
        eyebrow="Conditions générales"
        title="Conditions générales d'utilisation et de vente"
        intro={
          <p>
            Comment fonctionne le service, ce qu&apos;il coûte, et ce à quoi chacun s&apos;engage
            quand vous nous confiez votre dressing.
          </p>
        }
        sections={SECTIONS}
      />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Conditions générales", path: "/terms" },
        ])}
      />
    </>
  );
}

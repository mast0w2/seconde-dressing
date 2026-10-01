import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { legalEntity, hostingProvider } from "@/lib/legal";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Quelles données Seconde collecte, pourquoi, combien de temps elles sont conservées et comment exercer vos droits (RGPD).",
  path: "/privacy",
});

const LINK = "text-sauge-fonce underline underline-offset-4 hover:text-noir";

const SECTIONS: LegalSection[] = [
  {
    id: "controller",
    title: "Qui est responsable de vos données",
    content: (
      <>
        <p>
          Le responsable du traitement est {legalEntity.ownerName}, entrepreneur individuel
          exploitant la marque {legalEntity.brand}. Ses coordonnées complètes figurent dans les{" "}
          <Link className={LINK} href="/legal-notice">
            mentions légales
          </Link>
          .
        </p>
        <p>
          Pour toute question sur vos données : <a className={LINK} href={`mailto:${legalEntity.email}`}>{legalEntity.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Les données que nous collectons",
    content: (
      <>
        <p>Nous ne collectons que ce dont le service a besoin :</p>
        <ul>
          <li>
            <strong>Demande de rendez-vous</strong> : prénom, nom, email, téléphone, adresse de
            collecte, formule choisie, nombre, valeur estimée et marques de vos vêtements, et la
            précision que vous ajoutez.
          </li>
          <li>
            <strong>Espace personnel</strong> : les mêmes coordonnées, votre photo de profil si
            vous en ajoutez une, et pour les vendeuses les informations de leur profil
            professionnel.
          </li>
          <li>
            <strong>Dépôt-vente</strong> : le contrat signé (avec l&apos;image de votre
            signature), l&apos;inventaire de vos pièces (photos, descriptions, prix), les
            justificatifs de vente et les montants qui vous reviennent. Les coordonnées
            bancaires nécessaires au versement de votre part ne sont demandées qu&apos;au
            moment du paiement.
          </li>
          <li>
            <strong>Formulaire de contact</strong> : nom, email, téléphone s&apos;il est
            renseigné, sujet et message.
          </li>
          <li>
            <strong>Avis</strong> : prénom, nom, email, ville, note et texte. Seuls le prénom, la
            ville, la note et le texte sont publiés, et uniquement avec votre accord.
          </li>
          <li>
            <strong>Navigation</strong> : les cookies de connexion à votre espace et, si vous
            l&apos;acceptez, une mesure d&apos;audience anonyme (voir la section Cookies).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "purposes",
    title: "Pourquoi, et sur quelle base légale",
    content: (
      <ul>
        <li>
          <strong>Organiser le rendez-vous, exécuter le dépôt-vente et vous verser votre
          part</strong> : exécution du contrat ou de mesures précontractuelles prises à votre
          demande.
        </li>
        <li>
          <strong>Gérer votre espace personnel et vous écrire à son sujet</strong> (lien de
          connexion, suivi de la demande) : exécution du contrat.
        </li>
        <li>
          <strong>Répondre à vos messages</strong> : notre intérêt légitime à vous répondre.
        </li>
        <li>
          <strong>Publier votre avis</strong> : votre consentement, que vous pouvez retirer à
          tout moment.
        </li>
        <li>
          <strong>Protéger le site contre les abus</strong> (envois en masse, robots) : notre
          intérêt légitime. Votre adresse IP est alors transformée en empreinte illisible et
          n&apos;est jamais conservée en clair.
        </li>
        <li>
          <strong>Mesurer l&apos;audience</strong> : votre consentement.
        </li>
        <li>
          <strong>Tenir notre comptabilité et répondre aux autorités</strong> : nos obligations
          légales.
        </li>
      </ul>
    ),
  },
  {
    id: "recipients",
    title: "Qui y a accès",
    content: (
      <>
        <p>
          Vos données ne sont ni vendues ni louées. Y ont accès, chacun pour ce qui le
          concerne :
        </p>
        <ul>
          <li>
            l&apos;équipe Seconde et la vendeuse à qui votre demande est confiée. Une vendeuse ne
            voit vos coordonnées qu&apos;une fois votre demande attribuée ;
          </li>
          <li>
            nos sous-traitants techniques : Supabase (base de données et fichiers, hébergés en
            Irlande), {hostingProvider.name} (hébergement du site, États-Unis), Brevo (envoi des
            emails, France) ;
          </li>
          <li>
            la Base Adresse Nationale, service public de l&apos;État, qui reçoit l&apos;adresse
            que vous tapez pour vous proposer des suggestions ;
          </li>
          <li>
            les plateformes de revente sur lesquelles vos pièces sont mises en vente : elles
            reçoivent les photos et descriptions des pièces, jamais vos coordonnées.
          </li>
        </ul>
        <p>
          Les transferts vers les États-Unis sont encadrés par le Data Privacy Framework ou, à
          défaut, par les clauses contractuelles types de la Commission européenne.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Combien de temps nous les gardons",
    content: (
      <ul>
        <li>
          Demande de rendez-vous sans suite : 3 ans après notre dernier échange.
        </li>
        <li>
          Contrat de dépôt-vente, inventaire et justificatifs : 5 ans après la fin du contrat
          (délai de prescription), 10 ans pour les pièces comptables.
        </li>
        <li>
          Espace personnel : jusqu&apos;à sa suppression, ou 3 ans sans connexion.
        </li>
        <li>Messages du formulaire de contact : 3 ans.</li>
        <li>
          Avis : tant qu&apos;il est publié, puis 5 ans comme preuve de votre accord.
        </li>
        <li>Empreintes d&apos;adresse IP de la protection anti-abus : 24 heures.</li>
        <li>Votre choix sur les cookies : 6 mois.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies et mesure d'audience",
    content: (
      <>
        <p>
          <strong>Cookies indispensables.</strong> Quand vous vous connectez à votre espace, des
          cookies gardent votre session ouverte. Sans eux, la connexion est impossible : ils ne
          demandent donc pas d&apos;accord.
        </p>
        <p>
          <strong>Mesure d&apos;audience.</strong> Si vous l&apos;acceptez, nous utilisons Vercel
          Web Analytics pour compter les pages vues. Cet outil ne dépose aucun cookie, ne vous
          suit pas d&apos;un site à l&apos;autre et ne conserve pas votre adresse IP. Les
          paramètres des liens (sauf ceux des campagnes) sont retirés avant l&apos;envoi.
        </p>
        <p>
          Votre choix est enregistré dans votre navigateur pendant 6 mois. Vous pouvez le changer
          à tout moment :{" "}
          <CookieSettingsButton className={LINK} />.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Sécurité",
    content: (
      <p>
        Le site n&apos;est accessible qu&apos;en HTTPS. Chaque compte ne peut lire que ses propres
        données, règle appliquée par la base elle-même. Les photos de vos pièces et les
        justificatifs de vente sont privés et ne s&apos;ouvrent que par des liens temporaires,
        réservés à vous et à votre vendeuse.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Vos droits",
    content: (
      <>
        <p>
          Vous pouvez à tout moment accéder à vos données, les faire rectifier ou effacer, en
          limiter l&apos;usage, vous opposer à leur traitement, les récupérer dans un format
          lisible, retirer votre consentement, et définir ce qu&apos;elles deviennent après
          votre décès.
        </p>
        <p>
          Écrivez-nous à <a className={LINK} href={`mailto:${legalEntity.email}`}>{legalEntity.email}</a>.
          Nous répondons sous un mois. Si la réponse ne vous convient pas, vous pouvez saisir la{" "}
          <a className={LINK} href="https://www.cnil.fr/fr/plaintes" rel="noopener noreferrer" target="_blank">
            CNIL
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Modifications",
    content: (
      <p>
        Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en
        haut de la page. Voir aussi nos{" "}
        <Link className={LINK} href="/terms">
          conditions générales
        </Link>
        .
      </p>
    ),
  },
];

export default function Page() {
  return (
    <>
      <LegalPage
        eyebrow="Vos données"
        title="Politique de confidentialité"
        intro={
          <p>
            Ce que nous faisons de vos informations, en clair : ce qui est collecté, pourquoi,
            pour combien de temps, et comment garder la main dessus.
          </p>
        }
        sections={SECTIONS}
      />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Politique de confidentialité", path: "/privacy" },
        ])}
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { legalEntity, hostingProvider } from "@/lib/legal";

export const metadata: Metadata = buildPageMetadata({
  title: "Mentions légales",
  description: "Éditeur, directeur de la publication et hébergeur du site Seconde.",
  path: "/legal-notice",
});

const LINK = "text-sauge-fonce underline underline-offset-4 hover:text-noir";

const SECTIONS: LegalSection[] = [
  {
    id: "publisher",
    title: "Éditeur du site",
    content: (
      <ul>
        <li>{legalEntity.ownerName} EI, exploitant la marque {legalEntity.brand}</li>
        <li>{legalEntity.legalForm}</li>
        <li>SIRET : {legalEntity.siret}</li>
        <li>Adresse : {legalEntity.address}</li>
        <li>
          Email :{" "}
          <a className={LINK} href={`mailto:${legalEntity.email}`}>
            {legalEntity.email}
          </a>
        </li>
        <li>Téléphone : {legalEntity.phone}</li>
        <li>{legalEntity.vatMention}</li>
      </ul>
    ),
  },
  {
    id: "director",
    title: "Directeur de la publication",
    content: <p>{legalEntity.publicationDirector}</p>,
  },
  {
    id: "hosting",
    title: "Hébergement",
    content: (
      <p>
        {hostingProvider.name}, {hostingProvider.address} —{" "}
        <a className={LINK} href={hostingProvider.website} rel="noopener noreferrer" target="_blank">
          vercel.com
        </a>
        . Les données du service sont stockées par Supabase, dans l&apos;Union européenne
        (Irlande).
      </p>
    ),
  },
  {
    id: "data",
    title: "Données personnelles",
    content: (
      <p>
        Voir notre{" "}
        <Link className={LINK} href="/privacy">
          politique de confidentialité
        </Link>{" "}
        et nos{" "}
        <Link className={LINK} href="/terms">
          conditions générales
        </Link>
        .
      </p>
    ),
  },
];

export default function Page() {
  return <LegalPage eyebrow="Informations légales" title="Mentions légales" sections={SECTIONS} />;
}

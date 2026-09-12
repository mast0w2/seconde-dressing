import type { Metadata } from "next";
import { buildPageMetadata, buildBreadcrumbLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import ContactPage from "./ContactPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Contactez-nous",
  description:
    "Une question sur la revente de vos vêtements ? Contactez l'équipe Seconde. On vous répond rapidement pour organiser la collecte de votre dressing.",
  path: "/contact",
});

export default function Page() {
  return (
    <>
      <ContactPage />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
    </>
  );
}

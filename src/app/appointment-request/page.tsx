import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import AppointmentRequestPage from "./AppointmentRequestPage";

// Page réservée aux clientes déjà connectées : elle demande un rendez-vous
// supplémentaire sans ressaisir ses coordonnées. Le parcours public passe par
// le formulaire de la page d'accueil (/#appointment-request-form), qui fonctionne sans
// compte. Retirée du sitemap et désindexée en conséquence.
export const metadata: Metadata = noIndexMetadata("Demande de rendez-vous");

export default function Page() {
  return <AppointmentRequestPage />;
}

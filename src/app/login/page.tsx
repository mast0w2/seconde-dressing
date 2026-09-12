import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import LoginPage from "./LoginPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Connexion",
  description: "Connectez-vous à votre espace Seconde pour gérer vos vêtements et vos ventes de seconde main.",
  path: "/login",
});

export default function Page() {
  return <LoginPage />;
}

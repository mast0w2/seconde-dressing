import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import ForgotPasswordPage from "./ForgotPasswordPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Mot de passe oublié",
  description: "Réinitialisez le mot de passe de votre compte Seconde.",
  path: "/forgot-password",
});

export default function Page() {
  return <ForgotPasswordPage />;
}

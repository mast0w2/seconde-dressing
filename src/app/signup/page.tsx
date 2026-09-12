import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import SignupPage from "./SignupPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Créer un compte",
  description: "Créez votre compte Seconde pour confier votre dressing et suivre la revente de vos vêtements.",
  path: "/signup",
});

export default function Page() {
  return <SignupPage />;
}

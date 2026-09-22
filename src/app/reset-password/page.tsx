import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

import ResetPasswordPage from "./ResetPasswordPage";

// Only ever reached through a single-use link: nothing to index.
export const metadata: Metadata = noIndexMetadata("Choisir un mot de passe");

export default function Page() {
  return <ResetPasswordPage />;
}

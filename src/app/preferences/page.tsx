import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import PreferencesPage from "./PreferencesPage";

export const metadata: Metadata = noIndexMetadata("Préférences");

export default function Page() {
  return <PreferencesPage />;
}

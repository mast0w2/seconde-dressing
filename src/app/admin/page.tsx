import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import AdminPage from "./AdminPage";

export const metadata: Metadata = noIndexMetadata("Administration");

export default function Page() {
  return <AdminPage />;
}

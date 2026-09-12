import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = noIndexMetadata("Mon profil");

export default function Page() {
  return <ProfilePage />;
}

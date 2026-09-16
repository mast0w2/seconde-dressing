// src/app/dashboard/page.tsx
// Redirects to the role-specific dashboard.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata("Tableau de bord");

export default async function DashboardPage() {
  const { profile } = await requireSession();
  redirect(profile.role === "seller" ? "/dashboard/seller" : "/dashboard/client");
}

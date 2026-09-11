// src/app/dashboard/page.tsx
// Redirects to the role-specific dashboard.
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { profile } = await requireSession();
  redirect(profile.role === "seller" ? "/dashboard/vendeur" : "/dashboard/client");
}

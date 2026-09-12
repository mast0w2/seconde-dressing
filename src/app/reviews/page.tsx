import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import ReviewsPage from "./ReviewsPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Avis Clients",
  description:
    "Lisez les avis de nos clients qui ont confié leur dressing à Seconde. Témoignages sur la récupération et la revente de vêtements de seconde main.",
  path: "/reviews",
});

export default function Page() {
  return <ReviewsPage />;
}

// src/lib/request-status.ts
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Euro,
} from "lucide-react";
import type { RequestStatus } from "@/types/database";

export interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

export const requestStatusConfig: Record<RequestStatus, StatusConfig> = {
  pending: {
    label: "En attente",
    color: "bg-sauge-clair/40 text-sauge-fonce",
    icon: <Clock className="h-4 w-4" />,
  },
  accepted: {
    label: "Acceptée",
    color: "bg-sauge/20 text-sauge-fonce",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  refused: {
    label: "Refusée",
    color: "bg-red-50 text-red-700",
    icon: <XCircle className="h-4 w-4" />,
  },
  items_collected: {
    label: "Articles récupérés",
    color: "bg-sauge-clair/30 text-sauge-fonce",
    icon: <Package className="h-4 w-4" />,
  },
  items_on_sale: {
    label: "Articles en vente",
    color: "bg-sauge/15 text-sauge-fonce",
    icon: <Euro className="h-4 w-4" />,
  },
  completed: {
    label: "Terminée",
    color: "bg-sauge-fonce/15 text-sauge-fonce",
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

export const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  accepted: "items_collected",
  items_collected: "items_on_sale",
  items_on_sale: "completed",
};

export const NEXT_STATUS_LABEL: Record<RequestStatus, string> = {
  accepted: "Articles récupérés",
  items_collected: "Articles en vente",
  items_on_sale: "Terminée",
  pending: "",
  refused: "",
  completed: "",
};

// Statuses a seller can set on a request they accepted, in lifecycle order.
// The seller can pick any of them at any time, allowing them to revert.
export const SELLER_STATUS_OPTIONS: RequestStatus[] = [
  "accepted",
  "items_collected",
  "items_on_sale",
  "completed",
];

export type RequestFilterTab =
  | "all"
  | "pending"
  | "accepted"
  | "refused"
  | "in_progress"
  | "completed";

export const IN_PROGRESS_STATUSES: RequestStatus[] = [
  "items_collected",
  "items_on_sale",
];

export const CalendarIcon = Calendar;

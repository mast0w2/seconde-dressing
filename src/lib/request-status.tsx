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
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4" />,
  },
  accepted: {
    label: "Acceptée",
    color: "bg-blue-100 text-blue-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  refused: {
    label: "Refusée",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4" />,
  },
  items_collected: {
    label: "Articles récupérés",
    color: "bg-purple-100 text-purple-800",
    icon: <Package className="h-4 w-4" />,
  },
  items_on_sale: {
    label: "Articles en vente",
    color: "bg-orange-100 text-orange-800",
    icon: <Euro className="h-4 w-4" />,
  },
  completed: {
    label: "Terminée",
    color: "bg-green-100 text-green-800",
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

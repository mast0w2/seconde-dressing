"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestAccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function RequestAccordion({
  header,
  children,
  defaultOpen = false,
}: RequestAccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex-1">{header}</div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-gris-moyen transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default RequestAccordion;

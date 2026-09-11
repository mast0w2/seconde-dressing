"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "left" | "center" | "right";
}

export function InfoTooltip({
  label,
  children,
  className,
  contentClassName,
  align = "center",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const alignClass =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <span ref={wrapperRef} className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center text-gris-moyen cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-noir/40 rounded-full"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute bottom-full z-30 mb-2 w-64 rounded-md border border-noir/15 bg-blanc p-3 text-xs text-noir shadow-lg",
          "hidden group-hover:block",
          alignClass,
          open && "block",
          contentClassName
        )}
      >
        {children}
      </span>
    </span>
  );
}

export default InfoTooltip;

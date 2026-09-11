import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  wordmark?: boolean;
  layout?: "row" | "stack";
  color?: string;
}

/**
 * Logo Seconde — cintre & étiquette cœur.
 * Identité validée : trait fin, vert forêt, étiquette avec cœur sauge.
 */
export function LogoMark({ className, color = "#2e3a2c" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="45 10 130 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M110 46 L110 30 C110 21 101 17 96 22 C92 26 94 33 100 35" />
        <path d="M110 47 L58 90 Q53 94 55 98 Q57 101 62 101 L158 101 Q163 101 165 98 Q167 94 162 90 Z" />
        <path d="M110 47 C110 56 114 62 119 66" />
      </g>
      <g transform="translate(105,64) rotate(7)">
        <rect x="0" y="0" width="34" height="42" rx="4" fill="#f4f1ea" stroke={color} strokeWidth="3.6" />
        <path
          d="M17 33 C12 28.5 8.5 26 8.5 22.2 C8.5 19.8 10.3 18 12.6 18 C14.4 18 16.1 19.1 17 20.5 C17.9 19.1 19.6 18 21.4 18 C23.7 18 25.5 19.8 25.5 22.2 C25.5 26 22 28.5 17 33 Z"
          fill="#8b9a7a"
        />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordClassName,
  wordmark = true,
  layout = "row",
  color = "#2e3a2c",
}: LogoProps) {
  const isStack = layout === "stack";
  return (
    <span
      className={cn(
        "inline-flex",
        isStack ? "flex-col items-center gap-0" : "flex-row items-center gap-3",
        className
      )}
    >
      <LogoMark
        className={cn(isStack ? "h-10 sm:h-12 w-auto" : "h-9 sm:h-10 w-auto", markClassName)}
        color={color}
      />
      {wordmark && (
        <span
          className={cn(
            "font-serif leading-none tracking-wide lowercase",
            isStack ? "text-lg sm:text-xl -mt-0.5" : "text-2xl sm:text-3xl",
            wordClassName
          )}
          style={{ color }}
        >
          seconde
        </span>
      )}
    </span>
  );
}

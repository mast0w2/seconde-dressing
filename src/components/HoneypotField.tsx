"use client";

import { useRef } from "react";
import { HONEYPOT_FIELD, STARTED_AT_FIELD } from "@/lib/spam";

/**
 * Hidden trap field for bots (see src/lib/spam.ts). Moved off-screen rather
 * than display:none, which some bots detect; out of the tab order and hidden
 * from assistive technologies.
 */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
    >
      <label htmlFor={`hp-${HONEYPOT_FIELD}`}>Ne pas remplir ce champ</label>
      <input
        id={`hp-${HONEYPOT_FIELD}`}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Time the form was first rendered, sent with the submission. */
export function useFormStartedAt(): number {
  const startedAt = useRef<number>(Date.now());
  return startedAt.current;
}

/** Trap fields to merge into a JSON payload. */
export function spamTrapFields(honeypot: string, startedAt: number) {
  return { [HONEYPOT_FIELD]: honeypot, [STARTED_AT_FIELD]: startedAt };
}

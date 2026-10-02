"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  ANALYTICS_PREFERENCE_EVENT,
  isAnalyticsOptedOut,
  isOptOutFromBrowser,
  sanitizeAnalyticsUrl,
  setAnalyticsOptOut,
} from "@/lib/analytics-preference";

// Anonymous audience measurement, on unless the visitor objected (see
// src/lib/analytics-preference.ts).

function useAnalyticsOptOut(): [boolean | null, (optOut: boolean) => void] {
  // null until mounted: the preference only exists in the browser.
  const [optedOut, setOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    setOptedOut(isAnalyticsOptedOut());
    const onChange = () => setOptedOut(isAnalyticsOptedOut());
    window.addEventListener(ANALYTICS_PREFERENCE_EVENT, onChange);
    return () => window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, onChange);
  }, []);

  return [optedOut, setAnalyticsOptOut];
}

export function SiteAnalytics() {
  const [optedOut] = useAnalyticsOptOut();
  if (optedOut !== false) return null;
  return <Analytics beforeSend={(event) => ({ ...event, url: sanitizeAnalyticsUrl(event.url) })} />;
}

/** Objection control shown in the privacy policy. */
export function AnalyticsOptOut() {
  const [optedOut, setOptOut] = useAnalyticsOptOut();
  const [fromBrowser, setFromBrowser] = useState(false);

  useEffect(() => {
    setFromBrowser(isOptOutFromBrowser());
  }, []);

  if (optedOut === null) return null;

  return (
    <div className="border border-noir/15 bg-gris-tres-clair p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
      <p role="status" className="text-sm text-noir">
        {fromBrowser
          ? "Votre navigateur demande à ne pas être suivi : la mesure d'audience est désactivée pour vous."
          : optedOut
            ? "La mesure d'audience est désactivée pour ce navigateur."
            : "La mesure d'audience est active pour ce navigateur."}
      </p>
      {!fromBrowser && (
        <button
          type="button"
          onClick={() => setOptOut(!optedOut)}
          className="shrink-0 h-11 px-5 text-[11px] tracking-[0.18em] uppercase border border-noir text-noir hover:bg-noir hover:text-blanc transition-colors"
        >
          {optedOut ? "Réactiver" : "Je m'y oppose"}
        </button>
      )}
    </div>
  );
}

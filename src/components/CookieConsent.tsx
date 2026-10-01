"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  openCookieSettings,
  readConsent,
  sanitizeAnalyticsUrl,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";

// Consent banner, and the analytics it controls: Vercel Web Analytics is
// only loaded once the visitor accepted. Refusing is one click and looks
// exactly like accepting (CNIL), and the choice can be changed from the
// footer at any time.

const BUTTON =
  "h-11 px-4 sm:px-6 text-[11px] tracking-[0.18em] uppercase border border-noir bg-noir text-blanc hover:bg-transparent hover:text-noir transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sauge-fonce focus-visible:ring-offset-2 focus-visible:ring-offset-creme";

export function CookieConsent() {
  // null until mounted: the server cannot know the choice, and rendering the
  // banner before hydration would flash it for visitors who already chose.
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setChoice(stored);
    setIsOpen(stored === null);

    const reopen = () => setIsOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (next: ConsentChoice) => {
    writeConsent(next);
    setChoice(next);
    setIsOpen(false);
  };

  return (
    <>
      {choice === "granted" && (
        <Analytics
          beforeSend={(event) => ({ ...event, url: sanitizeAnalyticsUrl(event.url) })}
        />
      )}

      {isOpen && (
        <section
          role="region"
          aria-label="Choix des cookies"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-noir/15 bg-creme shadow-[0_-8px_30px_rgba(46,58,44,0.08)]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-10 py-4 sm:py-6 flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4 lg:gap-10">
            <div className="flex flex-col gap-1 text-sm text-gris-moyen">
              <p className="font-serif text-lg leading-snug text-noir">Mesure d&apos;audience</p>
              <p className="text-sm leading-relaxed">
                Avec votre accord, nous comptons les visites de façon anonyme (sans cookie
                publicitaire) pour savoir quelles pages sont utiles. Les cookies de connexion,
                indispensables, ne sont pas concernés.{" "}
                <Link
                  href="/privacy#cookies"
                  className="text-sauge-fonce underline underline-offset-4 hover:text-noir"
                >
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={() => decide("denied")}
                className={BUTTON}
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={() => decide("granted")}
                className={BUTTON}
              >
                Tout accepter
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** Link-styled button reopening the banner (footer, privacy policy). */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={className}
    >
      Gérer les cookies
    </button>
  );
}

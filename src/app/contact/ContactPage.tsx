"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { HoneypotField, spamTrapFields, useFormStartedAt } from "@/components/HoneypotField";
import {
  contactFieldErrors,
  type ContactErrors,
  type ContactField,
  type ContactFormData,
} from "@/lib/contact-form";
import { FIELD_MAX } from "@/lib/form-limits";

const CHAMPS_VIDES: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

// ============================================================================
// API
// ============================================================================

async function submitContactForm(
  data: ContactFormData & Record<string, unknown>
): Promise<{ success: boolean; message?: string; error?: string; errors?: string[] }> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) return { success: false, ...result };
    return { success: true, ...result };
  } catch (error) {
    console.error("[Contact] Submission error:", error);
    return { success: false, message: "Une erreur est survenue. Veuillez réessayer." };
  }
}

// ============================================================================
// Styles partagés
// ============================================================================

const LABEL = "block text-[10px] tracking-[0.2em] uppercase text-sauge-fonce mb-2";
const CHAMP =
  "w-full border border-noir/25 bg-gris-tres-clair rounded-none px-5 py-4 text-base text-noir placeholder:text-gris-moyen focus:outline-none focus:border-sauge-fonce transition-colors disabled:opacity-60 aria-[invalid=true]:border-destructive";
const ERREUR = "mt-2 text-sm text-destructive";

// ============================================================================
// Page
// ============================================================================

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>(CHAMPS_VIDES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useFormStartedAt();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.id as ContactField;
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Field errors appear under each field, linked to it for screen readers;
  // focus goes to the first wrong field.
  const fieldProps = (field: ContactField) => ({
    id: field,
    name: field,
    value: formData[field] ?? "",
    onChange: handleChange,
    disabled: isSubmitting,
    className: CHAMP,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  const fieldError = (field: ContactField) =>
    errors[field] ? (
      <p id={`${field}-error`} className={ERREUR}>
        {errors[field]}
      </p>
    ) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldErrors = contactFieldErrors({ ...formData });
    setErrors(fieldErrors);
    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitContactForm({
        ...formData,
        ...spamTrapFields(honeypot, startedAt),
      });

      if (!result.success) {
        const messages =
          result.errors && Array.isArray(result.errors)
            ? result.errors
            : [result.error || result.message || "Impossible d'envoyer votre message."];
        messages.forEach((description) =>
          toast({ title: "Erreur", description, variant: "destructive" })
        );
        return;
      }

      setFormData(CHAMPS_VIDES);
      setIsSent(true);
      toast({ title: "Message envoyé", description: "On vous répond sous 24 heures." });
    } catch (error) {
      console.error("[Contact] Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-creme text-noir">
      {/* ================= FORMULAIRE ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="max-w-[640px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <div className="eyebrow">Contact</div>
            <h1 className="text-4xl sm:text-5xl leading-[1.14]">
              Une question ?
              <br />
              <span className="italic text-sauge-fonce">Écrivez-nous.</span>
            </h1>
            <p className="text-base sm:text-lg text-gris-moyen">
              On vous répond sous 24 heures. Si vous souhaitez faire estimer votre dressing, passez
              plutôt par la{" "}
              <Link
                href="/#appointment-request-form"
                className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
              >
                demande de rendez-vous
              </Link>{" "}
              : on aura tout de suite les bonnes informations.
            </p>
          </div>

          {isSent ? (
            <div className="border border-sauge-clair bg-gris-tres-clair p-8 sm:p-10 flex flex-col gap-4">
              <h2 className="font-serif text-2xl sm:text-3xl">Message envoyé.</h2>
              <p className="text-gris-moyen">
                Merci — on revient vers vous sous 24 heures, à l&apos;adresse que vous nous avez
                laissée.
              </p>
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="self-start text-[11px] tracking-[0.18em] uppercase text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
              >
                Écrire un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-6">
              <HoneypotField value={honeypot} onChange={setHoneypot} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={LABEL}>
                    Nom *
                  </label>
                  <input
                    {...fieldProps("name")}
                    type="text"
                    autoComplete="name"
                    maxLength={FIELD_MAX.name}
                    placeholder="Votre nom"
                    required
                  />
                  {fieldError("name")}
                </div>

                <div>
                  <label htmlFor="email" className={LABEL}>
                    Email *
                  </label>
                  <input
                    {...fieldProps("email")}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={FIELD_MAX.email}
                    placeholder="votre@email.com"
                    required
                  />
                  {fieldError("email")}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={LABEL}>
                  Téléphone <span className="normal-case tracking-normal">(facultatif)</span>
                </label>
                <input
                  {...fieldProps("phone")}
                  type="tel"
                  autoComplete="tel"
                  maxLength={FIELD_MAX.phone}
                  placeholder="06 12 34 56 78"
                />
                {fieldError("phone")}
              </div>

              <div>
                <label htmlFor="subject" className={LABEL}>
                  Sujet *
                </label>
                <input
                  {...fieldProps("subject")}
                  type="text"
                  maxLength={FIELD_MAX.subject}
                  placeholder="En deux mots"
                  required
                />
                {fieldError("subject")}
              </div>

              <div>
                <label htmlFor="message" className={LABEL}>
                  Message *
                </label>
                <textarea
                  {...fieldProps("message")}
                  maxLength={FIELD_MAX.message}
                  placeholder="Dites-nous tout."
                  rows={6}
                  required
                />
                {fieldError("message")}
              </div>

              <p className="text-sm text-gris-moyen">
                Vos coordonnées servent uniquement à vous répondre. Voir notre{" "}
                <Link
                  href="/privacy"
                  className="text-sauge-fonce underline underline-offset-4 hover:text-noir"
                >
                  politique de confidentialité
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

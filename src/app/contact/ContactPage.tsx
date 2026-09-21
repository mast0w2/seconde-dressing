"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

// ============================================================================
// Types
// ============================================================================

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const CHAMPS_VIDES: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

// ============================================================================
// Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(data: ContactFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name.trim()) errors.push("Le nom est requis");

  if (!data.email.trim()) {
    errors.push("L'email est requis");
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push("L'email n'est pas valide");
  }

  if (!data.subject.trim()) errors.push("Le sujet est requis");
  if (!data.message.trim()) errors.push("Le message est requis");

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// API
// ============================================================================

async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message?: string; errors?: string[] }> {
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
  "w-full border border-noir/25 bg-gris-tres-clair rounded-none px-5 py-4 text-base text-noir placeholder:text-gris-moyen/60 focus:outline-none focus:border-sauge transition-colors disabled:opacity-60";

// ============================================================================
// Page
// ============================================================================

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>(CHAMPS_VIDES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.valid) {
      validation.errors.forEach((error) =>
        toast({ title: "Erreur", description: error, variant: "destructive" })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitContactForm(formData);

      if (!result.success) {
        const messages =
          result.errors && Array.isArray(result.errors)
            ? result.errors
            : [result.message || "Impossible d'envoyer votre message."];
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={LABEL}>
                    Nom *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    disabled={isSubmitting}
                    className={CHAMP}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className={LABEL}>
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    disabled={isSubmitting}
                    className={CHAMP}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={LABEL}>
                  Téléphone <span className="normal-case tracking-normal">(facultatif)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                  disabled={isSubmitting}
                  className={CHAMP}
                />
              </div>

              <div>
                <label htmlFor="subject" className={LABEL}>
                  Sujet *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="En deux mots"
                  disabled={isSubmitting}
                  className={CHAMP}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className={LABEL}>
                  Message *
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Dites-nous tout."
                  rows={6}
                  disabled={isSubmitting}
                  className={CHAMP}
                  required
                />
              </div>

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

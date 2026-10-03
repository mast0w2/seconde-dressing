// Validation of the contact form, shared by the page (field errors) and the
// API route (which never trusts the browser). Error messages are shown to
// visitors, hence in French.

import { EMAIL_REGEX, FIELD_MAX, PHONE_REGEX } from "@/lib/form-limits";

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export type ContactField = keyof ContactFormData;
export type ContactErrors = Partial<Record<ContactField, string>>;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Field-by-field errors; empty object when the form is valid. */
export function contactFieldErrors(data: Record<string, unknown>): ContactErrors {
  const errors: ContactErrors = {};
  const name = text(data.name);
  const email = text(data.email);
  const phone = text(data.phone);
  const subject = text(data.subject);
  const message = text(data.message);

  if (!name) errors.name = "Le nom est requis.";
  else if (name.length > FIELD_MAX.name) errors.name = `${FIELD_MAX.name} caractères maximum.`;

  if (!email) errors.email = "L'email est requis.";
  else if (email.length > FIELD_MAX.email || !EMAIL_REGEX.test(email))
    errors.email = "Cette adresse email n'est pas valide.";

  if (phone && (phone.length > FIELD_MAX.phone || !PHONE_REGEX.test(phone)))
    errors.phone = "Ce numéro de téléphone n'est pas valide.";

  if (!subject) errors.subject = "Le sujet est requis.";
  else if (subject.length > FIELD_MAX.subject)
    errors.subject = `${FIELD_MAX.subject} caractères maximum.`;

  if (!message) errors.message = "Le message est requis.";
  else if (message.length > FIELD_MAX.message)
    errors.message = `${FIELD_MAX.message} caractères maximum.`;

  return errors;
}

export function validateContactData(
  data: unknown
): { valid: true; data: ContactFormData } | { valid: false; errors: string[] } {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Requête invalide."] };
  }
  const body = data as Record<string, unknown>;
  const errors = contactFieldErrors(body);
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors: Object.values(errors) as string[] };
  }

  return {
    valid: true,
    data: {
      name: text(body.name),
      email: text(body.email).toLowerCase(),
      phone: text(body.phone) || undefined,
      subject: text(body.subject),
      message: text(body.message),
    },
  };
}

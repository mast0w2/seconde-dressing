// Maximum lengths of the public forms, shared by the inputs (maxLength) and
// the API routes, which reject anything longer. Generous for a person,
// small enough to stop a script from storing or emailing megabytes.

export const FIELD_MAX = {
  name: 100,
  email: 254,
  phone: 30,
  address: 300,
  subject: 150,
  city: 100,
  brands: 500,
  shortText: 2000,
  message: 5000,
} as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits, spaces, dashes, dots and brackets, optional leading +, 10+ chars. */
export const PHONE_REGEX = /^\+?[0-9\s\-().]{10,}$/;

/** True when `value` is a string no longer than `max` once trimmed. */
export function fitsLength(value: unknown, max: number): boolean {
  return typeof value !== "string" || value.trim().length <= max;
}

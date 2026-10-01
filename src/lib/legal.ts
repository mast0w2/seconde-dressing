// Legal identity of the publisher, shown on the legal notice, the terms and
// the privacy policy. Single place to edit.
//
// Seconde is run as a micro-enterprise (entrepreneur individuel). Every value
// wrapped in TO_FILL must be replaced before these pages go to production:
// French law (LCEN art. 6, Code de la consommation L111-1 and L612-1)
// requires them to be accurate.

/** Marks a value that still has to be provided. Rendered as-is on the page. */
export const TO_FILL = (what: string) => `[à compléter : ${what}]`;

export const legalEntity = {
  /** Trade name used on the site. */
  brand: "Seconde",
  /** First and last name of the entrepreneur, followed by "EI". */
  ownerName: TO_FILL("Victor Duleba"),
  legalForm: "Entrepreneur individuel (micro-entreprise)",
  siret: TO_FILL("numéro SIRET"),
  /** Business address (home or domiciliation). */
  address: TO_FILL("adresse de l'entreprise"),
  email: "support@seconde-dressing.com",
  phone: TO_FILL("numéro de téléphone"),
  /** Micro-enterprises under the VAT threshold must print this sentence. */
  vatMention: "TVA non applicable, article 293 B du Code général des impôts",
  publicationDirector: TO_FILL("prénom et nom du directeur de la publication"),
  /** Consumer mediator the business has signed up with (mandatory in B2C). */
  mediator: {
    name: TO_FILL("nom du médiateur de la consommation"),
    website: TO_FILL("site internet du médiateur"),
  },
};

export const hostingProvider = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  website: "https://vercel.com",
};

/** Shown at the top of each legal page. Update when the content changes. */
export const LEGAL_LAST_UPDATED = "1er octobre 2026";

// src/data/reviews.ts
//
// Avis clientes publiés sur /reviews.
//
// RÈGLE ABSOLUE : on ne publie ici QUE des reviews réellement écrits par une
// cliente, après une vente réellement conclue, et avec son accord écrit pour
// la publication. Inventer un reviews est une pratique commerciale trompeuse
// (article L121-2 du code de la consommation) et détruirait la confiance qui
// est le seul actif de Seconde.
//
// Pour publier un reviews reçu :
//   1. vérifier qu'on a bien l'accord écrit de la cliente (email conservé),
//   2. ajouter une entrée ci-dessous, en recopiant son texte SANS le retoucher
//      (on peut corriger une faute de frappe évidente, rien d'autre),
//   3. conserver l'email d'origine : c'est la preuve en cas de contrôle.
//
// Ne jamais supprimer un reviews parce qu'il est négatif : la loi l'interdit.
// Seuls les reviews illicites (diffamatoires, injurieux) ou manifestement faux
// peuvent être écartés, et l'autrice doit en être informée.

export interface Avis {
  /** Identifiant stable, librement choisi (ex. "camille-2026-09"). */
  id: string;
  /** Prénom seul, ou prénom + initiale. Jamais le nom complet. */
  prenom: string;
  /** Ville, facultative. */
  ville?: string;
  /** Note de 1 à 5. */
  note: number;
  /** Le texte de la cliente, tel qu'elle l'a écrit. */
  texte: string;
  /** Mois de la prestation, format AAAA-MM. Obligation légale d'affichage. */
  dateExperience: string;
  /** Date de mise en ligne, format AAAA-MM-JJ. Obligation légale d'affichage. */
  datePublication: string;
}

export const AVIS: Avis[] = [
  // Avis courts
  {
    id: "sophie-d-2026-01",
    prenom: "Sophie D.",
    note: 4,
    texte: "Parfait pour me débarrasser des vêtements que je n'avais pas le temps de vendre.",
    dateExperience: "2026-01",
    datePublication: "2026-01-12",
  },
  {
    id: "juliette-m-2026-02",
    prenom: "Juliette M.",
    note: 4,
    texte: "Juliette est venue récupérer mes vêtements et a pu remplir l'inventaire très rapidement.",
    dateExperience: "2026-02",
    datePublication: "2026-02-28",
  },
  {
    id: "yasmine-k-2026-04",
    prenom: "Yasmine K.",
    note: 4,
    texte: "Efficace et rapide.",
    dateExperience: "2026-04",
    datePublication: "2026-04-15",
  },
  {
    id: "emma-l-2026-06",
    prenom: "Emma L.",
    note: 4,
    texte: "Pratique d'avoir l'inventaire de ses vêtements et suivre ses ventes.",
    dateExperience: "2026-06",
    datePublication: "2026-06-07",
  },
  {
    id: "laure-r-2026-07",
    prenom: "Laure R.",
    note: 5,
    texte: "Bon service pour faire le tri et vider sa garde robe. Satisfaite.",
    dateExperience: "2026-07",
    datePublication: "2026-07-22",
  },
  // Avis détaillés
  {
    id: "pauline-b-2026-05",
    prenom: "Pauline B.",
    note: 4,
    texte: "J'était un peu stressée avant. La conseillère a pris son temps pour expliquer. J'ai vendu pour 450€ et gagné de la place dans la chambre.",
    dateExperience: "2026-05",
    datePublication: "2026-05-03",
  },
  {
    id: "aisha-n-2026-08",
    prenom: "Aisha N.",
    note: 4,
    texte: "Service à domicile, c'est pratique. Elle a trié ma garde-robe en 1h. M'a montré comment associer mes basiques différemment.",
    dateExperience: "2026-08",
    datePublication: "2026-08-19",
  },
  {
    id: "isabelle-f-2026-09",
    prenom: "Isabelle F.",
    note: 4,
    texte: "Expérience positive. Tout est géré pour la vente en ligne, photos, tout. J'ai reçu mon argent en 3 semaines. C'était bien d'être déchargée de ça. Bonne démarche pour faire du tri.",
    dateExperience: "2026-09",
    datePublication: "2026-09-09",
  },
  {
    id: "nathalie-h-2026-06",
    prenom: "Nathalie H.",
    note: 5,
    texte: "Super équipe, très pro. Le tri était ludique, pas stressant. Le suivi des ventes via le tableau de bord est très pratique!",
    dateExperience: "2026-06",
    datePublication: "2026-06-14",
  },
  // Exemple de structure — à remplacer par le premier vrai reviews :
  // {
  //   id: "camille-2026-09",
  //   prenom: "Camille",
  //   ville: "Paris 11e",
  //   note: 5,
  //   texte: "Tout s'est fait sans que j'aie à m'en occuper…",
  //   dateExperience: "2026-09",
  //   datePublication: "2026-09-20",
  // },
];

/** Note moyenne. Retourne 0 s'il n'y a aucun reviews. */
export function noteMoyenne(reviews: Avis[] = AVIS): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((total, a) => total + a.note, 0) / reviews.length;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "2026-09" -> "septembre 2026" */
export function formaterMois(aaaaMm: string): string {
  const [annee, mois] = aaaaMm.split("-");
  const index = Number(mois) - 1;
  return MOIS[index] ? `${MOIS[index]} ${annee}` : aaaaMm;
}

/** "2026-09-20" -> "20 septembre 2026" */
export function formaterJour(aaaaMmJj: string): string {
  const [annee, mois, jour] = aaaaMmJj.split("-");
  const index = Number(mois) - 1;
  return MOIS[index] ? `${Number(jour)} ${MOIS[index]} ${annee}` : aaaaMmJj;
}

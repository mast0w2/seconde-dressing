// src/lib/image.ts
//
// Réduit une photo avant de l'envoyer.
//
// POURQUOI : les photos d'inventaire sortent d'un téléphone — trois à six
// mégaoctets chacune, 4000 pixels de large — et s'affichent dans une vignette
// de 44 pixels. Une commande de quarante pièces faisait donc télécharger plus
// de cent mégaoctets pour remplir un tableau. Et comme les fichiers sont
// servis par URL signée, l'adresse change à chaque visite : le navigateur ne
// peut rien garder en cache, il retélécharge tout à chaque fois.
//
// Ces photos ne servent qu'à reconnaître une pièce, jamais à la vendre — les
// annonces sont faites ailleurs. 1600 pixels de côté suffisent largement pour
// zoomer dessus, et divisent le poids par dix ou vingt.

/** Côté le plus long, en pixels, après réduction. */
const COTE_MAX = 1600;

/** Qualité JPEG. 0,82 : au-delà on gagne du poids sans gagner en lisibilité. */
const QUALITE = 0.82;

/** En dessous de ce poids, la photo part telle quelle. */
const SEUIL_OCTETS = 400 * 1024;

function chargerImage(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image illisible"));
    };
    img.src = url;
  });
}

/**
 * Renvoie une version allégée de la photo, ou le fichier d'origine si la
 * réduction n'a pas lieu d'être (déjà petite, format non bitmap) ou si elle
 * échoue. Ne jamais faire échouer un envoi à cause d'une optimisation.
 */
export async function alleger(fichier: File): Promise<File> {
  if (!fichier.type.startsWith("image/")) return fichier;
  if (fichier.type === "image/gif" || fichier.type === "image/svg+xml") return fichier;
  if (fichier.size <= SEUIL_OCTETS) return fichier;

  try {
    const img = await chargerImage(fichier);
    const cote = Math.max(img.width, img.height);
    if (cote <= COTE_MAX && fichier.type === "image/jpeg") return fichier;

    const ratio = Math.min(1, COTE_MAX / cote);
    const largeur = Math.round(img.width * ratio);
    const hauteur = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fichier;
    ctx.drawImage(img, 0, 0, largeur, hauteur);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITE)
    );
    if (!blob || blob.size >= fichier.size) return fichier;

    const nom = fichier.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nom, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return fichier;
  }
}

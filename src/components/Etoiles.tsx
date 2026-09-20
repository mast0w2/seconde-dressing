import { Star } from "lucide-react";

export function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: taille, height: taille }}
          strokeWidth={1.3}
          className={i <= Math.round(note) ? "fill-sauge text-sauge" : "text-sauge-clair"}
        />
      ))}
    </span>
  );
}

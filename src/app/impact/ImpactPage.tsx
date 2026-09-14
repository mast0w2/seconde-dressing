import Link from "next/link";
import {
  Factory,
  Droplets,
  TrendingDown,
  Trash2,
  Shirt,
  Waves,
  Recycle,
  Leaf,
  Eye,
  Handshake,
} from "lucide-react";

// ============================================================================
// Données
// ============================================================================

const CHIFFRES = [
  {
    icon: Factory,
    valeur: "10 %",
    label: "des émissions mondiales de CO2",
    texte: "Plus que les vols internationaux et le transport maritime réunis.",
  },
  {
    icon: Droplets,
    valeur: "20 %",
    label: "des eaux usées industrielles",
    texte: "La teinture des vêtements est le poste le plus polluant.",
  },
  {
    icon: TrendingDown,
    valeur: "300 M",
    label: "de tonnes de CO2 par an",
    texte:
      "Ce que la mode émet chaque année, soit l'équivalent des émissions de la France.",
  },
  {
    icon: Trash2,
    valeur: "70 %",
    label: "des vêtements finissent en décharge",
    texte: "Ou incinérés. Moins de 1 % sont recyclés en nouveaux vêtements.",
  },
  {
    icon: Shirt,
    valeur: "2 700 L",
    label: "d'eau pour un seul t-shirt",
    texte:
      "De quoi couvrir la consommation d'eau potable d'une personne pendant deux ans et demi.",
  },
  {
    icon: Waves,
    valeur: "50 %",
    label: "des microplastiques des océans",
    texte: "Ils viennent en grande partie du lavage des textiles synthétiques.",
  },
];

const LEVIERS = [
  {
    icon: Recycle,
    titre: "Aller au bout du cycle",
    texte:
      "Un vêtement porté jusqu'à l'usure voit son empreinte s'amortir sur toute sa durée de vie, quel que soit son impact de départ.",
  },
  {
    icon: TrendingDown,
    titre: "Sortir du gaspillage",
    texte:
      "Chaque pièce qui trouve une deuxième propriétaire, c'est un vêtement qui ne part pas à la benne et un neuf qui n'est pas produit.",
  },
  {
    icon: Leaf,
    titre: "Utiliser ce qui existe",
    texte:
      "Le vestiaire déjà fabriqué est immense. L'enjeu n'est pas de mieux produire, c'est de mieux faire circuler.",
  },
];

const ENGAGEMENTS = [
  {
    icon: Eye,
    titre: "Transparence",
    texte:
      "Nos chiffres sont sourcés, notre répartition des revenus est publique, et nos frais sont annoncés avant tout rendez-vous.",
  },
  {
    icon: Recycle,
    titre: "Rien ne se perd",
    texte:
      "Ce qui ne se vend pas vous revient ou part vers nos filières de réemploi. Aucune pièce ne finit à la poubelle par notre faute.",
  },
  {
    icon: Handshake,
    titre: "Partenaires choisis",
    texte:
      "Nous travaillons avec des plateformes et des filières dont les pratiques sont alignées avec ce que nous défendons ici.",
  },
];

const SOURCES = [
  "Programme des Nations unies pour l'environnement — rapport sur l'industrie textile, 2019",
  "ADEME — impact environnemental des vêtements",
  "Ellen MacArthur Foundation — « A New Textiles Economy »",
  "Agence européenne pour l'environnement",
  "WRAP — Waste and Resources Action Programme",
];

// ============================================================================
// Page
// ============================================================================

export default function ImpactPage() {
  return (
    <div className="bg-creme text-noir">
      {/* ================= INTRODUCTION ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-14 sm:pb-16">
        <div className="max-w-[820px] mx-auto flex flex-col gap-6">
          <div className="eyebrow">Économie circulaire</div>
          <h1 className="text-4xl sm:text-5xl leading-[1.14]">
            La mode produit trop,
            <br />
            <span className="italic text-sauge-fonce">et jette encore plus.</span>
          </h1>
          <p className="text-base sm:text-lg text-gris-moyen">
            L&apos;industrie textile est l&apos;une des plus polluantes au monde, et l&apos;essentiel
            de son empreinte se joue au moment de la fabrication. C&apos;est ce qui rend la seconde
            main aussi efficace : faire porter une pièce une fois de plus coûte infiniment moins cher
            à la planète que d&apos;en fabriquer une nouvelle, même vertueuse.
          </p>
        </div>
      </section>

      {/* ================= LES CHIFFRES ================= */}
      <section className="bg-gris-clair px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-10 sm:mb-12 max-w-[620px]">
            <div className="eyebrow">Les chiffres</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">Ce que coûte notre garde-robe.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {CHIFFRES.map(({ icon: Icon, valeur, label, texte }) => (
              <div
                key={label}
                className="bg-gris-tres-clair border border-noir/10 p-8 flex flex-col gap-3"
              >
                <Icon className="h-7 w-7 text-sauge" strokeWidth={1.4} />
                <span className="font-serif text-4xl leading-none text-noir">{valeur}</span>
                <h3 className="text-lg leading-snug">{label}</h3>
                <p className="text-sm text-gris-moyen">{texte}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-gris-moyen">Sources détaillées en bas de page.</p>
        </div>
      </section>

      {/* ================= LE PRINCIPE ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start mb-14">
            <div className="flex flex-col gap-5 max-w-[560px]">
              <div className="eyebrow">Le principe</div>
              <h2 className="text-3xl sm:text-4xl leading-[1.18]">
                Utiliser chaque pièce jusqu&apos;au bout.
              </h2>
              <p className="text-base text-gris-moyen">
                L&apos;économie circulaire tient dans une idée simple : ce qui est déjà fabriqué doit
                servir le plus longtemps possible. Un vêtement porté jusqu&apos;à l&apos;usure
                amortit son impact sur toute sa durée de vie.
              </p>
              <p className="text-base text-gris-moyen">
                L&apos;enjeu n&apos;est donc pas seulement d&apos;acheter des pièces à faible impact,
                mais de faire circuler celles qui existent déjà — et elles sont innombrables dans nos
                placards.
              </p>
            </div>

            <div className="bg-gris-tres-clair border border-sauge-clair p-8">
              <span className="font-serif text-5xl leading-none text-sauge">÷ 4</span>
              <p className="mt-4 text-gris-moyen">
                L&apos;impact environnemental du textile pourrait être divisé par quatre si les
                vêtements étaient portés jusqu&apos;au bout de leur durée de vie, au lieu d&apos;être
                abandonnés après un quart de celle-ci.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7">
            {LEVIERS.map(({ icon: Icon, titre, texte }) => (
              <div
                key={titre}
                className="bg-gris-tres-clair border border-gris-clair p-8 flex flex-col gap-3.5"
              >
                <Icon className="h-7 w-7 text-sauge" strokeWidth={1.4} />
                <h3 className="text-xl">{titre}</h3>
                <p className="text-sm text-gris-moyen">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NOTRE ENGAGEMENT ================= */}
      <section className="bg-noir text-creme px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-12 max-w-[620px]">
            <div className="text-[10px] tracking-[0.26em] uppercase text-sauge-clair">
              Notre engagement
            </div>
            <h2 className="text-3xl sm:text-4xl text-creme leading-[1.18]">
              Ce à quoi on se tient.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {ENGAGEMENTS.map(({ icon: Icon, titre, texte }) => (
              <div key={titre} className="flex flex-col gap-3 border-t border-[#46523f] pt-6">
                <Icon className="h-7 w-7 text-sauge-clair" strokeWidth={1.4} />
                <h3 className="text-xl text-creme">{titre}</h3>
                <p className="text-sm text-[#b9c2b0]">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= APPEL À L'ACTION ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[720px] mx-auto text-center flex flex-col items-center gap-6">
          <div className="eyebrow">À votre tour</div>
          <h2 className="text-3xl sm:text-4xl leading-[1.18]">
            Votre dressing peut faire sa part.
          </h2>
          <p className="text-base text-gris-moyen max-w-[520px]">
            Chaque pièce que vous remettez en circulation est un vêtement neuf qui n&apos;est pas
            produit. C&apos;est là que se joue l&apos;essentiel.
          </p>
          <Link
            href="/demande-rdv"
            className="mt-2 bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
          >
            Demander un rendez-vous
          </Link>
        </div>
      </section>

      {/* ================= SOURCES ================= */}
      <section className="border-t border-noir/10 px-6 sm:px-10 lg:px-[76px] py-12">
        <div className="max-w-[820px] mx-auto">
          <div className="eyebrow mb-5">Sources</div>
          <ul className="flex flex-col gap-2 text-sm text-gris-moyen">
            {SOURCES.map((source) => (
              <li key={source} className="flex items-start gap-3">
                <span className="mt-[0.7em] h-px w-3 shrink-0 bg-sauge-clair" />
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

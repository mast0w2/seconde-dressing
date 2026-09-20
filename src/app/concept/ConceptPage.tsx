import Image from "next/image";
import Link from "next/link";
import {
  Gem,
  HeartHandshake,
  Wallet,
  RotateCcw,
  Scale,
  MapPin,
  Recycle,
  Eye,
  ShoppingBag,
  Users,
} from "lucide-react";

// ============================================================================
// Données
// ============================================================================

const ENGAGEMENTS = [
  { icon: Gem, texte: "Vos pièces valent au moins 15 € en seconde main." },
  {
    icon: HeartHandshake,
    texte:
      "Votre vendeuse gère tout : le tri, les photos, les annonces, les échanges et l'expédition.",
  },
  { icon: Wallet, texte: "Vous êtes payée sous 60 jours au plus tard après la vente." },
  {
    icon: RotateCcw,
    texte: "Ce qui ne se vend pas vous revient, ou part vers nos filières de réemploi.",
  },
];

const FORMULES = [
  {
    titre: "Dressing déjà trié",
    prix: "10 €",
    isFirstFree: true,
    texte:
      "Vos vêtements sont déjà mis de côté, et vous remplirez vous-même l'inventaire de vos pièces avant notre passage. On vient simplement les récupérer.",
  },
  {
    titre: "Tri sur place",
    prix: "30 €",
    isFirstFree: false,
    texte:
      "Vous avez mis de côté ce dont vous ne voulez plus, mais vous ne savez pas ce qui a de la valeur. On passe 30 min à 1 h chez vous pour trier et repérer les pièces qui se revendront.",
  },
  {
    titre: "Tri & conseil",
    prix: "50 €",
    isFirstFree: false,
    texte:
      "Rendez-vous d'1 h à 1 h 30 : on trie avec vous et on vous conseille — ce qui vaut le coup d'être vendu, ce qui vous va le mieux, ce que vous avez intérêt à garder.",
  },
];

const REPARTITION = [
  {
    part: "50 %",
    titre: "Pour vous",
    texte: "Votre part sur chaque pièce vendue, versée sur votre compte après la vente.",
  },
  {
    part: "40 %",
    titre: "Pour votre vendeuse",
    texte:
      "Elle se déplace, trie, photographie, rédige les annonces, répond aux acheteurs et expédie.",
  },
  {
    part: "10 %",
    titre: "Pour Seconde",
    texte: "La plateforme, le suivi de vos ventes, les paiements sécurisés et le service client.",
  },
];

const RAISONS = [
  {
    icon: Scale,
    titre: "Une rémunération juste",
    texte:
      "Chacun est payé pour ce qu'il apporte : vous pour vos vêtements, votre vendeuse pour son travail et son œil, Seconde pour l'outil qui fait tourner l'ensemble.",
  },
  {
    icon: MapPin,
    titre: "Un métier, près de chez vous",
    texte:
      "Nos vendeuses sont des professionnelles indépendantes qui travaillent dans leur quartier. Faire appel à Seconde, c'est faire vivre une activité locale.",
  },
  {
    icon: Recycle,
    titre: "Une garde-robe qui circule",
    texte:
      "Chaque pièce qui trouve preneuse, c'est un vêtement neuf qui n'est pas produit. C'est là que se joue l'essentiel de l'impact.",
  },
  {
    icon: Eye,
    titre: "Des comptes clairs",
    texte:
      "Vous savez où va chaque euro avant même de nous confier quoi que ce soit. Pas de frais découverts en cours de route.",
  },
];

const CIRCULARITE = [
  {
    icon: ShoppingBag,
    titre: "Vous vendez plutôt que de jeter",
    texte: "Des pièces qui dormaient retrouvent quelqu'un pour les porter.",
  },
  {
    icon: Recycle,
    titre: "Vous allégez votre empreinte",
    texte: "Un vêtement porté une seconde fois, c'est un vêtement neuf en moins.",
  },
  {
    icon: Users,
    titre: "Vous soutenez une activité locale",
    texte: "Votre dressing fait travailler quelqu'un près de chez vous.",
  },
];

// ============================================================================
// Page
// ============================================================================

export default function ConceptPage() {
  return (
    <div className="bg-creme text-noir">
      {/* ================= INTRODUCTION ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-10 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="eyebrow">Notre concept</div>
            <h1 className="text-4xl sm:text-5xl leading-[1.14]">
              Une mode plus durable,
              <br />
              <span className="italic text-sauge-fonce">et plus accessible.</span>
            </h1>
            <p className="text-base sm:text-lg text-gris-moyen max-w-[480px]">
              Vider son dressing prend du temps, demande de la méthode et un peu de flair. C&apos;est
              exactement ce qu&apos;on fait à votre place : une vendeuse vient chez vous, repère ce
              qui a de la valeur, et s&apos;occupe de la vente du début à la fin.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-x-[-28px] top-[28px] bottom-[-26px] bg-sauge-clair/45 rounded-xl" />
            <div className="relative w-full h-[290px] sm:h-[390px] rounded-xl overflow-hidden">
              <Image
                src="/concept-carton.jpg"
                alt="Une femme range des pulls pliés dans un carton Seconde"
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= LE SERVICE ================= */}
      <section className="bg-gris-clair px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-10 sm:mb-12 max-w-[620px]">
            <div className="eyebrow">Ce qu&apos;on fait pour vous</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">
              Un service complet, du tri jusqu&apos;au virement.
            </h2>
            <p className="text-base text-gris-moyen">
              Vous confiez vos pièces à une vendeuse. Elle s&apos;occupe de tout et vous tient au
              courant. Vous n&apos;avez ni annonce à rédiger, ni acheteur à gérer, ni colis à poster.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
            {ENGAGEMENTS.map(({ icon: Icon, texte }) => (
              <li key={texte} className="flex items-start gap-4 text-gris-moyen">
                <span className="flex h-[1.75em] shrink-0 items-center">
                  <Icon className="h-[18px] w-[18px] text-sauge" strokeWidth={1.3} />
                </span>
                <span>{texte}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= NOS FORMULES ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-10 sm:mb-12 max-w-[620px]">
            <div className="eyebrow">Nos formules</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">
              Vous choisissez le niveau d&apos;accompagnement.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7">
            {FORMULES.map(({ titre, prix, texte, isFirstFree }) => (
              <div
                key={titre}
                className="bg-gris-tres-clair border border-gris-clair p-8 flex flex-col gap-3"
              >
                {isFirstFree ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-4xl leading-none text-gris-moyen line-through">{prix}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-2xl leading-none text-sauge">Gratuit</span>
                      <span className="text-xs text-sauge font-medium">1ère commande</span>
                    </div>
                  </div>
                ) : (
                  <span className="font-serif text-4xl leading-none text-sauge">{prix}</span>
                )}
                <h3 className="text-xl">{titre}</h3>
                <p className="text-sm text-gris-moyen">{texte}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-base text-gris-moyen max-w-[620px]">
            Le prix du rendez-vous dépend de la formule choisie. C&apos;est le seul frais facturé :
            pas de coût caché.
          </p>
        </div>
      </section>

      {/* ================= RÉPARTITION ================= */}
      <section className="bg-gris-clair px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-10 sm:mb-12 max-w-[620px]">
            <div className="eyebrow">La répartition</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">Où va l&apos;argent de vos ventes.</h2>
            <p className="text-base text-gris-moyen">
              Sur chaque pièce vendue, le prix se partage toujours de la même façon. Vous savez
              exactement où va chaque euro avant même de nous confier quoi que ce soit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7">
            {REPARTITION.map(({ part, titre, texte }) => (
              <div
                key={titre}
                className="bg-gris-tres-clair border border-noir/10 p-8 flex flex-col gap-3"
              >
                <span className="font-serif text-5xl leading-none text-sauge">{part}</span>
                <h3 className="text-xl">{titre}</h3>
                <p className="text-sm text-gris-moyen">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= POURQUOI CE MODÈLE ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center flex flex-col items-center gap-3 mb-12">
            <div className="eyebrow">Pourquoi ce modèle</div>
            <h2 className="text-3xl sm:text-4xl">Ce qu&apos;il permet</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {RAISONS.map(({ icon: Icon, titre, texte }) => (
              <div
                key={titre}
                className="bg-gris-tres-clair border border-noir/10 p-8 flex flex-col gap-3.5"
              >
                <Icon className="h-7 w-7 text-sauge" strokeWidth={1.4} />
                <h3 className="text-xl">{titre}</h3>
                <p className="text-gris-moyen text-sm">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CIRCULARITÉ ================= */}
      <section className="bg-noir text-creme px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 mb-12 max-w-[620px]">
            <div className="text-[10px] tracking-[0.26em] uppercase text-sauge-clair">
              Économie circulaire
            </div>
            <h2 className="text-3xl sm:text-4xl text-creme leading-[1.18]">
              Le vêtement le plus écologique est celui qui existe déjà.
            </h2>
            <p className="text-[#b9c2b0]">
              L&apos;essentiel de l&apos;empreinte d&apos;un vêtement se joue à sa fabrication.
              Prolonger sa vie est donc le geste le plus efficace — bien avant le recyclage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {CIRCULARITE.map(({ icon: Icon, titre, texte }) => (
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
          <div className="eyebrow">On commence quand vous voulez</div>
          <h2 className="text-3xl sm:text-4xl leading-[1.18]">
            Prête à donner une seconde vie à votre dressing ?
          </h2>
          <p className="text-base text-gris-moyen max-w-[520px]">
            Quelques questions, moins d&apos;une minute, et on vous recontacte sous 24 heures pour
            caler le rendez-vous.
          </p>
          <Link
            href="/#appointment-request-form"
            className="mt-2 bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
          >
            Demander un rendez-vous
          </Link>
        </div>
      </section>
    </div>
  );
}

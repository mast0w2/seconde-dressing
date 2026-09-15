"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { capitalizeName } from "@/lib/text";
import { Users, Sparkles, Gem, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  conditionsAcceptees: boolean;
  formule: string;
  nombreVetements: number;
  valeurMoyenne: number;
  marques: string;
  description: string;
}

interface Critere {
  icon: LucideIcon;
  texte: string;
}

interface FormuleOption {
  id: string;
  titre: string;
  prix: string;
  description: string;
}

interface Question {
  id: keyof FormData;
  question: string;
  type: "text" | "email" | "tel" | "address" | "conditions" | "choice" | "slider" | "textarea";
  placeholder?: string;
  aide?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: FormuleOption[];
  criteres?: Critere[];
}

// ============================================================================
// Constants
// ============================================================================

const FORMULES: FormuleOption[] = [
  {
    id: "deja-trie",
    titre: "Dressing déjà trié",
    prix: "10 €",
    description:
      "Vos vêtements sont déjà mis de côté, et vous remplirez vous-même l'inventaire de vos pièces avant notre passage. On vient simplement les récupérer.",
  },
  {
    id: "tri-sur-place",
    titre: "Tri sur place",
    prix: "30 €",
    description:
      "Vous avez mis de côté ce dont vous ne voulez plus, mais vous ne savez pas ce qui a de la valeur. On passe 30 min à 1 h chez vous pour trier et repérer les pièces qui se revendront.",
  },
  {
    id: "tri-et-conseil",
    titre: "Tri & conseil",
    prix: "50 €",
    description:
      "Rendez-vous d'1 h à 1 h 30 : on trie avec vous et on vous conseille — ce qui vaut le coup d'être vendu, ce qui vous va le mieux, ce que vous avez intérêt à garder.",
  },
];

const QUESTIONS: Question[] = [
  {
    id: "prenom",
    question: "Quel est votre prénom ?",
    type: "text",
    placeholder: "Votre prénom",
    required: true,
  },
  {
    id: "nom",
    question: "Quel est votre nom ?",
    type: "text",
    placeholder: "Votre nom",
    required: true,
  },
  {
    id: "email",
    question: "Quelle est votre adresse email ?",
    type: "email",
    placeholder: "votre@email.com",
    required: true,
  },
  {
    id: "telephone",
    question: "Quel est votre numéro de téléphone ?",
    type: "tel",
    placeholder: "06 12 34 56 78",
    required: true,
  },
  {
    id: "adresse",
    question: "Quelle est votre adresse ?",
    type: "address",
    placeholder: "Commencez à taper votre adresse…",
    aide: "Pour l'instant, on se déplace à Paris et en proche banlieue.",
    required: true,
  },
  {
    id: "conditionsAcceptees",
    question: "Ce que l'on peut vendre pour vous",
    type: "conditions",
    criteres: [
      { icon: Users, texte: "Femme, homme et enfant — toutes les tailles." },
      {
        icon: Sparkles,
        texte: "Des pièces en bon état : rien de troué, taché, bouloché ou déformé.",
      },
      {
        icon: Gem,
        texte:
          "Une valeur d'au moins 15 € en seconde main par pièce : on recherche plutôt de belles matières et des marques premium — Sézane, Sandro, Ba&sh…",
      },
      {
        icon: Ban,
        texte: "Pas d'ultra fast fashion (Shein, Temu, Primark…) : ces pièces ne trouvent pas preneur.",
      },
    ],
    required: true,
  },
  {
    id: "formule",
    question: "Quelle formule vous correspond ?",
    type: "choice",
    options: FORMULES,
    required: true,
  },
  {
    id: "nombreVetements",
    question: "Combien de vêtements souhaitez-vous vendre ?",
    type: "slider",
    min: 1,
    max: 50,
    step: 1,
    unit: "",
    required: true,
  },
  {
    id: "valeurMoyenne",
    question: "Quelle est la valeur moyenne estimée par vêtement ?",
    type: "slider",
    min: 20,
    max: 200,
    step: 5,
    unit: "€",
    required: true,
  },
  {
    id: "marques",
    question: "Quelles sont les marques principales de vos vêtements ?",
    type: "text",
    placeholder: "Ex : Sézane, Sandro, Maje, The Kooples, Ba&sh, Zadig & Voltaire…",
    required: true,
  },
  {
    id: "description",
    question: "Une précision à ajouter ?",
    type: "textarea",
    placeholder: "Optionnel — tout ce qui peut nous aider à préparer le rendez-vous.",
    required: false,
  },
];

const PART_CLIENTE = 0.5;

// ============================================================================
// Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-()]{10,}$/;

function validateField(value: any, question: Question): string | null {
  if (question.required === false) {
    return null;
  }

  if (question.type === "conditions") {
    return value === true
      ? null
      : "Merci de confirmer que vos pièces correspondent à ces critères";
  }

  if (value === "" || value === null || value === undefined) {
    return "Ce champ est requis";
  }

  switch (question.type) {
    case "email":
      if (!EMAIL_REGEX.test(value)) return "L'email n'est pas valide";
      break;
    case "tel":
      if (!PHONE_REGEX.test(value)) return "Le numéro de téléphone n'est pas valide";
      break;
    case "address":
      if (String(value).trim().length < 5) return "Merci d'indiquer une adresse complète";
      break;
  }

  return null;
}

// Départements desservis aujourd'hui : Paris et proche banlieue.
const DEPARTEMENTS_DESSERVIS = ["75", "92", "93", "94"];

function estHorsZone(adresse: string): boolean {
  const codePostal = adresse.match(/\b(\d{5})\b/);
  if (!codePostal) return false;
  return !DEPARTEMENTS_DESSERVIS.includes(codePostal[1].slice(0, 2));
}

// ============================================================================
// API
// ============================================================================

async function submitForm(
  data: FormData
): Promise<{ success: boolean; message?: string; requestId?: string }> {
  try {
    const response = await fetch("/api/estimation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        conditionsAcceptees: data.conditionsAcceptees,
        formule: data.formule,
        nombreVetements: data.nombreVetements,
        valeurMoyenne: data.valeurMoyenne,
        marques: data.marques,
        description: data.description,
        estimation: data.nombreVetements * data.valeurMoyenne * PART_CLIENTE,
      }),
    });

    const result = await response.json();
    if (!response.ok) return { success: false, ...result };
    return { success: true, ...result };
  } catch (error) {
    console.error("[Estimation Form] Submission error:", error);
    return { success: false, message: "Une erreur est survenue. Veuillez réessayer." };
  }
}

// ============================================================================
// Champ adresse avec suggestions (Base Adresse Nationale — gratuit, sans clé)
// ============================================================================

interface Suggestion {
  label: string;
  context: string;
}

function AddressInput({
  value,
  onChange,
  placeholder,
  disabled,
  onValidate,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onValidate: () => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Mémorise l'adresse choisie dans la liste : tant que la valeur ne change pas,
  // on ne relance aucune recherche et la liste ne se rouvre pas.
  const pickedRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pickedRef.current === value) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    if (value.trim().length < 4) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?limit=5&q=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const json = await res.json();
        const items: Suggestion[] = (json.features || []).map((f: any) => ({
          label: f.properties.label as string,
          context: f.properties.context as string,
        }));
        setSuggestions(items);
        setIsOpen(items.length > 0);
      } catch {
        /* requête annulée ou réseau indisponible : on n'affiche simplement rien */
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (s: Suggestion) => {
    pickedRef.current = s.label;
    onChange(s.label);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && suggestions.length > 0) {
              pick(suggestions[0]);
            } else {
              onValidate();
            }
          }
          if (e.key === "Escape") setIsOpen(false);
        }}
        onFocus={() => {
          if (pickedRef.current !== value && suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full border border-noir bg-transparent rounded-none px-6 py-6 text-lg"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-gris-tres-clair border border-noir/20 max-h-64 overflow-auto">
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full text-left px-5 py-3 hover:bg-sauge-clair/40 transition-colors"
              >
                <span className="block text-noir">{s.label}</span>
                <span className="block text-xs text-gris-moyen">{s.context}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Composant principal
// ============================================================================

const EMPTY_FORM: FormData = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  conditionsAcceptees: false,
  formule: "",
  nombreVetements: 1,
  valeurMoyenne: 50,
  marques: "",
  description: "",
};

interface ProgressiveEstimationFormProps {
  onCompleteChange?: (isComplete: boolean) => void;
}

export function ProgressiveEstimationForm({ onCompleteChange }: ProgressiveEstimationFormProps = {}) {
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Option B : pas de mot de passe. À la validation, on envoie un lien de
  // connexion à l'adresse déjà saisie. La case est cochée par défaut.
  const [creerEspace, setCreerEspace] = useState(true);
  const [lienEnvoye, setLienEnvoye] = useState(false);
  // Vrai quand la visiteuse est déjà connectée : inutile de lui proposer un espace.
  const [dejaConnectee, setDejaConnectee] = useState(false);
  // True when the signed-in user is a seller: they cannot submit a request
  // (the form is for clients). They must create a separate client account.
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    onCompleteChange?.(isComplete);
  }, [isComplete, onCompleteChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setDejaConnectee(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!cancelled && profile?.role === "seller") {
        setIsSeller(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;

  const totalEstime = formData.nombreVetements * formData.valeurMoyenne;
  const versementEstime = totalEstime * PART_CLIENTE;

  const handleChange = (value: any) => {
    setFormData((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (errors[currentQuestion.id]) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: "" }));
    }
  };

  const validateStep = (): boolean => {
    const error = validateField(formData[currentQuestion.id], currentQuestion);
    if (error) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: error }));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (isSeller) return;
    if (!validateStep()) return;
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      // La demande part TOUJOURS en premier. La création de l'espace de suivi
      // ne doit jamais pouvoir empêcher l'envoi de la demande.
      const result = await submitForm(formData);
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.message || "Votre demande n'a pas pu être envoyée.",
          variant: "destructive",
        });
        return;
      }

      // Espace de suivi : un lien de connexion part vers l'adresse saisie.
      // Aucun mot de passe. Les informations du formulaire voyagent dans les
      // métadonnées du compte ; le profil est créé côté serveur au moment où
      // la cliente clique sur le lien (src/app/api/auth/callback/route.ts).
      if (creerEspace && !dejaConnectee) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: {
              first_name: capitalizeName(formData.prenom),
              last_name: capitalizeName(formData.nom),
              phone: formData.telephone,
              street_address: formData.adresse,
              role: "client",
            },
          },
        });
        if (otpError) {
          // La demande est enregistrée : on ne transforme pas cet échec en
          // erreur bloquante, on le dit simplement à la cliente.
          console.warn("[Estimation Form] Lien de connexion non envoyé :", otpError.message);
        } else {
          setLienEnvoye(true);
        }
      }

      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(EMPTY_FORM);
    setCurrentStep(0);
    setIsComplete(false);
    setErrors({});
    setLienEnvoye(false);
    setCreerEspace(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
  };

  // ---------- rendu du champ ----------
  const renderInput = () => {
    const value = formData[currentQuestion.id];

    switch (currentQuestion.type) {
      case "address":
        return (
          <div className="space-y-3">
            <AddressInput
              value={value as string}
              onChange={handleChange}
              placeholder={currentQuestion.placeholder}
              disabled={isSubmitting}
              onValidate={handleNext}
            />
            {estHorsZone(value as string) && (
              <p className="text-sm text-gris-moyen border-l-2 border-sauge-clair pl-4">
                On ne se déplace pas encore jusque chez vous. Laissez-nous quand même vos
                coordonnées : on vous préviendra dès qu&apos;on ouvre dans votre ville.
              </p>
            )}
          </div>
        );

      case "conditions":
        return (
          <div className="space-y-6">
            <ul className="space-y-4">
              {(currentQuestion.criteres || []).map(({ icon: Icon, texte }) => (
                <li key={texte} className="flex gap-4 text-gris-moyen">
                  <Icon
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sauge"
                    strokeWidth={1.3}
                  />
                  <span>{texte}</span>
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-3 border border-noir/20 bg-gris-tres-clair p-4 cursor-pointer hover:border-noir/50 transition-colors">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2e3a2c]"
              />
              <span className="text-sm text-noir">
                C&apos;est clair pour moi : les pièces que je souhaite vendre correspondent à ces
                critères.
              </span>
            </label>
          </div>
        );

      case "choice":
        return (
          <div className="grid grid-cols-1 gap-3">
            {(currentQuestion.options || []).map((option) => {
              const selected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleChange(option.id)}
                  className={`text-left border p-5 transition-colors ${
                    selected
                      ? "border-noir bg-sauge-clair/30"
                      : "border-noir/20 bg-gris-tres-clair hover:border-noir/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <span className="font-serif text-xl text-noir">{option.titre}</span>
                    <span className="text-[11px] tracking-[0.16em] uppercase text-sauge-fonce whitespace-nowrap">
                      {option.prix}
                    </span>
                  </div>
                  <p className="text-sm text-gris-moyen">{option.description}</p>
                </button>
              );
            })}
            <p className="text-sm text-gris-moyen">
              On confirme la formule ensemble lors de la prise de contact, une fois qu&apos;on a vu
              ce que vous avez. Si vos pièces ne correspondent pas, on vous le dit avant tout
              déplacement — et rien ne vous est facturé.
            </p>
          </div>
        );

      case "slider":
        return (
          <div className="space-y-4">
            <div onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}>
              <Slider
                value={[value as number]}
                onValueChange={(v) => handleChange(v[0])}
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gris-moyen">
              <span>{currentQuestion.min}{currentQuestion.unit}</span>
              <span className="font-serif text-2xl text-noir border border-noir px-6 py-2">
                {value}{currentQuestion.unit}
                {value === currentQuestion.max && currentQuestion.max === 50 ? "+" : ""}
              </span>
              <span>
                {currentQuestion.max}{currentQuestion.unit}
                {currentQuestion.max === 50 ? "+" : ""}
              </span>
            </div>
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            disabled={isSubmitting}
            rows={4}
            className="w-full p-6 border border-noir bg-transparent rounded-none focus:outline-none focus:border-sauge text-lg"
          />
        );

      default:
        return (
          <Input
            type={currentQuestion.type}
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            disabled={isSubmitting}
            className="w-full border border-noir bg-transparent rounded-none px-6 py-6 text-lg"
          />
        );
    }
  };

  const renderProgress = () => (
    <div className="mb-8">
      <div className="w-full bg-sauge-clair/40 h-px">
        <div
          className="bg-noir h-px transition-all duration-300"
          style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>
    </div>
  );

  // Estimation affichée sur l'étape de la valeur moyenne
  const renderEstimation = () => {
    if (currentQuestion.id !== "valeurMoyenne") return null;
    return (
      <div className="mt-6 border border-sauge-clair bg-gris-tres-clair p-5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-sauge-fonce mb-2">
          Ce que vous toucheriez
        </p>
        <p className="font-serif text-3xl text-noir">
          {versementEstime.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
        </p>
        <p className="mt-2 text-sm text-gris-moyen">
          {formData.nombreVetements} vêtement{formData.nombreVetements > 1 ? "s" : ""} ×{" "}
          {formData.valeurMoyenne} € ={" "}
          {totalEstime.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} € de ventes estimées,
          dont vous touchez 50 %. Estimation indicative, ajustée après le tri.
        </p>
      </div>
    );
  };

  if (isComplete) {
    return (
      <div className="w-full max-w-2xl space-y-8">
        {/* Confirmation : la demande a bien été envoyée (compte optionnel) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              ✅
            </span>
            <h3 className="font-serif text-3xl text-noir">Demande envoyée</h3>
          </div>
          <p className="text-gris-moyen">
            Merci {capitalizeName(formData.prenom)} ! Votre demande d’estimation a bien été enregistrée.
            Nous vous recontacterons sous 24 h pour valider la formule et organiser la collecte.
          </p>
          <div className="text-sm text-gris-moyen bg-gris-tres-clair p-4 border border-noir/10">
            <p className="mb-1">
              <span className="font-medium text-noir">{capitalizeName(formData.prenom)} {capitalizeName(formData.nom)}</span>
            </p>
            <p>{formData.email}</p>
            <p>{formData.telephone}</p>
            <p>{formData.adresse}</p>
          </div>
        </div>

        {/* Espace de suivi : aucun mot de passe, un lien envoyé par email. */}
        {dejaConnectee ? (
          <div className="border-t border-noir/10 pt-6 space-y-3">
            <p className="font-serif text-xl text-noir">Demande rattachée à votre espace</p>
            <p className="text-gris-moyen">
              Vous pouvez suivre son avancement depuis votre tableau de bord.
            </p>
          </div>
        ) : lienEnvoye ? (
          <div className="border-t border-noir/10 pt-6 space-y-3">
            <p className="font-serif text-xl text-noir">Votre espace de suivi vous attend</p>
            <p className="text-gris-moyen">
              Un email vient de partir vers{" "}
              <span className="text-noir">{formData.email}</span>. Cliquez sur le lien
              qu&apos;il contient pour accéder à votre espace et suivre l&apos;avancement de
              votre demande. Aucun mot de passe à retenir.
            </p>
            <p className="text-sm text-gris-moyen">
              Rien reçu au bout de quelques minutes ? Pensez à regarder dans vos indésirables.
            </p>
          </div>
        ) : null}

        <button
          onClick={handleReset}
          className="text-[11px] tracking-[0.18em] uppercase text-sauge-fonce hover:text-noir transition-colors"
        >
          ← Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {renderProgress()}

      <div className="space-y-4">
        {isSeller && (
          <p className="text-sm text-red-600">
            Vous êtes connectée en tant que vendeuse. Pour vendre vos propres
            vêtements, créez un autre compte client.
          </p>
        )}
        <h3 className="font-serif text-2xl sm:text-3xl text-noir">
          {currentQuestion.question}
        </h3>

        {currentQuestion.aide && (
          <p className="text-sm text-gris-moyen">{currentQuestion.aide}</p>
        )}

        <div>{renderInput()}</div>

        {errors[currentQuestion.id] && (
          <p className="text-sm text-destructive">{errors[currentQuestion.id]}</p>
        )}

        {renderEstimation()}

        {/* Dernière étape : proposition d'espace de suivi, sans champ à remplir.
            L'adresse email a déjà été saisie plus haut dans le formulaire. */}
        {isLastStep && !dejaConnectee && (
          <label className="flex items-start gap-3 cursor-pointer border border-noir/10 bg-gris-tres-clair p-5">
            <input
              type="checkbox"
              checked={creerEspace}
              onChange={(e) => setCreerEspace(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#6f7d62]"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-noir">
                Créer mon espace pour suivre ma demande
              </span>
              <span className="text-sm text-gris-moyen">
                Vous recevrez un lien de connexion à l&apos;adresse{" "}
                {formData.email || "que vous avez indiquée"} : un clic suffit, il n&apos;y a
                pas de mot de passe à créer.
              </span>
            </span>
          </label>
        )}

        <div className="flex items-center justify-between gap-4 pt-4">
          {currentStep > 0 ? (
            <button
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="text-[11px] tracking-[0.18em] uppercase text-sauge-fonce hover:text-noir transition-colors"
            >
              ← Précédent
            </button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting || isSeller}
              className="bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Envoi en cours…" : "Valider ma demande"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isSubmitting || isSeller}
              className="border border-noir px-7 py-4 text-[11px] tracking-[0.2em] uppercase text-noir hover:bg-noir hover:text-blanc transition-colors disabled:opacity-50"
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressiveEstimationForm;

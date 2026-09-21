"use client";

// Contrat de dépôt-vente d'une demande : lecture, signature de la partie
// connectée (cliente ou vendeuse) et impression.
//
// Le contrat n'existe qu'à partir du moment où la vendeuse a passé la demande
// en « Articles récupérés ». Si la vendeuse arrive ici sans contrat (ex. appel
// réseau échoué au changement de statut), elle peut le générer d'ici.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, CheckCircle, Clock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { SignaturePad } from "@/components/SignaturePad";
import { ContractSetupDialog, UNSOLD_CHOICE_LABEL } from "@/components/ContractSetupDialog";
import { fetchContract, generateContract, signContract, type ContractSetup } from "@/lib/contract-api";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import {
  contractArticles,
  contractRoleFor,
  formatContractDate,
  formatContractDateTime,
  isFullySigned,
  isSignedBy,
  partyFullName,
  type ContractRole,
} from "@/lib/contract";
import type { ContractParty, Profile, RequestContract } from "@/types/database";

interface ContractPageProps {
  requestId: string;
}

const ROLE_LABEL: Record<ContractRole, string> = {
  client: "la Déposante",
  seller: "la Vendeuse",
};

export default function ContractPage({ requestId }: ContractPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [contract, setContract] = useState<RequestContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Formulaire de signature
  const [signatureName, setSignatureName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const loadContract = useCallback(async () => {
    setContract(await fetchContract(requestId));
  }, [requestId]);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?redirect=/dashboard/contract/${requestId}`);
          return;
        }
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!profileData) {
          router.push("/signup");
          return;
        }
        const p = profileData as Profile;
        setProfile(p);
        setSignatureName(`${p.first_name} ${p.last_name}`.trim());
        // Une cliente arrivant ici directement (lien reçu) peut ne pas encore
        // être rattachée à sa demande : sans ça, le contrat lui est invisible.
        if (p.role === "client") await attachAnonymousRequests(supabase);
        await loadContract();
      } catch (error: any) {
        setLoadError(error.message || "Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [supabase, router, requestId, loadContract]);

  const handleSign = async () => {
    if (!contract || !signature) return;
    setIsSigning(true);
    try {
      const signed = await signContract(contract.id, signature, signatureName);
      setContract(signed);
      toast({
        title: "Contrat signé",
        description: isFullySigned(signed)
          ? "Les deux parties ont signé : le contrat est complet."
          : "Votre signature a été enregistrée. En attente de l'autre partie.",
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSigning(false);
    }
  };

  const handleGenerate = async (setup: ContractSetup) => {
    setGenerating(true);
    try {
      setContract((await generateContract(requestId, setup)).contract);
      setSetupOpen(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  const backHref = profile?.role === "seller" ? "/dashboard/seller" : "/dashboard/client";

  if (loadError || !profile) {
    return (
      <div className="container py-8 max-w-3xl">
        <p className="text-red-700">{loadError ?? "Une erreur est survenue."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={backHref}>Retour au tableau de bord</Link>
        </Button>
      </div>
    );
  }

  if (!contract) {
    const isSeller = profile.role === "seller";
    return (
      <div className="container py-8 max-w-3xl space-y-4">
        <Button variant="ghost" onClick={() => router.push(backHref)} className="h-10 w-10 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl">Contrat de dépôt-vente</h1>
        <p className="text-gris-moyen">
          {isSeller
            ? "Le contrat n'a pas encore été généré pour cette demande. Il ne peut l'être qu'une fois les articles récupérés."
            : "Le contrat sera disponible dès que la vendeuse aura confirmé la récupération de vos articles."}
        </p>
        {isSeller && (
          <>
            <Button onClick={() => setSetupOpen(true)}>Générer le contrat</Button>
            <ContractSetupDialog
              open={setupOpen}
              submitting={generating}
              onCancel={() => setSetupOpen(false)}
              onConfirm={handleGenerate}
            />
          </>
        )}
      </div>
    );
  }

  const role = contractRoleFor(contract, profile.id);
  const { content } = contract;
  const articles = contractArticles(content);
  const mySignatureDone = role ? isSignedBy(contract, role) : true;
  const fullySigned = isFullySigned(contract);
  const canSign = !!role && !mySignatureDone;

  return (
    <div className="container py-8 max-w-3xl">
      {/* En impression, on ne garde que le contrat lui-même. */}
      <style>{`@media print { nav, footer, .no-print { display: none !important; } body { background: #fff; } }`}</style>

      <div className="no-print flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(backHref)} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl">Contrat de dépôt-vente</h1>
            <p className="text-gris-moyen">Demande #{requestId.slice(0, 8)}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="shrink-0">
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      <article className="bg-blanc border border-noir/10 p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <header className="space-y-3">
          <div className="eyebrow">Seconde · Contrat de dépôt-vente</div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">Référence {content.reference}</h2>
            <span className="text-sm text-gris-moyen">
              Établi le {formatContractDate(content.generated_at)}
            </span>
          </div>
          <SignatureStatusBadge contract={contract} />
          <dl className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div>
              <dt className="eyebrow mb-1">Pièces confiées</dt>
              <dd className="text-noir">
                {content.items.count} pièce{content.items.count > 1 ? "s" : ""}
              </dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">Pièces invendues</dt>
              <dd className="text-noir">{UNSOLD_CHOICE_LABEL[content.unsold_items]}</dd>
            </div>
          </dl>
        </header>

        {/* Parties */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PartyBlock title="La Déposante (cliente)" party={content.client} />
          <PartyBlock title="La Vendeuse" party={content.seller} />
        </section>

        {/* Clauses */}
        <section className="space-y-6">
          {articles.map((article) => (
            <div key={article.title} className="space-y-2">
              <h3 className="text-lg">{article.title}</h3>
              {article.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-noir/80 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </section>

        {/* Signatures */}
        <section className="space-y-4 pt-4 border-t border-noir/10">
          <h3 className="text-lg">Signatures</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SignatureBlock
              title="La Déposante"
              name={content.client}
              signedAt={contract.client_signed_at}
              signature={contract.client_signature}
              signatureName={contract.client_signature_name}
            />
            <SignatureBlock
              title="La Vendeuse"
              name={content.seller}
              signedAt={contract.seller_signed_at}
              signature={contract.seller_signature}
              signatureName={contract.seller_signature_name}
            />
          </div>
        </section>
      </article>

      {/* Zone de signature de la partie connectée */}
      {canSign && role && (
        <section className="no-print mt-8 bg-gris-tres-clair border border-gris-clair p-6 sm:p-8 space-y-5">
          <div>
            <div className="eyebrow mb-2">Votre signature</div>
            <h2 className="text-2xl">Signer en tant que {ROLE_LABEL[role]}</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature-name">Nom complet</Label>
            <Input
              id="signature-name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <SignaturePad onChange={setSignature} disabled={isSigning} />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2e3a2c]"
            />
            <span className="text-sm text-noir">
              J&apos;ai lu le contrat ci-dessus et j&apos;en accepte l&apos;ensemble des clauses.
              Ma signature confirme la remise des pièces listées.
            </span>
          </label>

          <Button
            onClick={handleSign}
            disabled={isSigning || !signature || !accepted || signatureName.trim().length < 2}
          >
            {isSigning ? "Enregistrement…" : "Signer le contrat"}
          </Button>
        </section>
      )}

      {role && mySignatureDone && !fullySigned && (
        <p className="no-print mt-6 text-sm text-gris-moyen">
          Vous avez signé ce contrat. Il sera complet lorsque{" "}
          {role === "client" ? "la vendeuse" : "la cliente"} l&apos;aura signé à son tour.
        </p>
      )}
    </div>
  );
}

function SignatureStatusBadge({ contract }: { contract: RequestContract }) {
  if (isFullySigned(contract)) {
    return (
      <Badge className="bg-sauge/20 text-sauge-fonce gap-1">
        <CheckCircle className="h-3.5 w-3.5" />
        Signé par les deux parties
      </Badge>
    );
  }
  const waiting: string[] = [];
  if (!contract.client_signed_at) waiting.push("la cliente");
  if (!contract.seller_signed_at) waiting.push("la vendeuse");
  return (
    <Badge className="bg-sauge-clair/40 text-sauge-fonce gap-1">
      <Clock className="h-3.5 w-3.5" />
      En attente de signature de {waiting.join(" et ")}
    </Badge>
  );
}

function PartyBlock({ title, party }: { title: string; party: ContractParty }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="eyebrow mb-2">{title}</div>
      <div className="font-medium text-noir">{partyFullName(party) || "—"}</div>
      {party.email && <div className="text-gris-moyen">{party.email}</div>}
      {party.phone && <div className="text-gris-moyen">{party.phone}</div>}
      {party.address && <div className="text-gris-moyen">{party.address}</div>}
    </div>
  );
}

function SignatureBlock({
  title,
  name,
  signedAt,
  signature,
  signatureName,
}: {
  title: string;
  name: ContractParty;
  signedAt: string | null;
  signature: string | null;
  signatureName: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="eyebrow">{title}</div>
      <div className="text-sm font-medium text-noir">{signatureName ?? partyFullName(name)}</div>
      <div className="h-28 border border-noir/10 bg-white flex items-center justify-center">
        {signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signature} alt={`Signature de ${title}`} className="max-h-full max-w-full" />
        ) : (
          <span className="text-xs text-gris-moyen italic">Non signé</span>
        )}
      </div>
      {signedAt && (
        <div className="text-xs text-gris-moyen">
          Signé électroniquement le {formatContractDateTime(signedAt)}
        </div>
      )}
    </div>
  );
}

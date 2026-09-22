import { envoyerLienEspace } from "@/lib/auth/espace-link";

const signInWithOtp = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: { signInWithOtp: (...args: unknown[]) => signInWithOtp(...args) } }),
}));

describe("envoyerLienEspace", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const repondre = (statut: string, extra: Record<string, unknown> = {}) =>
    fetchMock.mockResolvedValue({ json: async () => ({ statut, ...extra }) });

  it("relaie l'envoi réussi de la route serveur", async () => {
    repondre("envoye", { premiereConnexion: true });

    await expect(envoyerLienEspace({ email: "a@b.fr" })).resolves.toEqual({
      statut: "envoye",
      premiereConnexion: true,
    });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("distingue un compte inconnu d'un échec technique", async () => {
    repondre("compte_inconnu");
    await expect(envoyerLienEspace({ email: "a@b.fr", creerCompte: false })).resolves.toEqual({
      statut: "compte_inconnu",
    });

    repondre("erreur");
    await expect(envoyerLienEspace({ email: "a@b.fr" })).resolves.toEqual({ statut: "echec" });
  });

  it("signale le plafond d'envois plutôt qu'une erreur générique", async () => {
    repondre("trop_de_demandes");
    await expect(envoyerLienEspace({ email: "a@b.fr" })).resolves.toEqual({
      statut: "trop_de_demandes",
    });
  });

  it("retombe sur Supabase quand la route serveur n'est pas configurée", async () => {
    repondre("indisponible");
    signInWithOtp.mockResolvedValue({ error: null });

    await expect(envoyerLienEspace({ email: "a@b.fr", prenom: "Anna" })).resolves.toEqual({
      statut: "envoye",
      premiereConnexion: true,
    });
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
  });

  it("traduit « signups not allowed » du repli en compte inconnu", async () => {
    repondre("indisponible");
    signInWithOtp.mockResolvedValue({
      error: { code: "otp_disabled", message: "Signups not allowed for otp", status: 422 },
    });

    await expect(envoyerLienEspace({ email: "a@b.fr", creerCompte: false })).resolves.toEqual({
      statut: "compte_inconnu",
    });
  });

  it("retombe sur Supabase si la route serveur est injoignable", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    signInWithOtp.mockResolvedValue({ error: null });

    await expect(envoyerLienEspace({ email: "a@b.fr" })).resolves.toEqual({
      statut: "envoye",
      premiereConnexion: true,
    });
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
  });
});

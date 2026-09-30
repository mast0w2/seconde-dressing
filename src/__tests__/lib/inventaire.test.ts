import { detecterMarque } from '@/lib/brands';
import {
  ORDRE_STATUTS,
  STATUTS,
  estVendue,
  estVerrouille,
  libelle,
  statutsProposables,
  venteAcquise,
} from '@/lib/item-status';
import { minPriceEditorFor } from '@/lib/formules';
import { montantCliente, montantPlateforme, montantVendeuse } from '@/lib/pricing';
import type { ItemStatus } from '@/types/database';

describe('detecterMarque', () => {
  it('reconnaît une marque au milieu d\'une description', () => {
    expect(detecterMarque('Blouse Claudie Pierlot soie taille 38')).toBe('Claudie Pierlot');
  });

  it('ignore les accents et la casse', () => {
    expect(detecterMarque('robe sezane noire')).toBe('Sézane');
  });

  it('préfère la marque la plus longue', () => {
    expect(detecterMarque('Polo Ralph Lauren rayé')).toBe('Polo Ralph Lauren');
  });

  it('ne se déclenche pas sur un mot qui contient seulement la marque', () => {
    expect(detecterMarque('pull cosy en laine')).toBeNull();
    expect(detecterMarque('sac zarafa')).toBeNull();
  });

  it('renvoie null sur une description vide', () => {
    expect(detecterMarque('')).toBeNull();
    expect(detecterMarque(null)).toBeNull();
  });
});

describe('statuts de pièce', () => {
  it('décrit les six statuts, côté vendeuse et côté cliente', () => {
    ORDRE_STATUTS.forEach((s) => {
      expect(STATUTS[s].label).toBeTruthy();
      expect(STATUTS[s].labelCliente).toBeTruthy();
    });
    expect(ORDRE_STATUTS).toHaveLength(6);
  });

  it('ne laisse choisir librement que le va-et-vient avec « invendable »', () => {
    // Chaque autre étape s'obtient par un geste qui a ses conditions :
    // l'envoi des prix demande une fiche complète, la mise en vente l'accord
    // de la cliente, la vente un prix, la finalisation une preuve.
    expect(statutsProposables('photos_taken')).toEqual(['photos_taken', 'unsellable']);
    expect(statutsProposables('on_sale')).toEqual(['on_sale', 'unsellable']);
    expect(statutsProposables('unsellable')).toEqual(['unsellable', 'photos_taken']);
  });

  it('ne propose jamais un statut qui a des conditions', () => {
    ORDRE_STATUTS.forEach((s) => {
      expect(statutsProposables(s)).not.toContain('awaiting_client');
      expect(statutsProposables(s)).not.toContain('sold');
      expect(statutsProposables(s)).not.toContain('finalized');
    });
  });

  it('ne propose plus rien sur une pièce sortie du remplissage', () => {
    expect(statutsProposables('awaiting_client')).toEqual([]);
    expect(statutsProposables('sold')).toEqual([]);
    expect(statutsProposables('finalized')).toEqual([]);
  });

  it('ne propose jamais « vente en cours » depuis le remplissage', () => {
    // La mise en vente découle de la validation des prix par la cliente :
    // la proposer ici laissait croire qu'on pouvait sauter cette étape.
    expect(statutsProposables('photos_taken')).not.toContain('on_sale');
  });

  it('ne propose plus rien sur une pièce finalisée', () => {
    expect(statutsProposables('finalized')).toEqual([]);
    expect(estVerrouille('finalized')).toBe(true);
    expect(estVerrouille('sold')).toBe(false);
  });

  it('compte comme vendue une pièce vendue ou finalisée', () => {
    expect(estVendue('sold')).toBe(true);
    expect(estVendue('finalized')).toBe(true);
    expect(estVendue('on_sale')).toBe(false);
    expect(estVendue('unsellable')).toBe(false);
  });

  it('ne dit pas la même chose à la cliente qu\'à la vendeuse', () => {
    expect(libelle('sold', 'seller')).toBe('Vendu');
    expect(libelle('awaiting_client', 'seller')).toBe('En attente de la cliente');
    expect(libelle('awaiting_client', 'client')).toBe('Prix à valider');
  });

  it('ne dit « vendue » à la cliente qu’une fois la vente acquise', () => {
    // « Vendu » côté vendeuse veut dire que l'acheteur a payé la plateforme ;
    // la vente peut encore se défaire. La cliente ne l'apprend qu'une fois
    // l'argent encaissé.
    expect(libelle('sold', 'client')).toBe('En vente');
    expect(libelle('on_sale', 'client')).toBe('En vente');
    expect(libelle('finalized', 'client')).toBe('Vendue — paiement en cours');
  });

  it('distingue la vente comptable de la vente acquise', () => {
    expect(estVendue('sold')).toBe(true);
    expect(venteAcquise('sold')).toBe(false);
    expect(venteAcquise('finalized')).toBe(true);
    expect(venteAcquise('on_sale')).toBe(false);
  });
});

describe('répartition', () => {
  // Règle du ticket : la répartition ne porte que sur le montant FINALISÉ.
  // Une pièce vendue mais pas encore payée n'est due à personne.
  const lignes: Array<{ statut: ItemStatus; prix: number }> = [
    { statut: 'finalized', prix: 40 },
    { statut: 'finalized', prix: 60 },
    { statut: 'sold', prix: 100 },
    { statut: 'on_sale', prix: 0 },
  ];

  const montantVendu = lignes
    .filter((l) => estVendue(l.statut))
    .reduce((s, l) => s + l.prix, 0);
  const montantFinalise = lignes
    .filter((l) => l.statut === 'finalized')
    .reduce((s, l) => s + l.prix, 0);

  it('sépare le montant vendu du montant finalisé', () => {
    expect(montantVendu).toBe(200);
    expect(montantFinalise).toBe(100);
  });

  it('répartit uniquement le montant finalisé', () => {
    expect(montantCliente(montantFinalise)).toBe(50);
    expect(montantVendeuse(montantFinalise)).toBe(40);
    expect(montantPlateforme(montantFinalise)).toBe(10);
  });

  it('totalise bien 100 % du montant finalisé', () => {
    const total =
      montantCliente(montantFinalise) +
      montantVendeuse(montantFinalise) +
      montantPlateforme(montantFinalise);
    expect(total).toBeCloseTo(montantFinalise, 10);
  });
});

describe('minPriceEditorFor', () => {
  // Dit à qui revient normalement la saisie, pas qui en a le droit : la
  // vendeuse peut toujours renseigner un prix minimal, c'est la validation
  // par la cliente qui le verrouille.
  it('confie le prix minimal à la cliente en formule « Déjà trié »', () => {
    expect(minPriceEditorFor('pre-sorted')).toBe('client');
  });

  it('le confie à la vendeuse pour toutes les autres formules', () => {
    expect(minPriceEditorFor('full-service')).toBe('seller');
    expect(minPriceEditorFor(null)).toBe('seller');
    expect(minPriceEditorFor(undefined)).toBe('seller');
  });
});

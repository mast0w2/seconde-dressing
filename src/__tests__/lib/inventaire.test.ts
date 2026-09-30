import { detecterMarque } from '@/lib/brands';
import {
  ORDRE_STATUTS,
  STATUTS,
  estVendue,
  estVerrouille,
  libelle,
  statutsProposables,
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
  it('décrit les cinq statuts, côté vendeuse et côté cliente', () => {
    ORDRE_STATUTS.forEach((s) => {
      expect(STATUTS[s].label).toBeTruthy();
      expect(STATUTS[s].labelCliente).toBeTruthy();
    });
    expect(ORDRE_STATUTS).toHaveLength(5);
  });

  it('ne propose ni « vendu » ni « finalisé » dans le menu déroulant', () => {
    // Les deux s'obtiennent par un geste explicite : le prix de vente pour
    // l'un, le justificatif de virement pour l'autre.
    ORDRE_STATUTS.forEach((s) => {
      expect(statutsProposables(s)).not.toContain('finalized');
    });
    expect(statutsProposables('photos_taken')).toEqual([
      'photos_taken',
      'on_sale',
      'unsellable',
    ]);
  });

  it('garde le statut courant dans la liste, sinon le menu afficherait du vide', () => {
    expect(statutsProposables('sold')).toContain('sold');
    expect(statutsProposables('sold')[0]).toBe('sold');
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
    expect(libelle('sold', 'client')).toBe('Vendue — paiement en cours');
    expect(libelle('finalized', 'client')).toBe('Vendue — vous avez été payée');
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
  it('confie le prix minimal à la cliente en formule « Déjà trié »', () => {
    expect(minPriceEditorFor('pre-sorted')).toBe('client');
  });

  it('le confie à la vendeuse pour toutes les autres formules', () => {
    expect(minPriceEditorFor('full-service')).toBe('seller');
    expect(minPriceEditorFor(null)).toBe('seller');
    expect(minPriceEditorFor(undefined)).toBe('seller');
  });
});

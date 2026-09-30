import { secteur } from '@/lib/secteur';

describe('secteur', () => {
  it('réduit une adresse parisienne à son arrondissement', () => {
    expect(secteur('12 rue Lemercier 75017 Paris')).toBe('Paris 17e');
    expect(secteur('105 Boulevard Murat 75016 Paris')).toBe('Paris 16e');
  });

  it('écrit « 1er » et non « 1e » pour le premier arrondissement', () => {
    expect(secteur('3 rue de Rivoli 75001 Paris')).toBe('Paris 1er');
  });

  it('donne la commune et le département ailleurs', () => {
    expect(secteur('4 avenue du Général Leclerc 92100 Boulogne-Billancourt')).toBe(
      'Boulogne-Billancourt (92)'
    );
  });

  it('ne laisse jamais filtrer le numéro ni la rue', () => {
    const resultat = secteur('12 rue Lemercier 75017 Paris');
    expect(resultat).not.toMatch(/Lemercier/);
    expect(resultat).not.toMatch(/12/);
  });

  it('préfère ne rien afficher plutôt qu’un fragment au hasard', () => {
    expect(secteur('quelque part')).toBeNull();
    expect(secteur('')).toBeNull();
    expect(secteur(null)).toBeNull();
  });

  it("gère un code postal hors Paris commençant par 75 (Seine-et-Marne)", () => {
    expect(secteur('1 rue des Champs 75890 Ailleurs')).toBe('Ailleurs (75)');
  });
});

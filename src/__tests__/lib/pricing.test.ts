import {
  REVENUE_SPLIT,
  PART_CLIENTE,
  PART_VENDEUSE,
  PART_PLATEFORME,
  formatShare,
  sharePercent,
  montantCliente,
  montantVendeuse,
  montantPlateforme,
} from "@/lib/pricing";

describe("pricing", () => {
  it("répartit toujours 100 % du prix de vente", () => {
    const total = PART_CLIENTE + PART_VENDEUSE + PART_PLATEFORME;
    expect(total).toBeCloseTo(1, 10);
    expect(Object.values(REVENUE_SPLIT).reduce((s, p) => s + p, 0)).toBeCloseTo(1, 10);
  });

  it("convertit une part en pourcentage", () => {
    expect(sharePercent(0.5)).toBe(50);
    expect(sharePercent(0.125)).toBe(12.5);
  });

  it("formate une part pour l'affichage", () => {
    expect(formatShare(PART_CLIENTE)).toBe(`${sharePercent(PART_CLIENTE)} %`);
    expect(formatShare(PART_CLIENTE, { compact: true })).toBe(`${sharePercent(PART_CLIENTE)}%`);
  });

  it("calcule des montants cohérents avec la répartition", () => {
    const totalVentes = 1000;
    expect(montantCliente(totalVentes)).toBeCloseTo(totalVentes * PART_CLIENTE, 10);
    expect(montantVendeuse(totalVentes)).toBeCloseTo(totalVentes * PART_VENDEUSE, 10);
    expect(montantPlateforme(totalVentes)).toBeCloseTo(totalVentes * PART_PLATEFORME, 10);

    const somme =
      montantCliente(totalVentes) + montantVendeuse(totalVentes) + montantPlateforme(totalVentes);
    expect(somme).toBeCloseTo(totalVentes, 10);
  });
});

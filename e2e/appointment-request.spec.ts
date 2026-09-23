import { test, expect } from '@playwright/test';

// /appointment-request est réservée aux clientes connectées (voir src/middleware.ts).
// Sans session Supabase dans le navigateur de test, le middleware redirige vers
// /login. Le comportement du formulaire lui-même est couvert par les tests Jest
// (src/__tests__/components/Form/AppointmentRequestForm.test.tsx).
test.describe('Appointment Request Flow', () => {
  test('should redirect unauthenticated users to login with a redirect param', async ({ page }) => {
    await page.goto('/appointment-request');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fappointment-request/);
    await expect(page.getByRole('heading', { name: "S'authentifier" })).toBeVisible();
  });

  test('should not render the protected form for visitors', async ({ page }) => {
    await page.goto('/appointment-request');

    await expect(page.getByRole('heading', { name: 'Demande de rendez-vous' })).toHaveCount(0);
    await expect(page.locator('input[placeholder="12 rue du Commerce, 75001 Paris"]')).toHaveCount(0);
  });
});

// Le parcours public passe par le formulaire progressif de la page d'accueil.
test.describe('Public Appointment Form (homepage)', () => {
  test('should show the request form section on the homepage', async ({ page }) => {
    await page.goto('/#appointment-request-form');

    const section = page.locator('#appointment-request-form');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Videz votre dressing sans effort' })).toBeVisible();
    await expect(section.getByRole('button', { name: /Suivant/ })).toBeVisible();
  });

  test('should block progression when the first step is left empty', async ({ page }) => {
    await page.goto('/#appointment-request-form');

    const section = page.locator('#appointment-request-form');
    const firstQuestion = await section.getByRole('heading', { level: 3 }).first().textContent();

    await section.getByRole('button', { name: /Suivant/ }).click();

    // Still on the same step: the question did not change.
    await expect(section.getByRole('heading', { level: 3 }).first()).toHaveText(firstQuestion ?? '');
  });
});

test.describe('Appointment Request - RLS Security', () => {
  test('should not expose any request data to unauthenticated visitors', async ({ page }) => {
    await page.goto('/dashboard/client');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="request-item"]')).toHaveCount(0);
  });
});

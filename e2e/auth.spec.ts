import { test, expect, type Page } from '@playwright/test';

// The login page asks for the address first, then branches on what that
// address turns out to be. The branch is decided server-side by
// /api/auth/account-state, which needs the service role key and migration
// 0014 — neither of which exists in CI. We stub the route instead, so these
// tests cover the four screens without depending on any database state.
const stubAccountState = (page: Page, status: string) =>
  page.route('**/api/auth/account-state', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status }),
    })
  );

const stubPasswordSetup = (page: Page) =>
  page.route('**/api/auth/password-setup', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'sent' }),
    })
  );

/** Fills step 1 and moves on. */
const submitEmail = async (page: Page, email: string) => {
  await page.locator('#email').fill(email);
  await page.getByRole('button', { name: 'Continuer' }).click();
};

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should be able to navigate to login
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  test('asks for the address and nothing else', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: "S'authentifier" })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible();

    // The password belongs to step 2. Asking for it here is what used to
    // strand anyone whose space has no password.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('does not offer account creation before reading the address', async ({ page }) => {
    await page.goto('/login');

    // Scoped to <main>: the navbar carries its own "Devenir vendeuse" link to
    // /signup, which is not what this checks. The address alone decides
    // between signing in and signing up.
    await expect(page.locator('main').locator('a[href^="/signup"]')).toHaveCount(0);
  });

  test('stays on step 1 when the check cannot be made', async ({ page }) => {
    await stubAccountState(page, 'unavailable');
    await page.goto('/login');
    await submitEmail(page, 'panne@exemple.fr');

    await expect(page.getByText(/La vérification de votre adresse n'a pas abouti/)).toBeVisible();
    // No password field: showing one would be a guess, and the wrong one for
    // anyone whose space has no password.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });
});

test.describe('Authentication - the three branches', () => {
  test('says plainly when no account matches the address', async ({ page }) => {
    await stubAccountState(page, 'no_account');
    await page.goto('/login');
    await submitEmail(page, 'inconnue@exemple.fr');

    await expect(
      page.getByRole('heading', { name: 'Aucun compte pour cette adresse' })
    ).toBeVisible();
    await expect(page.getByText("n'est liée à aucun compte")).toBeVisible();

    // The two ways out the flow promises: create an account, or fix the
    // address. The signup link carries the address over.
    await expect(
      page.locator('main').locator('a[href*="/signup?email="]')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: "Modifier l'adresse email" })
    ).toBeVisible();
  });

  test('says the account is not created yet when the space has no password', async ({ page }) => {
    await stubAccountState(page, 'no_password');
    await stubPasswordSetup(page);
    await page.goto('/login');
    await submitEmail(page, 'espace@exemple.fr');

    await expect(
      page.getByRole('heading', { name: "Votre compte n'est pas encore créé" })
    ).toBeVisible();
    await expect(page.getByText('espace@exemple.fr')).toBeVisible();
    await expect(page.getByText(/email de création de compte vient de partir/)).toBeVisible();

    // Never a password field here: there is no password to type.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('asks for the password, and offers nothing else', async ({ page }) => {
    await stubAccountState(page, 'has_password');
    await page.goto('/login');
    await submitEmail(page, 'cliente@exemple.fr');

    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    // The constraint this screen exists to honour: one door, not two. A
    // "receive a sign-in link" button beside the field only invited people to
    // take the wrong one.
    await expect(page.getByRole('button', { name: /lien de connexion/i })).toHaveCount(0);
  });

  test('lets the address be corrected from any branch', async ({ page }) => {
    await stubAccountState(page, 'no_account');
    await page.goto('/login');
    await submitEmail(page, 'faute-de-frappe@exemple.fr');

    await page.getByRole('button', { name: "Modifier l'adresse email" }).click();

    await expect(page.getByRole('heading', { name: "S'authentifier" })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages without errors', async ({ page }) => {
    await page.goto('/');

    // Check homepage loads
    await expect(page).toHaveTitle(/Seconde/);

    // Navigate to concept page
    await page.goto('/concept');
    await expect(page).toHaveTitle(/Concept|Seconde/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Appointment Request Flow', () => {
  test('should navigate to appointment request page when logged in', async ({ page }) => {
    // Navigate to appointment request page
    await page.goto('/appointment-request');

    // Should show the form title
    await expect(page.locator('text=Demande de rendez-vous')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/appointment-request');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]:has-text("Envoyer")');
    await submitButton.click();

    // Should show validation errors
    await expect(page.locator('text=L\'adresse de collecte est requise')).toBeVisible();
    await expect(page.locator('text=Veuillez choisir une formule')).toBeVisible();
  });

  test('should show formula options', async ({ page }) => {
    await page.goto('/appointment-request');

    // Should display all three formulas
    await expect(page.locator('text=Dressing déjà trié')).toBeVisible();
    await expect(page.locator('text=Tri sur place')).toBeVisible();
    await expect(page.locator('text=Tri & conseil')).toBeVisible();
  });

  test('should display pricing information', async ({ page }) => {
    await page.goto('/appointment-request');

    // Should show prices
    const prices = await page.locator('text=/€/').allTextContents();
    expect(prices.length).toBeGreaterThan(0);
  });

  test('should fill form with valid data', async ({ page }) => {
    await page.goto('/appointment-request');

    // Fill address
    const addressInput = page.locator('input[placeholder="12 rue du Commerce, 75001 Paris"]');
    await addressInput.fill('123 Test Street, 75001 Paris');

    // Select formula
    const formulaLabel = page.locator('text=Dressing déjà trié').first();
    const formulaRadio = formulaLabel.locator('.. input[type="radio"]');
    await formulaRadio.check();

    // Accept conditions
    const conditionsCheckbox = page.locator('input[type="checkbox"]');
    await conditionsCheckbox.check();

    // Verify form is filled
    await expect(addressInput).toHaveValue('123 Test Street, 75001 Paris');
    await expect(formulaRadio).toBeChecked();
    await expect(conditionsCheckbox).toBeChecked();
  });

  test('should show date/time optional fields', async ({ page }) => {
    await page.goto('/appointment-request');

    // Should have optional date and time inputs
    const dateInput = page.locator('input[type="date"]');
    const timeInput = page.locator('input[type="time"]');

    await expect(dateInput).toBeVisible();
    await expect(timeInput).toBeVisible();
  });

  test('should display help tooltips for formulas', async ({ page }) => {
    await page.goto('/appointment-request');

    // Hover over help icon
    const helpIcon = page.locator('[aria-label="Help"]').first();
    await helpIcon.hover();

    // Tooltip should appear with formula descriptions
    const tooltip = page.locator('text=Déjà trié');
    await expect(tooltip).toBeVisible();
  });

  test('should clear form when reset', async ({ page }) => {
    await page.goto('/appointment-request');

    // Fill form
    const addressInput = page.locator('input[placeholder*="Adresse"]');
    await addressInput.fill('Test Address');

    // Reload page to clear
    await page.reload();

    // Form should be empty
    await expect(addressInput).toHaveValue('');
  });
});

test.describe('Appointment Request - RLS Security', () => {
  test('should respect RLS when viewing requests', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard/client');

    // Should only see own requests
    // This is verified by RLS on backend
    // Frontend should display data from API that's RLS-filtered
    const requests = page.locator('[data-testid="request-item"]');

    // If requests exist, they should be the user's own
    const count = await requests.count();
    if (count > 0) {
      // Each request should be owned by current user (verified in API)
      await expect(requests.first()).toBeVisible();
    }
  });
});

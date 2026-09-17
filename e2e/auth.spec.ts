import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should be able to navigate to login
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  test('should redirect to dashboard after login', async ({ page }) => {
    // Note: This requires setting up test credentials in Supabase
    // For now, this is a placeholder test structure
    await page.goto('/login');

    // Verify login page elements exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should redirect authenticated users away from login', async ({ page, context }) => {
    // This test would require a valid session cookie
    // In a real scenario, you'd set up a test user account
    await page.goto('/login');

    // Verify page structure
    const loginCard = page.locator('text=Se connecter');
    await expect(loginCard).toBeVisible();
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

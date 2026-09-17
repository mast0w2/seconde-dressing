# 🧪 Guide des Tests - Seconde Dressing

## Vue d'ensemble

Ce projet utilise une stratégie de test multi-niveaux:
- **Jest + Testing Library**: Tests unitaires et de composants
- **Playwright**: Tests end-to-end (e2e)
- **ESLint**: Vérification de code

---

## 📝 Tests Unitaires (Jest)

### Exécuter les tests
```bash
npm test                 # Lancer tous les tests une fois
npm run test:watch      # Lancer en mode watch (re-run à chaque modification)
npm run test:coverage   # Générer un rapport de couverture
```

### Structure des tests
Les tests doivent être dans `src/__tests__/` avec l'extension `.test.ts` ou `.test.tsx`.

Exemple:
```
src/__tests__/
  ├── lib/
  │   └── text.test.ts
  ├── components/
  │   └── Button.test.tsx
  └── api/
      └── contact.test.ts
```

### Exemple de test unitaire
```typescript
// src/__tests__/lib/text.test.ts
import { capitalizeName } from '@/lib/text';

describe('capitalizeName', () => {
  it('should capitalize the first letter', () => {
    expect(capitalizeName('john')).toBe('John');
  });
});
```

---

## 🎭 Tests End-to-End (Playwright)

### Exécuter les tests e2e
```bash
npm run test:e2e        # Lancer tous les tests e2e (headless)
npm run test:e2e:ui     # Lancer avec UI interactive (meilleur pour développement)
```

### Structure des tests
Les tests e2e sont dans `e2e/` avec l'extension `.spec.ts`.

Exemple:
```
e2e/
  ├── auth.spec.ts          # Tests de connexion
  ├── appointment.spec.ts    # Tests de création de demande
  └── dashboard.spec.ts      # Tests du dashboard
```

### Exemple de test e2e
```typescript
// e2e/appointment.spec.ts
import { test, expect } from '@playwright/test';

test('should create an appointment request', async ({ page }) => {
  // Naviguer vers la page
  await page.goto('/appointment-request');
  
  // Remplir le formulaire
  await page.fill('input[placeholder="Adresse"]', '123 Rue Test');
  
  // Soumettre
  await page.click('button[type="submit"]');
  
  // Vérifier le succès
  await expect(page).toHaveURL('/dashboard/client');
});
```

---

## ✅ Linting

### Vérifier la qualité du code
```bash
npm run lint            # Vérifier les erreurs ESLint
```

---

## 🚀 Lancer tous les tests

```bash
npm run test:all        # Lint + tests unitaires + tests e2e
```

---

## 📋 Checklist de Test Avant Commit

Avant de committer des changements, assure-toi que:

- [ ] `npm run lint` passe (pas d'erreurs ESLint)
- [ ] `npm test` passe (tous les tests unitaires passent)
- [ ] `npm run test:e2e` passe (si tu as modifié des workflows)
- [ ] Les nouveaux composants ont des tests
- [ ] Les nouvelles API routes ont des tests

---

## 🎯 Écrire des Tests Efficaces

### Pour les Composants
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('button renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Pour les API Routes
```typescript
test('POST /api/contact returns 200', async () => {
  const res = await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify({
      name: 'John',
      email: 'john@test.com',
      message: 'Test message'
    })
  });
  expect(res.status).toBe(200);
});
```

### Pour les Workflows Complets (e2e)
```typescript
test('complete appointment flow', async ({ page }) => {
  // 1. Aller à la page
  await page.goto('/appointment-request');
  
  // 2. Remplir le formulaire
  await page.fill('input[id="address"]', '123 Rue Test');
  
  // 3. Soumettre
  await page.click('button[type="submit"]');
  
  // 4. Vérifier le résultat
  await expect(page).toHaveURL('/dashboard/client');
  await expect(page.locator('text=Demande envoyée')).toBeVisible();
});
```

---

## 🐛 Déboguer les Tests

### Jest
```bash
npm run test:watch    # Puis appuyer sur 'd' pour déboguer
```

### Playwright
```bash
npm run test:e2e:ui   # Ouverture l'UI interactive de Playwright
```

---

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)

---

## 🔄 Intégration Continue

À l'avenir, tu peux ajouter ces tests à GitHub Actions pour qu'ils s'exécutent automatiquement à chaque push/PR.

Exemple de workflow GitHub Actions:
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e
```

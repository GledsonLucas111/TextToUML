import { test, expect } from '@playwright/test';

test('removes previous SVG while generating, replaces it and clears it on error', async ({ page }) => {
  let release: () => void = () => {};
  let count = 0;
  await page.route('**/api/generate', async route => {
    count++;
    if (count === 2) await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ status: count === 3 ? 500 : 200, json: count === 3 ? { error: 'Falha de teste' } : { code: `classDiagram\nclass ${count === 1 ? 'Cliente' : 'Pedido'} {\n+String nome\n}` } });
  });
  await page.goto('/');
  await page.getByLabel('Requisito do sistema').fill('Um cliente possui nome');
  await page.getByRole('button', { name: 'Gerar diagrama', exact: true }).click();
  await expect(page.locator('.diagram-svg svg')).toContainText('Cliente');
  await page.getByRole('button', { name: 'Gerar diagrama', exact: true }).click();
  await expect(page.locator('.diagram-svg svg')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Gerando');
  release();
  await expect(page.locator('.diagram-svg svg')).toContainText('Pedido');
  await expect(page.locator('.diagram-svg svg')).toHaveCount(1);
  await expect(page.locator('.diagram-svg svg')).not.toContainText('Cliente');
  await page.getByRole('button', { name: 'Gerar diagrama', exact: true }).click();
  await expect(page.locator('.preview-body').getByRole('alert')).toContainText('Falha de teste');
  await expect(page.locator('.diagram-svg svg')).toHaveCount(0);
});

test('zooms, drags and fits a large diagram without overflowing the page', async ({ page }) => {
  await page.route('**/api/generate', route => route.fulfill({ json: { code: 'classDiagram\n' + Array.from({ length: 15 }, (_, i) => `class Classe${i} {\n+String propriedade\n}`).join('\n') } }));
  await page.goto('/');
  await page.getByLabel('Requisito do sistema').fill('Diagrama grande');
  await page.getByRole('button', { name: 'Gerar diagrama', exact: true }).click();
  const svg = page.locator('.diagram-svg svg');
  await expect(svg).toBeVisible();
  const before = await svg.boundingBox();
  await page.getByRole('button', { name: 'Aumentar zoom' }).click();
  await expect.poll(async () => (await svg.boundingBox())!.width).toBeGreaterThan(before!.width);
  const viewport = page.getByRole('region', { name: 'Diagrama interativo' });
  const box = (await viewport.boundingBox())!;
  const start = (await svg.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 100, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await svg.boundingBox())!.x).toBeGreaterThan(start.x + 40);
  await page.getByRole('button', { name: 'Ajustar à tela' }).click();
  await expect.poll(async () => Math.abs((await svg.boundingBox())!.width - before!.width)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

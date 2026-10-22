import { expect, test } from '@playwright/test';

test('sitemap.xml liệt kê các trang chi tiết', async ({ request }) => {
  const response = await request.get('/sitemap.xml');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('xml');
  const body = await response.text();
  expect(body).toContain('/tuyen-thu/');
});

test('robots.txt chặn khu vực quản trị', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('Disallow: /admin');
});

test('trang chi tiết có canonical và JSON-LD', async ({ page }) => {
  await page.goto('/tuyen-thu/lai-bang');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/tuyen-thu\/lai-bang$/
  );

  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts.first()).toBeAttached();
  const data = await scripts.evaluateAll((nodes) =>
    nodes.map((node) => JSON.parse(node.textContent ?? '{}') as Record<string, unknown>)
  );
  expect(data.map((item) => item['@type'])).toEqual(
    expect.arrayContaining(['Person', 'BreadcrumbList'])
  );
});

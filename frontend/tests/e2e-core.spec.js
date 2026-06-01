const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'expectexception@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'OneMoreGift@2026';

async function adminLogin(page) {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Access Dashboard' }).click();
  await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
}

test('core e2e: admin login + giveaway + user login/join + winner visible', async ({ browser }) => {
  test.setTimeout(180000);

  const stamp = Date.now();
  const giveawayTitle = `TEST-E2E-${stamp}`;
  const userName = `e2e_user_${stamp}`;
  const userEmail = `e2e_${stamp}@test.com`;
  const userPhone = `9${String(stamp).slice(-9)}`;

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminLogin(adminPage);
  await adminPage.goto(`${BASE_URL}/admin/dashboard/add`);

  await adminPage.fill('#title', giveawayTitle);
  await adminPage.fill('#desc', 'Playwright lifecycle verification giveaway.');
  await adminPage.fill('#winners', '1');
  await adminPage.fill('#maxp', '10');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const asDate = (d) => d.toISOString().split('T')[0];

  await adminPage.fill('input[type="date"] >> nth=0', asDate(yesterday));
  await adminPage.fill('input[type="date"] >> nth=1', asDate(tomorrow));
  await adminPage.fill('[data-testid="time-picker-input-start-chronology"]', '09:00');
  await adminPage.fill('[data-testid="time-picker-input-termination-date"]', '23:30');
  await adminPage.fill('#prize', 'E2E Test Prize');
  await adminPage.fill('#prizeValue', '999');

  await adminPage.getByRole('button', { name: 'Create Giveaway' }).click();
  await adminPage.waitForURL('**/admin/dashboard/giveaways', { timeout: 30000 });

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();

  await userPage.goto(`${BASE_URL}/register`);
  await userPage.fill('#name', userName);
  await userPage.fill('#phone', userPhone);
  await userPage.fill('#email', userEmail);
  await userPage.fill('#password', 'UserPass123!');
  await userPage.getByRole('button', { name: 'Create Account' }).click();
  await userPage.locator('label').filter({ hasText: 'I have read and accept Terms' }).locator('button').click();
  await userPage.getByRole('button', { name: 'Continue' }).click();
  await userPage.waitForURL((url) => {
    const path = url.pathname;
    return path === '/' || path === '/my-profile';
  }, { timeout: 30000 });

  await userPage.goto(`${BASE_URL}/giveaway`);
  const giveawayCard = userPage.locator('.giveaway-card').filter({ hasText: giveawayTitle }).first();
  await expect(giveawayCard).toBeVisible({ timeout: 20000 });
  await giveawayCard.getByRole('button', { name: 'Enter Now' }).click();
  await userPage.waitForURL('**/giveaway/**', { timeout: 15000 });

  await userPage.getByRole('button', { name: 'Enter Now' }).first().click();
  await userPage.waitForURL('**/giveaway/**/join', { timeout: 15000 });

  await userPage.locator('button:has-text("Next")').last().click();
  await userPage.waitForSelector('input[placeholder="Address Line 1"]', { timeout: 10000 });

  await userPage.fill('input[placeholder="Address Line 1"]', '221B Baker Street');
  await userPage.selectOption('select >> nth=0', 'IN');
  await userPage.waitForFunction(() => {
    const selects = document.querySelectorAll('select');
    const stateSelect = selects[1];
    if (!stateSelect) return false;
    return Array.from(stateSelect.options).some((o) => o.value);
  });
  await userPage.selectOption('select >> nth=1', { index: 1 });
  await userPage.fill('input[placeholder="Pincode / Zipcode"]', '110001');
  await userPage.locator('button:has-text("Next")').last().click();

  await userPage.route('**/api/verify-captcha', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await userPage.waitForSelector('altcha-widget', { timeout: 10000 });
  await userPage.evaluate(() => {
    const widget = document.querySelector('altcha-widget');
    if (widget) {
      widget.dispatchEvent(new CustomEvent('verified', { detail: { payload: 'e2e-payload' } }));
    }
  });

  await userPage.getByRole('button', { name: 'Submit Entry' }).click();
  await userPage.waitForURL('**/thank-you', { timeout: 30000 });

  await adminPage.goto(`${BASE_URL}/admin/dashboard/giveaways`);
  const row = adminPage.locator('tr', { hasText: giveawayTitle }).first();
  await row.locator('button').first().click();
  await adminPage.waitForURL('**/admin/dashboard/giveaways/**', { timeout: 15000 });

  await adminPage.getByRole('button', { name: 'Set Winners' }).click();
  await adminPage.getByRole('button', { name: 'Confirm Winners' }).click();

  await userPage.goto(`${BASE_URL}/winners`);
  const winnersGrid = userPage.getByTestId('winners-grid');
  await expect(winnersGrid).toContainText(giveawayTitle);
  await expect(winnersGrid).toContainText(userName);

  await adminContext.close();
  await userContext.close();
});

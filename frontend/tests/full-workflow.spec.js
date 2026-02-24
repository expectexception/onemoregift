const { test, expect } = require('@playwright/test');

test.describe('Dorrka Full Workflow Verification', () => {
    const ADMIN_EMAIL = 'expectexception@gmail.com';
    const ADMIN_PASSWORD = 'Admin@123';
    const BASE_URL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        // Boost timeout for slower local environments
        test.setTimeout(60000);
        await page.goto(BASE_URL);
    });

    test('Administrator: Authentication and Sidebar Interactivity', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin`);

        // Wait for hydration
        await page.waitForSelector('input[id="email"]');

        // Login
        await page.fill('input[id="email"]', ADMIN_EMAIL);
        await page.fill('input[id="password"]', ADMIN_PASSWORD);
        await page.click('button:has-text("Access Dashboard")');

        // Wait for navigation with extended timeout
        await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 15000 });
        await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
        console.log('✅ Admin Login Passed');

        // Sidebar Interactivity
        const toggle = page.locator('#sidebar-toggle');
        await expect(toggle).toBeVisible();

        // Collapse Sidebar
        await toggle.click();
        await page.waitForTimeout(500); // Wait for transition
        const sidebar = page.locator('aside, .relative.flex.flex-col').first();
        await expect(sidebar).toHaveClass(/w-\[80px\]/);

        // Expand Sidebar
        await toggle.click();
        await page.waitForTimeout(500);
        await expect(sidebar).toHaveClass(/w-\[260px\]/);

        console.log('✅ Sidebar Interactivity Passed');
    });

    test('Administrator: Create Giveaway with Premium UI', async ({ page }) => {
        // Combined login and action to ensure state
        await page.goto(`${BASE_URL}/admin`);
        await page.fill('input[id="email"]', ADMIN_EMAIL);
        await page.fill('input[id="password"]', ADMIN_PASSWORD);
        await page.click('button:has-text("Access Dashboard")');
        await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 15000 });

        await page.click('a:has-text("Add Giveaway")');
        await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard/add`);

        const eventTitle = `E2E-TEST-${Date.now()}`;
        await page.fill('input[id="title"]', eventTitle);
        await page.fill('input[id="desc"]', 'Verify premium form flow and time picker.');

        await page.fill('input[id="winners"]', '1');
        await page.fill('input[id="maxp"]', '50');

        const now = new Date();
        const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
        const startStr = now.toISOString().split('T')[0];
        const endStr = future.toISOString().split('T')[0];

        await page.fill('input[type="date"] >> nth=0', startStr);
        await page.fill('input[type="date"] >> nth=1', endStr);

        // TimePicker: Start Chronology
        await page.click('[data-testid="time-picker-trigger-start-chronology"]');
        const startDialog = page.locator('div[role="dialog"]').filter({ visible: true });
        await startDialog.waitFor({ state: 'visible' });
        await startDialog.locator('button:has-text("09")').click();
        await startDialog.locator('button:has-text("30")').click();
        await startDialog.locator('button:has-text("Confirm")').click();

        // TimePicker: Termination Date
        await page.click('[data-testid="time-picker-trigger-termination-date"]');
        const endDialog = page.locator('div[role="dialog"]').filter({ visible: true });
        await endDialog.waitFor({ state: 'visible' });
        await endDialog.locator('button:has-text("18")').click();
        await endDialog.locator('button:has-text("00")').click();
        await endDialog.locator('button:has-text("Confirm")').click();
        await page.waitForTimeout(500); // Wait for popover closure

        await page.fill('input[id="prize"]', 'Test Prize Asset');
        await page.fill('input[id="prizeValue"]', '10000');

        console.log('✅ Admin Form Fill Passed');
    });

    test('User: Registration Flow and Terms Acceptance', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);
        await page.waitForSelector('input[id="name"]');

        const randomId = Math.floor(Math.random() * 10000);
        await page.fill('input[id="name"]', `u_${randomId}`);
        await page.fill('input[id="phone"]', `98765${randomId.toString().padStart(5, '0')}`);
        await page.fill('input[id="email"]', `testuser_${randomId}@example.com`);
        await page.fill('input[id="password"]', 'UserPass123!');

        // Terms Acceptance
        await page.click('button:has-text("Terms & Conditions")');

        // Wait for modal and use evaluation for reliable scroll
        await page.waitForSelector('.custom-scrollbar');
        await page.evaluate(() => {
            const scrolls = document.querySelectorAll('.custom-scrollbar');
            const modalScroll = scrolls[scrolls.length - 1]; // Assume last one is the modal
            if (modalScroll) {
                modalScroll.scrollTop = modalScroll.scrollHeight;
            }
        });

        const acceptBtn = page.locator('button:has-text("I Agree to Terms")');
        await page.waitForTimeout(1000); // Wait for scroll state to trigger
        await expect(acceptBtn).toBeEnabled();
        await acceptBtn.click();

        console.log('✅ Terms Acceptance Flow Passed');
    });

    test('Public: Home Page and Navigation', async ({ page }) => {
        await page.goto(BASE_URL);

        // Specific selector to avoid ambiguity
        const brand = page.locator('nav').getByText('OneMoreGift').first();
        await expect(brand).toBeVisible();

        // Navigation links
        await page.locator('nav').getByText('Winners').click();
        await expect(page).toHaveURL(`${BASE_URL}/winners`);

        console.log('✅ Public Navigation Passed');
    });
});

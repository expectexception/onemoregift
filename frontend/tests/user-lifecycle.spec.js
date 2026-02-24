const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Dorrka Full Event Lifecycle (User & Admin)', () => {
    const ADMIN_EMAIL = 'expectexception@gmail.com';
    const ADMIN_PASSWORD = 'Admin@123';
    const BASE_URL = 'http://localhost:3000';

    let eventTitle = `LIFECYCLE-TEST-${Date.now()}`;
    let testUserEmail = `user_${Date.now()}@test.com`;
    let testUserName = `Tester_${Date.now()}`;
    let testUserPhone = `9${Math.floor(Math.random() * 900000000 + 100000000)}`;

    test('Full E2E Lifecycle: Create -> Join -> Select -> Verify', async ({ page }) => {
        test.setTimeout(120000);

        // Disable animations and transitions for stability in headless mode
        await page.addInitScript(() => {
            const inject = () => {
                if (!document.head) {
                    setTimeout(inject, 10);
                    return;
                }
                const style = document.createElement('style');
                style.innerHTML = `
                    *, *::before, *::after {
                        transition: none !important;
                        animation: none !important;
                        transition-duration: 0ms !important;
                        animation-duration: 0ms !important;
                    }
                `;
                document.head.appendChild(style);
            };
            inject();
        });

        // Debugging: Capture console logs and errors
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

        // 1. ADMIN: Create Giveaway
        await page.goto(`${BASE_URL}/admin`);
        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASSWORD);
        await page.click('button:has-text("Access Dashboard")');
        await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

        await page.click('a:has-text("Add Giveaway")');
        await page.waitForLoadState('networkidle');

        await page.fill('#title', eventTitle);
        await page.fill('#desc', 'E2E testing of the full user participation and winner flow.');

        // Image Upload
        const absoluteImagePath = path.join(__dirname, '../public/images/crown.png');
        await page.setInputFiles('input[type="file"]', absoluteImagePath);
        await page.waitForTimeout(1000); // Wait for upload and toast

        const now = new Date();
        const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
        await page.fill('input[type="date"] >> nth=0', now.toISOString().split('T')[0]);
        await page.fill('input[type="date"] >> nth=1', future.toISOString().split('T')[0]);

        // Precision Time Selection: Bypassing UI Popover for stability
        console.log('--- Setting Start Time (Programmatic) ---');
        await page.fill('[data-testid="time-picker-input-start-chronology"]', '09:30');
        await page.waitForTimeout(500);

        console.log('--- Setting Termination Time (Programmatic) ---');
        await page.fill('[data-testid="time-picker-input-termination-date"]', '18:00');
        await page.waitForTimeout(500);

        await page.fill('#winners', '1');
        await page.fill('#maxp', '10');
        await page.fill('#prize', 'Matrix Glory Asset');
        await page.fill('#prizeValue', '5000');

        await page.screenshot({ path: 'debug-pre-deployment.png' });
        console.log('--- Attempting Initiate Deployment ---');

        // Ensure we are at the bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const deployBtn = page.getByRole('button', { name: 'Initiate Deployment' });
        await expect(deployBtn).toBeEnabled();
        await deployBtn.click({ force: true });
        console.log('--- Clicked Initiate Deployment ---');

        await page.waitForURL('**/admin/dashboard/giveaways', { timeout: 30000 });
        console.log('✅ Admin: Giveaway Created');

        // 2. USER: Register
        await page.context().clearCookies();
        await page.goto(`${BASE_URL}/register`);
        await page.fill('#name', testUserName);
        await page.fill('#phone', testUserPhone);
        await page.fill('#email', testUserEmail);
        await page.fill('#password', 'UserPass123!');

        await page.click('button:has-text("Terms & Conditions")');
        await page.waitForSelector('.custom-scrollbar');
        await page.evaluate(() => {
            const scrolls = document.querySelectorAll('.custom-scrollbar');
            const modalScroll = scrolls[scrolls.length - 1];
            if (modalScroll) modalScroll.scrollTop = modalScroll.scrollHeight;
        });
        await page.waitForTimeout(1000);
        await page.click('button:has-text("I Agree to Terms")');
        await page.click('button:has-text("Create Account")');

        await page.waitForURL(BASE_URL + '/', { timeout: 15000 });
        await page.waitForLoadState('networkidle');
        console.log('✅ User: Registered');

        // 3. USER: Join Giveaway
        await page.goto(`${BASE_URL}/giveaway`);
        await page.waitForLoadState('networkidle');

        // Find the specific card for this event
        const card = page.locator('.giveaway-card').filter({ hasText: eventTitle }).first();

        // If not immediately visible, it might be in the carousel
        if (!(await card.isVisible())) {
            console.log('--- Card not immediately visible, navigating carousel ---');
            const nextBtn = page.locator('button.carousel-next'); // Usually part of a carousel
            while (!(await card.isVisible()) && (await nextBtn.isVisible())) {
                await nextBtn.click();
                await page.waitForTimeout(500);
            }
        }

        await expect(card).toBeVisible({ timeout: 15000 });
        await card.locator('button:has-text("Enter Now")').click();

        await page.waitForURL('**/giveaway/**', { timeout: 10000 });
        await page.click('button:has-text("Enter Now")');

        // Step 1: Details
        await page.fill('input[name="name"]', testUserName);
        await page.fill('input[name="phone"]', testUserPhone);
        await page.fill('input[name="email"]', testUserEmail);
        await page.click('button:has-text("Next")');

        // Step 2: Address
        await page.fill('textarea[name="address"]', '123 E2E Street, Cyber City');
        await page.click('button:has-text("Next")');

        // Step 3: CAPTCHA (Bypass logic)
        await page.route('**/api/verify-captcha', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        // Force join via programmatic interaction
        console.log('--- Triggering Final Submission ---');
        await page.waitForTimeout(2000); // Wait for profile update toast and state sync

        const submitVisible = await page.getByRole('button', { name: 'Submit Entry' }).isVisible();
        const submitEnabled = await page.getByRole('button', { name: 'Submit Entry' }).isEnabled();
        console.log(`--- Submit Button Visible: ${submitVisible}, Enabled: ${submitEnabled} ---`);

        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Entry'));
            if (btn) btn.click();
            else console.log('Final Submit Button NOT FOUND in DOM');
        });

        await page.waitForURL('**/thank-you', { timeout: 30000 });
        console.log('✅ User: Joined Giveaway');

        // 4. ADMIN: Select Winners
        await page.context().clearCookies();
        await page.goto(`${BASE_URL}/admin`);
        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASSWORD);
        await page.click('button:has-text("Access Dashboard")');
        await page.waitForURL('**/admin/dashboard');

        await page.click('a:has-text("Giveaways")');
        const row = page.locator('tr').filter({ hasText: eventTitle });
        await row.locator('button').filter({ has: page.locator('svg') }).first().click();

        // Click Set Winners
        await page.click('button:has-text("Set Winners")');
        const confirmBtn = page.locator('button:has-text("Confirm Winners")');
        await confirmBtn.waitFor({ state: 'visible' });
        await confirmBtn.click();
        console.log('✅ Admin: Winners Selected');

        // 5. USER/PUBLIC: Verify Registry
        await page.goto(`${BASE_URL}/winners`);
        await page.waitForSelector('[data-testid="winners-grid"]');

        // Check if the giveaway card exists
        const giveawayCard = page.locator(`[data-testid="winners-grid"]`).filter({ hasText: eventTitle });
        await expect(giveawayCard).toBeVisible();

        // Check if the user name exists within that card
        await expect(giveawayCard.locator(`text=${testUserName}`)).toBeVisible();
        console.log('✅ FINAL: User Verified in Winners Registry');
    });
});

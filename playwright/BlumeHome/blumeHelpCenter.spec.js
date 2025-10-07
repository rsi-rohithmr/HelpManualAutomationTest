const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const { Login } = require('../POM/login');
const { Blume } = require('../POM/blumePage/blume');

test.describe('Blume Help Center with POM', () => {
	let page;
	let browserContext;
	let poManager;
	let blume;

	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
		});
		page = await browserContext.newPage();

		const login = new Login(page);
		poManager = new POManager(page);
		blume = new Blume(page);

		// Login to the system
		await poManager.loginPage.loginBlume();
	});

	test.afterAll(async () => {
		await browserContext.close();
	});

	test('Check redirect to help page using POM Blume class', async () => {
		// Wait for Blume page to load
		await page.waitForLoadState('load');

		// Use helpNvg() method from Blume class
		const helpButton = blume.helpNvg();
		await expect(helpButton).toBeVisible({ timeout: 10000 });

		// Wait for redirect to new page
		const [newPage] = await Promise.all([page.context().waitForEvent('page'), helpButton.click()]);

		// Check that new page opened
		expect(newPage).toBeTruthy();

		// Wait for new page to load
		await newPage.waitForLoadState('networkidle');

		// Check URL of new page
		const currentUrl = newPage.url();
		expect(currentUrl).toContain('blumehelp.omegaai.com');
	});

	test('Check redirect to help page using poManager', async () => {
		// Wait for Blume page to load
		await page.waitForLoadState('load');

		// Use poManager to access Blume
		const helpButton = poManager.blume.helpNvg();
		await expect(helpButton).toBeVisible({ timeout: 10000 });

		// Wait for redirect to new page
		const [newPage] = await Promise.all([page.context().waitForEvent('page'), helpButton.click()]);

		// Check that new page opened
		expect(newPage).toBeTruthy();

		// Wait for new page to load
		await newPage.waitForLoadState('networkidle');

		// Check URL of new page
		const currentUrl = newPage.url();
		expect(currentUrl).toContain('blumehelp.omegaai.com');
	});
});

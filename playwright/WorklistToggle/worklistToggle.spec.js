const { test, request, expect, chromium } = require('@playwright/test');

const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe('Worklist Toggle', () => {
	let browser;
	let page;
	let poManager;

	test.beforeEach(async ({}) => {
		browser = await chromium.launch();
		page = await browser.newPage();

		// Turn off FF before testing for selector
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON
			if (bodyJson.features && bodyJson.features['maven-2686-new-worklist-toggle']) {
				bodyJson.features['maven-2686-new-worklist-toggle'].variationName = 'Variation On';
				bodyJson.features['maven-2686-new-worklist-toggle'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['maven-2686-new-worklist-toggle']) {
				bodyJson.variables['maven-2686-new-worklist-toggle'].value = true;
			}

			if (bodyJson.features && bodyJson.features['maven-2735-worklist-right-click-menu']) {
				bodyJson.features['maven-2735-worklist-right-click-menu'].variationName = 'Variation On';
				bodyJson.features['maven-2735-worklist-right-click-menu'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['maven-2735-worklist-right-click-menu']) {
				bodyJson.variables['maven-2735-worklist-right-click-menu'].value = true;
			}

			if (bodyJson.features && bodyJson.features['maven-worklist-grouping']) {
				bodyJson.features['maven-worklist-grouping'].variationName = 'Variation On';
				bodyJson.features['maven-worklist-grouping'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['maven-worklist-grouping']) {
				bodyJson.variables['maven-worklist-grouping'].value = true;
			}

			console.log('bodyJson', bodyJson);

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('should not see worklist selector and should see worklist setting icon when toggle is not turned on', async ({}) => {
		await expect(page.getByText('Try New Worklist')).toBeVisible();

		const worklistSelectorDropdown = await page
			.getByTestId('grid-toolbar')
			.getByTestId('KeyboardArrowDownIcon')
			.count();
		await expect(worklistSelectorDropdown).toBe(0);

		await expect(page.locator('[aria-label="Worklist Speed Dial"]')).toBeVisible();
	});

	test('should see worklist selector and should not see worklist setting icon when toggle is turned on', async ({}) => {
		await expect(page.getByText('Try New Worklist')).toBeVisible();

		await page.getByText('Try New Worklist').click();

		expect(page.getByText('Try New Worklist')).toBeChecked();

		await page.waitForTimeout(10000);

		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();

		await expect(page.locator('[aria-label="Worklist Speed Dial"]')).not.toBeVisible();

		await worklistSelectorDropdown.click();
		const newUserWlBtn = page.getByText('Create User Worklist');
		await expect(newUserWlBtn).toBeVisible();
		await expect(newUserWlBtn).toBeEnabled();

		await page.getByText('Create User Worklist').click();

		await page.waitForTimeout(5000);

		//should show worklist setting drawer after clicking on create user worklist
		await expect(page.getByText('New Worklist', { exact: true })).toBeVisible();
	});

	test('should be able to see new custom right click menu when toggle is turned on', async ({}) => {
		await expect(page.getByText('Try New Worklist')).toBeVisible();

		await page.getByText('Try New Worklist').click();

		expect(page.getByText('Try New Worklist')).toBeChecked();

		await page.waitForTimeout(10000);

		const worklistRow = poManager.homePage.worklistTableRows();

		await worklistRow.first().click({ button: 'right' });

		await page.waitForTimeout(5000);

		await expect(page.getByTestId('worklist-context-menu')).toBeVisible();
	});
});

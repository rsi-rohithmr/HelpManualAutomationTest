const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe('Worklist Selector', () => {
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const baseUrl = playwrightConfig.baseURL;
	let worklistArray = [];
	let globalResponse;
	let page;
	let browser;
	test.beforeEach(async ({ }) => {
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

            // Fulfill request with modified data
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                body: JSON.stringify(bodyJson),
            });
        });
 
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAIUserReferring01();
        // wait for 1 min before doing anything because there could be api slowness
        await page.waitForTimeout(30000);
 
        await expect(page.getByText('Try New Worklist')).toBeVisible();
 
        await page.getByText('Try New Worklist').click();
 
        expect(page.getByText('Try New Worklist')).toBeChecked();
    });

	test.afterAll(async ({}) => {
		if (worklistArray.length > 0) {
			const apiContext = await request.newContext();
			const poManager = new POManager(page, apiContext);
			for (const wl of worklistArray) {
				console.log('Deleting worklist with ID:', wl.id);
				await poManager.apiRequests.deleteRoleWorklistWithID(wl.id);
			}
		}
	});

	test('Should be able to load worklist selector and view it', async ({ }) => {
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();

		await worklistSelectorDropdown.click();

		await expect(page.getByPlaceholder('Enter worklist name, user or role')).toBeVisible();

		await expect(page.getByText('Create User Worklist')).toBeVisible();

		await expect(page.getByText('Create Role Worklist')).toBeVisible();
	});

	test('Should not see pencil icon in role page', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.organizationDirectoryPage.openOrganizationDirectoryPage();
		await poManager.organizationDirectoryPage.detailsBtn().click();
		await page.waitForTimeout(15000);

		await expect(page.getByText('Users & Roles')).toBeVisible();

		await page.getByText('Users & Roles').click();

		await expect(page.getByText('Users').nth(1)).toBeVisible();

		const roleIcon = await page.getByTestId('dynamic-btn-Roles').getByTestId('example-icon');

		await expect(roleIcon).toBeVisible();

		await roleIcon.click();

		await page.getByLabel('Add Role').click();

		await page.getByTestId('expand-button-Worklist').click();

		const editIconCount = await page.getByTestId('EditOutlinedIcon').count();

		await expect(editIconCount).toBe(3);
	});

	test('Should be able to quick save worklist when filter changes', async ({ }) => {
		const saveIconStart = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');
		await expect(saveIconStart).toHaveCount(0);

		await page.getByLabel('Order Priority').hover();

		await page.getByTestId('Order Priority_filter').getByPlaceholder('Search').click();

		await page.getByRole('option', { name: 'ASAP' }).locator('nth=0').click();

		await expect(page.getByText('Order Priority: ASAP')).toBeVisible();

		const saveIcon = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');

		await expect(saveIcon).toBeVisible();

		await page.getByLabel('Clear All').click();

		await page.waitForSelector('#saveGrid', { state: 'hidden', timeout: 5000 });
	});

	test('Should be able to quick save worklist when sort changes', async ({ }) => {
		const saveIconStart = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');
		await expect(saveIconStart).toHaveCount(0);

		await page.getByLabel('Order Priority').hover();

		await page.getByTestId('headcol-priority').click();

		const saveIcon = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');

		await expect(saveIcon).toBeVisible();

		await page.getByLabel('Clear All').click();

		await page.waitForSelector('#saveGrid', { state: 'hidden', timeout: 5000 });
	});

	test('Should be able to keep save icon after going to organization page and back', async ({ }) => {
		const saveIconStart = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');
		await expect(saveIconStart).toHaveCount(0);

		await page.getByLabel('Order Priority').hover();

		await page.getByTestId('Order Priority_filter').getByPlaceholder('Search').click();

		await page.getByRole('option', { name: 'ASAP' }).locator('nth=0').click();

		await expect(page.getByText('Order Priority: ASAP')).toBeVisible();

		const saveIcon = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');

		await expect(saveIcon).toBeVisible();

		await page.locator('.nav-link-icon-organization').click();

		const organizationPage = await page.getByRole('heading', { name: 'Organizations' });

		await expect(organizationPage).toBeVisible({timeout : 15000});

		await page.locator('.nav-link-icon-home').click();

		await expect(saveIcon).toBeVisible();
	});

	test('Should be able to quick save worklist when reorder columns', async ({ }) => {
		const saveIconStart = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');
		await expect(saveIconStart).toHaveCount(0);

		await page.getByTestId('Order Priority_filter').getByPlaceholder('Search').hover();

		await page.mouse.down();

		await page.getByLabel('Managing Organization').hover();

		await page.getByLabel('Managing Organization').hover();

		await page.mouse.up();

		let saveIcon = await page.getByTestId('grid-toolbar').getByTestId('saveGrid').count();

		if (saveIcon === 0) {
			// if we could drag priority to managing org, we will drag managing org to priority instead
			await page.getByLabel('Managing Organization').hover();

			await page.mouse.down();

			await page.getByTestId('Order Priority_filter').getByPlaceholder('Search').hover();

			await page.getByTestId('Order Priority_filter').getByPlaceholder('Search').hover();

			await page.mouse.up();

			saveIcon = await page.getByTestId('grid-toolbar').getByTestId('saveGrid');

			await expect(saveIcon).toBeVisible();
		}
	});

	test('Should be able to edit worklist - worklist selector', async ({ }) => {
		const poManager = new POManager(page);
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();
		await worklistSelectorDropdown.click();
		
		const selectWl = await page.locator('.worklist-selector-menu-item').first();
		await expect(selectWl).toBeVisible();
		await selectWl.hover();
		const editButton = selectWl.locator('[data-testid="EditOutlinedIcon"]');
		await expect(editButton).toBeVisible();
		await editButton.click();

		await page.waitForTimeout(5000); // Waiting for background requests to complete

		await poManager.worklistSettings.saveExistingWorklistBtn().waitFor({ state: 'visible' });

		await page.route('**/fhir/WorklistLayout?*', route => route.continue());
		await poManager.worklistSettings.saveExistingWorklistBtn().click();

		globalResponse = await poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'GET');
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
	});
});
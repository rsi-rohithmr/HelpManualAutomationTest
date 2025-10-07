const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const playwrightConfig = require('../../playwright.config');

test.describe('Worklist Behaviors Test', () => {
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let worklistIDArray = [];
	let globalResponse;
	let page;
	let browser;
	let studyInfo;
	test.beforeAll(async ({}) => {
		// Add preparation steps
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		api.postStudy().then(result => {
			console.log('Post first study result is', result);
			studyInfo = result;
		});
		api.postStudy().then(result => {
			console.log('Post second study result is', result);
		});
	});

	test.beforeEach(async ({ }) => {
		// Turn off FF before testing for selector
		browser = await chromium.launch();
		page = await browser.newPage();
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
 
			if (bodyJson.features && bodyJson.features['maven-2793-worklist-select-behavior']) {
                bodyJson.features['maven-2793-worklist-select-behavior'].variationName = 'Variation On';
                bodyJson.features['maven-2793-worklist-select-behavior'].variationKey = 'variation-on';
            }
 
            if (bodyJson.variables && bodyJson.variables['maven-2793-worklist-select-behavior']) {
                bodyJson.variables['maven-2793-worklist-select-behavior'].value = true;
            }
            // Fulfill request with modified data
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                body: JSON.stringify(bodyJson),
            });
        });
 
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAIUser04();
        // wait for 1 min before doing anything because there could be api slowness
        await page.waitForTimeout(15000);
 
        await expect(page.getByText('Try New Worklist')).toBeVisible();
 
        await page.getByText('Try New Worklist').click();
 
        expect(page.getByText('Try New Worklist')).toBeChecked();
		await page.waitForTimeout(5000);
	});

	test.afterAll(async ({}) => {
		if (worklistIDArray.length > 0) {
			const apiContext = await request.newContext();
			const poManager = new POManager(page, apiContext);
			for (const id of worklistIDArray) {
				console.log('Deleting worklist with ID:', id);
				await poManager.apiRequests.deleteRoleWorklistWithID(id);
			}
		}
	});
	test('Worklist - Load Worklist', async ({ }) => {
		const poManager = new POManager(page);
		await expect(poManager.homePage.worklistTableRows()).not.toHaveCount(0, { timeout: 10000 });
	});

	test('Worklist - Scroll to load more data', async ({ }) => {
		const poManager = new POManager(page);

		await expect(poManager.homePage.worklistTableRows()).not.toHaveCount(0, { timeout: 10000 });

		// Last row
		const worklistLastRow = await poManager.homePage.worklistTableRows().last();
		worklistLastRow.scrollIntoViewIfNeeded();

		await page.waitForTimeout(10000);
		await expect(worklistLastRow).toBeVisible();
	});

	test('Worklist - Selection by press ctrl', async ({ }) => {
		const poManager = new POManager(page);

		// Wait for worklist to load and show more than 2 rows
		await poManager.homePage.worklistTableRows().first().waitFor({ state: 'visible', timeout: 10000 });
		const numOfRows = await poManager.homePage.worklistTableRows().count();
		await expect(numOfRows).toBeGreaterThan(2);

		const listOfRows = poManager.homePage.worklistTableRows();

		// Press Ctrl
		await page.keyboard.down('Control');
		// Click on rows
		await listOfRows.nth(0).click();
		await listOfRows.nth(1).click();

		// Release mouse
		await page.mouse.up();

		// Release Ctrl
		await page.keyboard.up('Control');
		// Assert: check selected rows have a 'selected' class or attribute
		const selectedRows = await page.locator('.PrivateSwitchBase-root.Mui-checked').count();
		expect(selectedRows).toBeGreaterThan(0);
	});

	test('Worklist - Selection by press Shift', async ({ }) => {
		const poManager = new POManager(page);

		// Wait for worklist to load and show more than 2 rows
		await poManager.homePage.worklistTableRows().first().waitFor({ state: 'visible', timeout: 10000 });
		const numOfRows = await poManager.homePage.worklistTableRows().count();
		await expect(numOfRows).toBeGreaterThan(2);

		const listOfRows = poManager.homePage.worklistTableRows();
		// Get bounding box of the first and last row
		const firstRow = listOfRows.nth(0);
		await expect(firstRow).toBeVisible();
		await firstRow.scrollIntoViewIfNeeded();
		const startBox = await firstRow.boundingBox();

		// second row
		const lastRow = listOfRows.nth(1);
		await expect(lastRow).toBeVisible();
		await lastRow.scrollIntoViewIfNeeded();
		const endBox = await lastRow.boundingBox();

		// Press Shift
		await page.keyboard.down('Shift');
		// Move to start position and press mouse down
		await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
		await page.mouse.down();

		// Move to end position while holding mouse
		await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, { steps: 10 });

		// Release mouse
		await page.mouse.up();

		// Release Shift
		await page.keyboard.up('Shift');
		// Assert: check selected rows have a 'selected' class or attribute
		const selectedRows = await page.locator('.PrivateSwitchBase-root.Mui-checked').count();
		expect(selectedRows).toBeGreaterThan(0);
	});

	test('Worklist - Secondary and Tertiary Insurance', async ({ }) => {
		test.setTimeout(480000);
		// const defaultWorklistName = await page.locator('#gridTitle label').textContent();
		const poManager = new POManager(page);

		const { coverageResponse } = await poManager.coverageInformationPage.openCoverageInformationPageByURL(
			studyInfo?.patientId
		);

		if (coverageResponse.total === 0) {
			for(let i = 0; i < 3; i++) {
				await poManager.coverageInformationPage.getAddNewCoverageButton().click();
				await poManager.coverageInformationPage.setCoverageDetailsInformation();
				await expect(page.locator('[data-testid="coverage-card-box"]')).toHaveCount(i + 1);
			}
			
			//============ START - Create User WL =================
			// Generate a random number between 1111 and 9999
			await poManager.homePage.homePageBtn().click();
			await page.waitForTimeout(5000);

			const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
			const newUserWlName = 'TEST WL SELECTOR - ' + randomNum;
			const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
			await expect(worklistSelectorDropdown).toBeVisible();
			await worklistSelectorDropdown.click();

			// Click button add user worklist
			await page.waitForTimeout(3000);
			await expect(page.getByText('Create User Worklist')).toBeVisible();
			page.getByText('Create User Worklist').click();

			// Input new worklist name
			await page.waitForTimeout(5000);
			await poManager.worklistSettings.userWorklistNameTxt().fill(newUserWlName);

			// Add column into new worklist
			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Secondary Insurance'
			);

			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Secondary Prior Authorization #'
			);
			
			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Tertiary Insurance'
			);

			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Tertiary Prior Authorization #'
			);

			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Indicators'
			);

			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Managing Organization'
			);

			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				'Patient Name'
			);
			await page.route('**/fhir/WorklistLayout?*', async route => {
				await route.continue();
			});

			const waitForResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'POST');
			await Promise.all([
				poManager.worklistSettings.saveNewWorklistBtn().click(),
				waitForResponsePromise,
			]);
			globalResponse = await waitForResponsePromise;
			console.log('posted worklist', globalResponse);
			worklistIDArray.push(globalResponse.id);
			await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
			//============ END - Create User WL =================

			await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
			await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
			await poManager.page.waitForTimeout(5000);
			await expect(
				poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g')).first()
			).toBeVisible();

			console.log('Open Prior drawer');
			if (await page.locator('[name="eligible"]').count() > 0) {
				await page.locator('[name="eligible"]').click();
			} else {
				await page.locator('[name="eligibleMixed"]').click();
			}
			const authorizationNumber02 = '2222222222222';
			const authorizationNumber03 = '3333333333333';

			// Second payer
			await page.locator('[role="tab"]').nth(1).click();

			// Second authorization number - txt
			const secondAuthorizationNumber = page.locator('[name="preauth[1].preauthorizationCode"]');
			await expect(secondAuthorizationNumber).toBeVisible();
			await secondAuthorizationNumber.fill(authorizationNumber02);
			
			// Tertiary payer
			await page.getByTestId('KeyboardArrowRightIcon').click();
			await page.locator('[role="tab"]').nth(2).click();

			// Tertiary authorization number - txt
			const tertiaryAuthorizationNumber = page.locator('[name="preauth[2].preauthorizationCode"]');
			await expect(tertiaryAuthorizationNumber).toBeVisible();
			await tertiaryAuthorizationNumber.fill(authorizationNumber03);

			// Submit
			await page.getByTestId('SUBMIT_').click();

			// Wait for sync data to elastic cloud.
			await poManager.page.waitForTimeout(10000);

			await poManager.homePage.filterStudiesBySingleColumn('Secondary Prior Authorization #', authorizationNumber02);
			await poManager.homePage.filterStudiesBySingleColumn('Tertiary Prior Authorization #', authorizationNumber03);

			await expect(
				poManager.homePage.worklistTableRows().getByText(new RegExp(`^${authorizationNumber02}$`, 'g')).first()
			).toBeVisible({ timeout: 10000 });
			await expect(
				poManager.homePage.worklistTableRows().getByText(new RegExp(`^${authorizationNumber03}$`, 'g')).first()
			).toBeVisible({ timeout: 10000 });
		}
	});
});

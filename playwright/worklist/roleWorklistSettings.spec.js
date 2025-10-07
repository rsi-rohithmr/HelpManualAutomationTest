import faker from 'community-faker';
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { test, request, expect, chromium } = require('@playwright/test');
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let browser;
let page;
let roleWorklistName;
let worklistID;

test.describe.serial('Role Worklist Settings Tests', () => {
	test.beforeAll(async ({}) => {
		browser = await chromium.launch();
		page = await browser.newPage();

		// Turn off FF before testing for selector
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON
			if (bodyJson.features && bodyJson.features['maven-2686-new-worklist-toggle']) {
				bodyJson.features['maven-2686-new-worklist-toggle'].variationName = 'Variation Off';
				bodyJson.features['maven-2686-new-worklist-toggle'].variationKey = 'variation-off';
			}

			if (bodyJson.variables && bodyJson.variables['maven-2686-new-worklist-toggle']) {
				bodyJson.variables['maven-2686-new-worklist-toggle'].value = false;
			}

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		roleWorklistName = `roleWorkList${poManager.apiRequests.generateRandomNumber(11111, 99999)}`;
		console.log(`role worklist name ${roleWorklistName}`);
		await page.waitForTimeout(5000);
	});

	test.afterAll(async ({}) => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);
		await poManager.apiRequests.deleteRoleWorklistWithID(worklistID);
	});

	test('Create a new role worklist', async ({}) => {
		await page.route('**/fhir/Role?_count=50&_sort=name&active=true&organization=*', route => route.continue());
		const poManager = new POManager(page);
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.addNewWorklistBtn().click();

		// Wait for the role mode toggle button to be visible
		await page.waitForTimeout(3000);
		await poManager.worklistSettings.roleModeToggleBtn().waitFor({ state: 'visible' });

		await page.route('**organization?_count=50&_sort=name&_summary=true*', route => route.continue());

		// https://pre-us01.omegaai.com/api/fhir/organization?_count=50&_sort=name&_summary=true&isreferring=false&name=TEST%20MANAGING%20ORG%2001&organizationtype:not=PAY,INS&page=1&_dc=1734359685049

		await poManager.worklistSettings.roleModeToggleBtn().hover();
		await poManager.worklistSettings.roleWorklistBtn().click();

		await page.waitForTimeout(5000); // Waiting for background requests to complete
		await poManager.worklistSettings.roleWorklistHeader(true).waitFor({ state: 'visible' });
		await Promise.all([
			await poManager.worklistSettings.organizationCombo().clear(),
			await poManager.worklistSettings.organizationCombo().fill(managingOrgName),
			poManager.apiWaitUtils.waitForAPI('organization?_count=50&_sort=name&_summary=true', 'GET'),
		]);

		await Promise.all([
			await page.locator('#autocomplete-field-Organization-option-0').click(),
			poManager.apiWaitUtils.waitForAPI('Role?_count=50&_sort=name&active=true&organization=', 'GET'),
		]);

		await poManager.worklistSettings.roleWorklistNameTxt().fill(roleWorklistName);

		// Add required columns
		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Accession #'
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

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Study Status'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Priority'
		);

		await page.route('**/fhir/WorklistLayout?*', route => route.continue());
		const waitForResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'POST');
		await Promise.all([
			poManager.worklistSettings.saveNewWorklistBtn().click(),
			waitForResponsePromise,
		]);
		const response = await waitForResponsePromise;
		console.log('created worklistID is', response.id);
		worklistID = response.id;
	});

	// TODO Add two more tests for edit a role worklist and duplicate a role worklist when PRO-4532 is fixed
});

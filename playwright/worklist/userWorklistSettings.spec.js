const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

let userWorklistName = '';
let page;
let browser;
let response;
let studyInfo;
let worklistIDArray = [];
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let apiContext;
let api;

test.describe('User Worklist Settings Tests', () => {
	test.beforeAll(async ({}) => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			studyInfo = result;
		});
	});

	test.beforeEach(async ({}) => {
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
		await page.waitForTimeout(5000);
	});

	test.afterAll(async ({}) => {
		if (worklistIDArray.length > 0) {
			const poManager = new POManager(page, apiContext);
			for (const id of worklistIDArray) {
				console.log('Deleting worklist with ID:', id);
				await poManager.apiRequests.deleteRoleWorklistWithID(id);
			}
		}
	});

	test('Create a new user worklist, add filters and sorting, and save the worklist', async ({}) => {
		const poManager = new POManager(page);
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.addNewWorklistBtn().click();
		await page.waitForTimeout(6000);
		await expect(poManager.worklistSettings.userWorklistHeader(true)).toBeVisible();
		await expect(poManager.worklistSettings.saveNewWorklistBtn()).toBeDisabled();

		const randomNum = poManager.apiRequests.generateRandomNumber(1111, 9999);
		userWorklistName = `User Worklist - ${randomNum}`;
		await poManager.worklistSettings.userWorklistNameTxt().fill(userWorklistName);
		await page.waitForTimeout(4000);
		const columns = ['Accession #', 'Managing Organization', 'Patient Name', 'Study Status', 'Priority'];

		// Create Worklist Layout
		const wlResponse = await poManager.worklistSettings.createNewWorklist(userWorklistName, columns);
		console.log('posted worklist', wlResponse);
		expect(wlResponse).not.toBeNull();
		worklistIDArray.push(wlResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();

		// Wait for Worklist loading to finish
		let linearProgress = page.locator('.MuiLinearProgress-root');
		await expect(linearProgress).toBeVisible({ timeout: 5000 });
		await expect(linearProgress).toBeHidden({ timeout: 30000 });

		// Go to Worklist Settings
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.worklistSettingsBtn().click();
		await poManager.worklistSettings.filtersTab().click();

		// Add Filters
		await poManager.common.filterRecordsBySuggestionColumn('managingOrganization', managingOrgName);
		await poManager.worklistSettings.addColumnTextFilter('patientName', studyInfo?.patientName);
		// Add Sorting
		await poManager.worklistSpeedDial.sortTab().click();
		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.worklistSettings.addColumnSort('Patient Name');
		// Save Worklist
		await poManager.worklistSettings.saveExistingWorklistBtn().click();

		// Wait for LinearProgress to disappear (loading finished)
		linearProgress = page.locator('.MuiLinearProgress-root');
		await expect(linearProgress).toBeVisible({ timeout: 5000 });
		await expect(linearProgress).toBeHidden({ timeout: 30000 });

		// check if the worklist is filtered
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Switch between 2 Worklists and check the Worklist Grid', async ({}) => {
		const poManager = new POManager(page);
		const randomNum = poManager.apiRequests.generateRandomNumber(1111, 9999);

		// Create a new worklist
		await poManager.worklistSpeedDial.gotToAddNewWorklistDrawer();
		const wlName1 = `Switch Worklist 1 _ ${randomNum}`;
		const wlCols1 = ['Accession #', 'Patient Name', 'Study Status', 'Managing Organization'];
		const wlResponse = await poManager.worklistSettings.createNewWorklist(wlName1, wlCols1);
		expect(wlResponse).not.toBeNull();
		worklistIDArray.push(wlResponse.id);
		await page.waitForTimeout(4000);

		// Create another worklist
		await poManager.worklistSpeedDial.gotToAddNewWorklistDrawer();
		const wlName2 = `Switch Worklist 2 _ ${randomNum}`;
		const wlCols2 = ['Accession #', 'Managing Organization', 'Patient Name', 'Study Status', 'Priority'];
		const wlResponse2 = await poManager.worklistSettings.createNewWorklist(wlName2, wlCols2);
		expect(wlResponse2).not.toBeNull();
		worklistIDArray.push(wlResponse2.id);
		await page.waitForTimeout(4000);

		// Switch to the first worklist
		await poManager.worklistSpeedDial.goToWorklistSettingsDrawer();
		await poManager.worklistSettings.switchWorklist(wlName1);
		await page.waitForTimeout(4000);

		// Filter the worklist by Patient Name
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});
	/*

	test.skip('Update a user worklist', async ({}) => {
		const poManager = `new` POManager(page);
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.worklistSettingsBtn().click();

		await expect(poManager.worklistSettings.roleModeToggleBtn()).toBeVisible();
		await expect(poManager.worklistSettings.userWorklistHeader()).toBeVisible();

		await page.waitForTimeout(4000);

		const value = await poManager.worklistSettings.userWorklistNameCombo().getAttribute('value');
		expect(value).toBe(userWorklistName.toUpperCase());

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Modality'
		);
		await poManager.worklistSettings.saveExistingWorklistBtn().click();

		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();

		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.worklistSettingsBtn().click();
		await page.waitForTimeout(4000);

		const updatedValue = await poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0).getAttribute('value');
		expect(updatedValue).toBe('Modality');

		await poManager.worklistSettings.closeUserWorklistDrawerBtn().click();
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
	});

	test.skip('Save as a new user worklist', async ({}) => {
		const poManager = new POManager(page);
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.worklistSettingsBtn().click();

		await page.waitForTimeout(3000);

		await poManager.worklistSpeedDial.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Gender'
		);
		await poManager.worklistSpeedDial.saveExistingWorklistArrowIcon().click();
		await poManager.worklistSpeedDial.saveAsNewWorklistMenu().click();

		await expect(poManager.worklistSpeedDial.saveAsNewWorklistHeader()).toContainText('Save for a New Worklist');

		await poManager.worklistSpeedDial.typeWorklistName().fill(`${userWorklistName}-clone`);
		await poManager.worklistSpeedDial.saveNewWorklistBtn().click();

		await expect(poManager.worklistSpeedDial.closeUserWorklistDrawerBtn(true)).not.toBeVisible();

		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.worklistSettingsBtn().click();
		await page.waitForTimeout(3000);

		const cloneValue = await poManager.worklistSpeedDial.userWorklistNameCombo().getAttribute('value');
		expect(cloneValue).toBe(`${userWorklistName}-clone`.toUpperCase());

		const genderValue = await poManager.worklistSpeedDial.columnNameSearchBoxOnColumnsTab(0).getAttribute('value');
		expect(genderValue).toBe('Gender');

		await poManager.worklistSpeedDial.closeUserWorklistDrawerBtn().click();
		await expect(poManager.worklistSpeedDial.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
	});
	*/
});

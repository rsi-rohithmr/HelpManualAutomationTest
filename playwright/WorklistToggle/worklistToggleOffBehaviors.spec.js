const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
import { StudyInfoPage } from '../POM/study/studyInfoPage';
import { TIMEOUT_IN_MSEC2 } from '../POM/timeouts';
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const playwrightConfig = require('../../playwright.config');

test.describe('Worklist Without Toggle Behaviors Test', () => {
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let worklistIDArray = [];
	let globalResponse;
	let page;
	let browser;
	let studyInfo;
	let userWorklistName = '';
	let loggedUser = '';
	test.beforeAll(async ({}) => {
		// Add preparation steps
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		api.postStudy().then(result => {
			console.log('Post study result is', result);
			studyInfo = result;
		});

		await api.getUserDetails().then(result => {
			const userdetails = result;
			console.log(userdetails.name[0].family);
			loggedUser = userdetails.name[0].family;
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
        // wait for 1 min before doing anything because there could be api slowness
        await page.waitForTimeout(15000);
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

	test('Worklist - Should be able to open visit of a study from the worklist grid', async ({ }) => {
		const poManager = new POManager(page);
		const numOfRows = await poManager.homePage.worklistTableRows().count();
		await expect(numOfRows).toBeGreaterThan(0);

		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.page.waitForTimeout(5000);
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g')).first()
		).toBeVisible();

		// Click on row
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await expect(poManager.clickWheel.studyIcon()).toBeVisible();
		
		await Promise.all([
			await poManager.clickWheel.studyIcon().click({ force: true }),
			globalResponse = await poManager.apiWaitUtils.waitForAPI('/fhir/Encounter', 'GET')
		]);
		console.log('globalResponse : ', globalResponse?.entry?.[0]?.resource?.id);
		const encounterId = globalResponse?.entry?.[0]?.resource?.id;
		let studyInfoPage = new StudyInfoPage(page);
		await expect(studyInfoPage.studyStatusComboInView()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });

		if(encounterId) {
			await page.getByTestId(`visit-card-${encounterId}`, { timeout: TIMEOUT_IN_MSEC2 }).click();
			await page.waitForTimeout(5000);
			const visitNumberLocator = page.locator('[data-testid="form-field-visitNumber"]').first();
			// Ensure it's visible
			await expect(visitNumberLocator).toBeVisible();
			// Ensure it contains the expected text
			await expect(visitNumberLocator).toContainText(encounterId);
		}
	});

	test('Worklist - Should be able to assign Reading Physician', async ({ }) => {
		console.log('START - Create worklist');
		const poManager = new POManager(page);
		await poManager.worklistSpeedDial.worklistSpeedDialBtn().click();
		await poManager.worklistSpeedDial.addNewWorklistBtn().click();
		await page.waitForTimeout(6000);
		await expect(poManager.worklistSettings.userWorklistHeader(true)).toBeVisible();
		await expect(poManager.worklistSettings.saveNewWorklistBtn()).toBeDisabled();

		const randomNum = poManager.apiRequests.generateRandomNumber(1111, 9999);
		userWorklistName = `User Worklist${randomNum}`;
		await poManager.worklistSettings.userWorklistNameTxt().fill(userWorklistName);
		await page.waitForTimeout(4000);

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
			'Performing Physician'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Referring Physician'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Reading Physician'
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
		console.log('END - Create worklist');
		console.log('posted worklist', globalResponse);
		worklistIDArray.push(globalResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();

		// Filter study
		console.log('START - Filter created study');
		await poManager.page.waitForTimeout(5000);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.page.waitForTimeout(5000);
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g')).first()
		).toBeVisible();
		console.log('END - Filter created study');
		console.log('START - Assign Referring Physician');
		const referringPhysicianCell = page.locator('#referringPhysician').first();
		// Find the FolderSharedIcon SVG inside it and click
		await referringPhysicianCell.locator('[data-testid="FolderSharedIcon"]').click({ timeout : 5000 });

		// Find the input inside and fill with value
		await referringPhysicianCell.locator('#search-as-you-type').fill(loggedUser);

		// Wait for the dropdown options to appear
		let firstOption = page.locator('ul[role="listbox"] li').first();
		await expect(firstOption).toBeVisible({ timeout : 5000 });
		await page.waitForTimeout(3000);

		// Click the first option
		let waitForPutRequest = poManager.apiWaitUtils.waitForAPI('/fhir/ServiceRequest', 'PUT');
		await firstOption.click({ timeout: 5000 });
		await waitForPutRequest;
		console.log('END - Assign Referring Physician');
		await page.waitForTimeout(3000);

		// Reading Physician
		console.log('START - Assign Reading Physician');
		const readingPhysicianCell = page.locator('#readingPhysician').first();
		// Find the FolderSharedIcon SVG inside it and click
		await readingPhysicianCell.locator('[data-testid="FolderSharedIcon"]').click({ timeout : 5000 });

		// Find the input inside and fill with value
		await readingPhysicianCell.locator('#search-as-you-type').fill(loggedUser);

		// Wait for the dropdown options to appear
		firstOption = page.locator('ul[role="listbox"] li').first();
		await expect(firstOption).toBeVisible({ timeout : 5000 });
		await page.waitForTimeout(3000);
	
		// Click the first option
		waitForPutRequest = poManager.apiWaitUtils.waitForAPI('/fhir/ImagingStudy', 'PATCH');
		await firstOption.click({ timeout: 5000 });
		await waitForPutRequest;
		await page.waitForTimeout(3000);
		console.log('END - Assign Reading Physician');

		// Performing Physician
		console.log('START - Assign Performing Physician');
		const performingPhysicianCell = page.locator('#performingPhysician').first();
		// Find the FolderSharedIcon SVG inside it and click
		await performingPhysicianCell.locator('[data-testid="FolderSharedIcon"]').click({ timeout : 5000 });

		// Find the input inside and fill with value
		await performingPhysicianCell.locator('#search-as-you-type').fill(loggedUser);

		// Wait for the dropdown options to appear
		firstOption = page.locator('ul[role="listbox"] li').first();
		await expect(firstOption).toBeVisible({ timeout : 5000 });
		await page.waitForTimeout(3000);
	
		// Click the first option
		waitForPutRequest = poManager.apiWaitUtils.waitForAPI('/fhir/ImagingStudy', 'PUT');
		await firstOption.click({ timeout: 5000 });
		await waitForPutRequest;
		console.log('END - Assign Performing Physician');
	});
});

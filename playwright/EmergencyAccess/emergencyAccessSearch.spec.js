const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

test.describe('Emergency Access Search', () => {
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let page;
	let browser;
	let studyInfo;
	let userdetails;
	let shouldProceed = false;
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
	
		await api.postStudy().then(result => {
			console.log("study : ", result);
			studyInfo = result;
		});
	
		await api.getUserDetails().then(result => {
			console.log("user details :", result);
			userdetails = result;
		});
	});

	test.beforeEach(async ({ }) => {
		browser = await chromium.launch();
		page = await browser.newPage();
		// Turn off FF before testing for selector
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON
			if (bodyJson.features && bodyJson.features['maven-2764-improve-emergency-search']) {
				bodyJson.features['maven-2764-improve-emergency-search'].variationName = 'Variation On';
				bodyJson.features['maven-2764-improve-emergency-search'].variationKey = 'variation-on';
			}
 
			if (bodyJson.variables && bodyJson.variables['maven-2764-improve-emergency-search']) {
				bodyJson.variables['maven-2764-improve-emergency-search'].value = true;
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
		await page.waitForTimeout(10000);

		// Enable Emergency if needed
		const topSearchTxt = await poManager.globalSearch.topSearchTxt();
		await expect(topSearchTxt).toBeVisible();
		await topSearchTxt.click();

		const searchDialog = page.locator('[data-testid="search-dialog"]');
		await expect(searchDialog).toBeVisible();
		const emergencyAccessElement = searchDialog.locator('span', { hasText: 'Emergency Access' });
		const firstEme = emergencyAccessElement.first();
		let isFoundEmergency = await firstEme.isVisible();
		if (isFoundEmergency) {
			console.log('Emergency search is enabled, can proceed to test');
			shouldProceed = true;
		} else {
			console.log('Emergency search is disabled for the user, need to turn it on in role page');
			await turnOnEmergencyAccessPrivilegeForUser();
		}
	});

	test('Search patients fullname with email should return correct result', async ({ }) => {
		if (shouldProceed) {
			const poManager = new POManager(page);
			const patientEmail = studyInfo?.patientEmail;

			// Open emergency search
			// await poManager.globalSearch.topSearchTxt().click();
			const topSearchTxt = await poManager.globalSearch.topSearchTxt();
			await expect(topSearchTxt).toBeVisible();
			await topSearchTxt.click();
			await page.getByText('Emergency Access').click();

			// Fill patient full name
			await page.locator('input[name="patientName"]').fill(studyInfo?.patientName);

			// Click on "Email address" label to enable email input
			await page.getByRole('radio', { name: 'Email address' }).check();
			const emailInput = page.locator('input[name="emailAddress"]');
			await expect(emailInput).toBeVisible();
			await emailInput.click();
			await emailInput.fill(patientEmail);

			// Wait for continue button to be enabled and click it
			const continueBtn = page.locator('[data-testid="Continue_"]');
			await expect(continueBtn).toBeEnabled();
			const waitForGetRequest = poManager.apiWaitUtils.waitForAPI('/fhir/Patient/elk', 'GET');
			await continueBtn.click();
			await waitForGetRequest;

			// Verify result
			await page.waitForTimeout(10000);
			await expect(page.locator('#profileIconId')).toBeVisible();
		}
	});

	test('Search patients firstname with email should return correct result', async ({ }) => {
		if (shouldProceed) {
			const poManager = new POManager(page);
			const patientEmail = studyInfo?.patientEmail;
			const patientFullName = studyInfo?.patientName;
			const [firstname, ] = patientFullName.split(' ');

			// Open emergency search
			// await poManager.globalSearch.topSearchTxt().click();
			const topSearchTxt = await poManager.globalSearch.topSearchTxt();
			await expect(topSearchTxt).toBeVisible();
			await topSearchTxt.click();
			await page.getByText('Emergency Access').click();

			// Fill patient full name
			await page.locator('input[name="patientName"]').fill(firstname);

			// Click on "Email address" label to enable email input
			await page.getByRole('radio', { name: 'Email address' }).check();
			const emailInput = page.locator('input[name="emailAddress"]');
			await expect(emailInput).toBeVisible();
			await emailInput.click();
			await emailInput.fill(patientEmail);

			// Wait for continue button to be enabled and click it
			const continueBtn = page.locator('[data-testid="Continue_"]');
			await expect(continueBtn).toBeEnabled();
			const waitForGetRequest = poManager.apiWaitUtils.waitForAPI('/fhir/Patient/elk', 'GET');
			await continueBtn.click();
			await waitForGetRequest;

			// Verify result
			await page.waitForTimeout(10000);
			await expect(page.locator('#profileIconId')).toBeVisible();
		}
	});

	test('Search patients lastname with email should return correct result', async ({ }) => {
		if (shouldProceed) {
			const poManager = new POManager(page);
			const patientEmail = studyInfo?.patientEmail;
			const patientFullName = studyInfo?.patientName;
			const [, lastname] = patientFullName.split(' ');
			// Open emergency search
			// await poManager.globalSearch.topSearchTxt().click();
			const topSearchTxt = await poManager.globalSearch.topSearchTxt();
			await expect(topSearchTxt).toBeVisible();
			await topSearchTxt.click();
			await page.getByText('Emergency Access').click();

			// Fill patient full name
			await page.locator('input[name="patientName"]').fill(lastname);

			// Click on "Email address" label to enable email input
			await page.getByRole('radio', { name: 'Email address' }).check();
			const emailInput = page.locator('input[name="emailAddress"]');
			await expect(emailInput).toBeVisible();
			await emailInput.click();
			await emailInput.fill(patientEmail);

			// Wait for continue button to be enabled and click it
			const continueBtn = page.locator('[data-testid="Continue_"]');
			await expect(continueBtn).toBeEnabled();
			const waitForGetRequest = poManager.apiWaitUtils.waitForAPI('/fhir/Patient/elk', 'GET');
			await continueBtn.click();
			await waitForGetRequest;

			// Verify result
			await page.waitForTimeout(10000);
			await expect(page.locator('#profileIconId')).toBeVisible();
		}
	});

	const turnOnEmergencyAccessPrivilegeForUser = async () => {
		const poManager = new POManager(page);
		await poManager.organizationDetailPage.openOrganizationDetailPage(managingOrgName);
		await poManager.organizationDetailPage.usersAndRolesNav().click();
		await poManager.organizationDetailPage.roleIcon().hover();
		await poManager.organizationDetailPage.roleIcon().click();

		// cy.get('[data-testid="data-grid-table-container"]').find('td').contains('ADMINISTRATOR').realHover();
		// Find the ADMINISTRATOR row and click edit icon
		const dataGrid = page.locator('[data-testid="data-grid-table-container"]');
		const adminRow = dataGrid.locator('td', { hasText: 'ADMINISTRATOR' });
		await adminRow.hover();
		await page.waitForTimeout(300);
		// cy.get('[data-testid="EditOutlinedIcon"]').filter(':visible').click();
		const editIcon = page.locator('[data-testid="EditOutlinedIcon"]').first();
		await expect(editIcon).toBeVisible();
		await editIcon.click();

		// cy.get('[data-testid="expand-button-Search"]').click();
		// cy.get('[data-testid="switch-button-Emergency Search"]').find('input').uncheck();
		// cy.get('[data-testid="switch-button-Emergency Search"]').find('input').check();

		// cy.get('[data-testid="SaveOutlinedIcon"]').click();
		// Expand Search section and toggle Emergency Search
		await page.locator('[data-testid="expand-button-Search"]').click();
		const emergencySwitch = page.locator('[data-testid="switch-button-Emergency Search"] input');
		const isChecked = await emergencySwitch.isChecked();
	  
		if (isChecked) {
		  await emergencySwitch.uncheck();
		}
		await emergencySwitch.check();
		// Save changes
		await page.locator('[data-testid="SaveOutlinedIcon"]').click();

		// logout from OAI
		await poManager.loginPage.logoutOmegaAI();

		// wait for at least 5min to let redis cache refresh
		await page.waitForTimeout(320000);
		shouldProceed = true;
		await poManager.loginPage.loginOmegaAI();
	};
});

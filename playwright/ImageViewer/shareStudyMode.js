const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { faker } = require('@faker-js/faker');
import { generateTestEmail } from 'cypress/support/testUtils';

test.describe('Share Study mode', () => {
	let studyInfo;
	let poManager;
	let api;
	let apiContext;
	let publicLinkID;
	let contactEmail;
	let patientName;
	let newContext;
	let publicLinkPage;

	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const prefixPublicLinkURL = `${playwrightConfig.baseURL}iv?s=`;

	test.beforeAll(async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);

		// Generate a random email for testing
		contactEmail = generateTestEmail().toUpperCase();

		// Import the test study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testPublicLink/PublicLink.DCM')
		);

		await api.postStudy().then(result => {
			console.log('Posted study:', result);
			studyInfo = result;
			patientName = studyInfo.patientName;
		});

		await api.importDICOM(filePath, studyInfo.studyId);
		console.log('Study imported successfully');
	});

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Open Study From Public Link and Verify Default HP in Share Study mode', async ({ page }) => {
		// Filter studies by managing organization
		await page.locator('[data-cy="Managing Organization_filter"]').click();
		await page.locator('[data-cy="Managing Organization_filter"] [type="text"]').clear();
		await page.locator('[data-cy="Managing Organization_filter"]').pressSequentially(managingOrgName);
		await page.locator(`[aria-labelledby="search-as-you-type-label"] >> text=${managingOrgName}`).first().click();

		// Filter studies by patient name
		await page.locator('[data-cy="Patient Name_filter"]').click();
		await page.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]').clear();
		await page.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]').pressSequentially(patientName);

		await page.waitForTimeout(2000);

		// Click on the study row
		await page
			.locator('[data-cy="study-status-table"] tbody>tr')
			.getByText(new RegExp(`^${patientName}$`, 'g'))
			.first()
			.click();

		await page.waitForTimeout(1000);
		// Click on send study icon
		await page.locator('[name="sendstudy"]').first().click({ force: true });
		await page.waitForTimeout(1000);

		/* Send study to external user and get response */
		// Click on Send Study tab
		await page.getByRole('tab', { name: 'SEND STUDY' }).click();
		// Click on Send To dropdown
		await page.locator('[data-cy="SendDrawerSendTo"]').click();

		// Select External User option
		await page.locator('[data-cy="External User"]').click();

		// Enter email in the email field
		await page.getByRole('textbox', { name: 'Email' }).fill(contactEmail);

		// Click send study button
		await page.locator('[data-cy="SEND STUDY_"]').click();

		// Set up response interception to capture the public link response
		const responsePromise = page.waitForResponse(
			response => response.url().includes('/fhir/PublicLink') && response.request().method() === 'POST'
		);

		// Wait for the response and extract the response body
		const response = await responsePromise;
		const responseBody = await response.json();

		publicLinkID = responseBody.id;
		console.log(`Public link ID: ${publicLinkID}`);

		// Open public link in a new context to simulate external user access
		newContext = await page.context().browser().newContext();
		publicLinkPage = await newContext.newPage();

		// Create POManager instance for the public link page to access custom methods
		const publicLinkPOM = new POManager(publicLinkPage);

		// Set up API interceptions for the public link page
		await publicLinkPage.route('**/fhir/Patient/*', route => route.continue());
		await publicLinkPage.route('**/dicomweb/HangingProtocol*', route => route.continue());

		// Navigate to public link
		await publicLinkPage.goto(prefixPublicLinkURL + publicLinkID);
		await publicLinkPage.waitForTimeout(5000);

		// Verify access page elements
		await expect(publicLinkPage.locator('#welcome')).toContainText('Verify Your Access');
		await expect(publicLinkPage.getByTestId('PatientIdInput')).toBeVisible();
		await expect(publicLinkPage.getByRole('textbox', { name: 'Patient Birth Date' })).toBeVisible();

		// Enter patient birthdate and continue
		const patientBirthday = studyInfo.patientBirthday;
		// Convert birthday from yyyy-mm-dd to mmddyyyy format
		const [year, month, day] = patientBirthday.split('-');
		const formattedBirthday = `${month}${day}${year}`;
		await publicLinkPage.getByRole('textbox', { name: 'Patient Birth Date' }).fill(formattedBirthday);
		await publicLinkPage.getByRole('button', { name: 'Continue' }).click();

		// Wait for patient details API call
		await publicLinkPage.waitForResponse(
			response => response.url().includes('/fhir/Patient/') && response.request().method() === 'GET'
		);

		// Verify image viewer opens and interact with layout
		await expect(publicLinkPage.locator('[data-testid="GridViewSharpIcon"]')).toBeVisible();

		await publicLinkPOM.imageViewer.initLayoutTo1x1();

		// Wait for page to load and verify image display
		await publicLinkPage.waitForTimeout(1000);
		await expect(publicLinkPage.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(1);

		// Verify image is displayed (check for viewport with image)
		const viewport = publicLinkPage.locator('[data-testid="ImageViewerViewportCornerstone"]').first();
		await expect(viewport).toBeVisible();

		console.log('Public study link test completed successfully');

		// Continue with HP verification
		console.log('Select Hanging Protocol');
		await publicLinkPOM.imageViewer.changeLayoutBtn().click();
		await publicLinkPage.waitForTimeout(1000);
		await publicLinkPOM.imageViewer.hangingProtocol().click();
		await publicLinkPage.waitForTimeout(1000);

		const defaultCtHpNames = [
			'CT Abdo-Pelvis',
			'CT KUB URO',
			'CT Chest',
			'CT Chest + Prior',
			'CT Brain',
			'CT Brain + Priors',
			'CT Ext & Spine',
		];

		for (const hpName of defaultCtHpNames) {
			await expect(
				publicLinkPage.getByTestId('HangingProtocolsSection').getByLabel(hpName).first()
			).toBeVisible();
		}

		// Clean up - close the new context
		await newContext.close();
	});
});

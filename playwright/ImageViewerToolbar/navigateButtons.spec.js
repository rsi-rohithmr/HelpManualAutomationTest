const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC1 } = require('../POM/timeouts');

test.describe('ImageViewer Navigation Buttons', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudywithPrior().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Importing studies');

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testNavigateButtons/966.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testNavigateButtons/967.dcm')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId1),
		]);

		await poManager.loginPage.loginOmegaAI();
		await page.waitForTimeout(60000);
		await page.route('**/Patient/**', async route => route.continue());
		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await poManager.apiWaitUtils.waitForAPI('/Patient/', 'GET');
	});

	test('Go Back to Worklist', async ({ page }) => {
		// Click the "Go Back" button in the Image Viewer
		const poManager = new POManager(page);

		await poManager.imageViewer.goBackBtn().click();
		await page.waitForTimeout(6000);
		// Verify that the worklist displays the patient name using a regex locator
		await expect(
			page
				.locator('[data-cy="study-status-table"] tbody>tr')
				.getByText(new RegExp(`^${studyInfo.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Click Done Button on Toolbar', async ({ page }) => {
		const poManager = new POManager(page);

		await page.waitForTimeout(2000);

		// Open study explorer and hover over the patient card icon
		await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
		// Verify that the patient link is visible.
		await expect(poManager.imageViewer.patientCardPatientLink3d()).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name')).toBeVisible();
		await poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name').hover();
		await page.waitForTimeout(2000);
		// Verify the patient card accession value contains "studyc" and is visible
		await expect(poManager.imageViewer.patientCardAccValue()).toHaveText(studyInfo.accessionNum);
		await expect(poManager.imageViewer.patientCardAccValue()).toBeVisible();

		// Click the "Done" button to return to the worklist
		await poManager.imageViewer.doneBtn().click();

		// Verify that the worklist displays the patient name
		await expect(
			page
				.locator('[data-cy="study-status-table"] tbody>tr')
				.getByText(new RegExp(`^${studyInfo.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Click Done & Open Next Button on Toolbar', async ({ page }) => {
		const poManager = new POManager(page);
		await page.waitForTimeout(2000);

		// Open study explorer and hover over the patient card icon
		await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
		await page.waitForLoadState('load'); // Waits for the full page to load
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name')).toBeVisible();
		await page.waitForTimeout(6000);
		await poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name').hover();
		await page.waitForTimeout(2000);
		// Verify that the patient card accession value contains "studyc" and is visible
		await expect(poManager.imageViewer.patientCardAccValue()).toHaveText(studyInfo.accessionNum);
		await expect(poManager.imageViewer.patientCardAccValue()).toBeVisible();

		// Click "Done & Open Next" to open the next study
		await poManager.imageViewer.doneOpenNextBtn().click();

		// Wait for the next study to load
		await poManager.imageViewer.waitPageToLoad();
		await page.waitForTimeout(2000);

		// Open study explorer and hover over the patient card icon again
		await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
		await poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name').hover();

		// Verify that the patient card accession value now contains "studyd" and is visible
		await expect(poManager.imageViewer.patientCardAccValue()).toHaveText(studyInfo.accessionNum1);
		await expect(poManager.imageViewer.patientCardAccValue()).toBeVisible();

		// Click "Done & Open Next" again to finish and return to worklist
		await poManager.imageViewer.doneOpenNextBtn().click();

		// Verify that the worklist displays the patient name
		await expect(
			page
				.locator('[data-cy="study-status-table"] tbody>tr')
				.getByText(new RegExp(`^${studyInfo.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});
});

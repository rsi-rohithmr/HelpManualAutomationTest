const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC1 } = require('../POM/timeouts');
test.describe('ImageViewer', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Importing studies');

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testImageViewer/4000.dcm')
		);

		await api.importDICOM(filePath, studyInfo.studyId);

		const poManager = new POManager(page);
		// Open the image viewer and wait for the page to load.
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);
		// await page.locator('[ready="true"]').waitFor({ state: 'visible' });
	});

	test('Patient Banner', async ({ page }, testInfo) => {
		const poManager = new POManager(page);
		// Check if a form is present by counting elements with the given test id.
		const nextCount = await poManager.documentViewer.getElementCount('[data-testid="next"]', TIMEOUT_IN_MSEC1);
		if (nextCount > 0) {
			await page.waitForTimeout(2000);
			console.log(await poManager.documentViewer.getElementCount('[data-testid="next"]', TIMEOUT_IN_MSEC1));
			console.log('Fill the form and submit - Start');
			// Click on the first toggle input and then click the "next" button.
			await page.locator('input.PrivateSwitchBase-input').first().click();
			await page.locator('[data-testid="next"]', { timeout: TIMEOUT_IN_MSEC1 }).click();
		} else {
			console.log('Form does not exist');
		}

		// Check the retry count. (testInfo.retry is the number of retries so far.)
		const attempt = testInfo.retry;
		console.log('Retry count: ' + attempt);
		if (attempt > 0) {
			const countNormal = await poManager.documentViewer.getElementCount(
				'.SeriesDrawerPatientCardNormal',
				TIMEOUT_IN_MSEC1
			);
			if (countNormal > 0) {
				await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
			}
		}

		// Collapse the left section if it is expanded
		await poManager.imageViewer.closeLeftSection();

		// Verify that the patient banner shows the correct name and the link has the correct href.
		await expect(poManager.imageViewer.patientBannerName(studyInfo.patientName)).toBeVisible();
		const bannerLink = poManager.imageViewer.patientBannerLink();
		await expect(bannerLink).toBeVisible();
		await expect(bannerLink).toHaveAttribute('href', '/patient/' + studyInfo.patientId);
	});

	test('Patient Card', async ({ page }) => {
		const poManager = new POManager(page);
		// Expand the left section.
		await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
		// Verify that the patient link is visible.
		await expect(poManager.imageViewer.patientCardPatientLink3d()).toBeVisible();

		// Check patient name and birthdate fields.
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name')).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyValueInfo3d(studyInfo.patientName)).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Date of Birth')).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyValueInfo3d(studyInfo.patientBirthday)).toBeVisible();

		// Verify Patient ID – note the original logic always takes the first branch.
		const patientID = await poManager.imageViewer.patientCardPatientStudyPatientIDVerification('Patient ID');
		if (patientID !== studyInfo.patientId) {
			console.log('patient ID is null for the study', studyInfo.patientName);
		} else {
			// This branch may never be hit due to the OR condition.
			await poManager.imageViewer.patientCardPatientStudyPatientIDVerification(studyInfo.patientId);
			console.log('patient ID is not null for the study', studyInfo.patientName);
		}

		await poManager.imageViewer.patientCardPatientStudyInfo3d('Patient Name').hover();

		// Verify additional patient card info.
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Confidentiality')).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Accession')).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyValueInfo3d(studyInfo.accessionNum)).toBeVisible();
		await expect(poManager.imageViewer.patientCardPatientStudyInfo3d('Phone number')).toBeVisible();
	});

	test('Study Explorer', async ({ page }) => {
		const poManager = new POManager(page);
		// Verify that the series icon has the correct data-testid attribute.
		await page.route('**/thumbnail?BlumePatientId*', async route => route.continue());
		// Expand the left section.
		await Promise.all([
			poManager.imageViewer.leftSectionExpandBtn().click({ force: true }),
			// poManager.apiWaitUtils.waitForAPI('thumbnail?BlumePatientId', 'GET'),
			await page.waitForTimeout(1000),
			await poManager.imageViewer.assertFrameCountIs('1'),			
		]);
		await expect(poManager.imageViewer.seriesStudiesExplorerIcon3d().first()).toHaveAttribute(
			'data-testid',
			'TurnedInSharpIcon'
		);
	});

	// test.skip('Studies Tab', async ({ page }) => {
	// 	const poManager = new POManager(page);
	// 	// This test is skipped. If enabled, it would verify that study thumbnails and expansion/collapse work.
	// 	await expect(poManager.imageViewer.seriesStudiesExplorerThumbnails3d()).toBeVisible();
	// 	await expect(poManager.imageViewer.expandLessIcon()).toBeVisible();
	// 	await poManager.imageViewer.clickOnThumbnaildetails().click();
	// 	await expect(poManager.imageViewer.seriesThumbnail()).not.toBeVisible();
	// 	await poManager.imageViewer.leftSectionExpandBtn().click({ force: true });
	// });

	test('Topbar Buttons', async ({ page }) => {
		const poManager = new POManager(page);
		// Verify that the layout change button is visible and click it twice.
		await expect(poManager.imageViewer.changeLayoutBtn()).toBeVisible();
		await poManager.imageViewer.changeLayoutBtn().click({ force: true });
		await poManager.imageViewer.changeLayoutBtn().click({ force: true });
		// Verify that the grid now contains 9 items (3x3 layout).
		const gridItems = poManager.imageViewer.gridItem();
		await expect(gridItems).toHaveCount(9);
		// Verify that the share button is visible and click it.
		await expect(poManager.imageViewer.shareBtn()).toBeVisible();
		await poManager.imageViewer.shareBtn().click();
	});
});

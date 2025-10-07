const { test, expect, request, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const fs = require('fs');
const playwrightConfig = require('../../playwright.config');

test.describe.serial('Study merge and unmerge', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let poManager;

	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudywithPrior().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testNavigateButtons/967.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testNavigateButtons/968.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/studyMerge/06-3.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/studyMerge/06-2.dcm')
		);

		await Promise.all([
			await api.importDICOM(filePath3, studyInfo.studyId1),
			await api.importDICOM(filePath2, studyInfo.studyId1),
			await api.importDICOM(filePath1, studyInfo.studyId),
			await api.importDICOM(filePath, studyInfo.studyId),
		]);
		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await page.route('**/Patient/**', async route => route.continue());
		// Open the Image Viewer and wait for the page to load
		await Promise.all([
			await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName),
			poManager.apiWaitUtils.waitForAPI('/Patient/', 'GET', 120000),
		]);
		await poManager.imageViewer.waitPageToLoad();
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);		
	});

	test('Verify merge and unmerge', async ({ page }) => {
		await poManager.imageViewer.mergeStudy(poManager);
		const currentStudySeries = page.locator('[role="region"]').nth(0).locator('[data-testid="series"]');
		const priorStudySeries = page.locator('[role="region"]').nth(1).locator('[data-testid="series"]');
		//verification
		await expect(currentStudySeries).toHaveCount(2);
		// await expect(page.getByRole('button', { name: '08/18/2020 CT\\PT\\MR STUDY' })).toBeVisible();
		await expect(poManager.imageViewer.studyAccordion('1')).not.toBeVisible();
		await expect(page.getByRole('button', { name: '08/18/2020 CT\\MR STUDY' })).not.toBeVisible();
		//study unmerge
		await page.getByTestId('ImageViewerLayoutWrapper').getByTestId('collapse-button').hover();
		await page.route('**/dicomweb/unmergeById/*', async route => route.continue());
		await page.getByTestId('unmerge-button').click();
		//verification
		await poManager.apiWaitUtils.waitForAPI('/dicomweb/unmergeById/', 'POST');
		await expect(currentStudySeries).toHaveCount(1);
		await poManager.imageViewer.studyAccordion('1').click();
		await expect(priorStudySeries).toHaveCount(1);
		await expect(page.getByRole('button', { name: '08/18/2020 MR STUDY' })).toBeVisible();
		await expect(page.getByRole('button', { name: '08/18/2020 PT STUDY' })).toBeVisible();
	});
});

const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
const { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2 } = require('../POM/timeouts');

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let browserContext;
let page;

test.describe('Delete Frames From Series', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch();
		page = await browserContext.newPage();

		// Prepare the study
		await api.postStudy().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
		
		// Import images to the study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testDeleteFrames/IM-0003-0001.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testDeleteFrames/IM-0003-0002.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testDeleteFrames/IM-0003-0003.dcm')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId),
			await api.importDICOM(filePath2, studyInfo.studyId),
		]);

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);
	});

	test('Delete Frames From Series', async () => {
		const poManager = new POManager(page);
		// Change layout to 1 by 1 and wait for the layout to settle
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		await page.waitForTimeout(1000);
		// Wait for the ImageViewerViewportCornerstone to be available
		await page.waitForSelector('[data-testid="ImageViewerViewportCornerstone"]', { timeout: 3000 });
		// Expand Study Explorer
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.assertFrameCountIs('3');
		//click on Cancel button
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.deleteFramesBtn().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.cancelDialogButton().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.assertFrameCountIs('3');
		//click on Delete Current Frame button
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.deleteFramesBtn().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.deleteCurrentFrameButton().click({ force: true });
		await page.waitForTimeout(6000);
		await poManager.imageViewer.assertFrameCountIs('2');
		//click on Delete Current Series button
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.deleteFramesBtn().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.deleteCurrentSeriesButton().click({ force: true });
		await page.waitForTimeout(1000);
		const studySeries = await poManager.imageViewer.studyExplorerSeriesStudy();
		await page.waitForTimeout(6000);
		await expect(studySeries).toBeHidden();
	});
});
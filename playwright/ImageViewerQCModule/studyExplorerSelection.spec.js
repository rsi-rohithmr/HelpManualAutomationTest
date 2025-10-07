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

test.describe('Study Explorer Selection', () => {
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
			path.join(__dirname, '../TestData/dicomImport/SESelection/2.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/SESelection/3.dcm')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId),
		]);

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);
	});

	test('Study Explorer Selection', async () => {
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
		// The first frameset should be selected
		await poManager.imageViewer.studyExplorerSeriesStudy(0).hover();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.framesetSelectionCheckbox(0).click({ force: true });
		await page.waitForTimeout(1000);
		const firstFrameset = poManager.imageViewer.studyExplorerSeriesStudy(0);
		const firstIcon = firstFrameset.locator('[data-testid="CheckCircleRoundedIcon"]');
		await expect(firstIcon).toBeVisible();
		// The second frameset should not be selected
		const secondFrameset = poManager.imageViewer.studyExplorerSeriesStudy(1);
		await secondFrameset.hover();
		await page.waitForTimeout(1000);
		const secondIcon = secondFrameset.locator('[data-testid="CheckCircleRoundedIcon"]');
		await expect(secondIcon).not.toBeVisible();		
	});
});
const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
let studyInfo;
let browserContext;
let page;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe.serial('ImageViewer QCModel', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch({ channel: 'chrome' });
		page = await browserContext.newPage();
		await api.postStudywithPrior().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Import study to the organization');
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/Reparent1/1111243-1.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/Reparent1/1111403-4.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/Reparent2/1001.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/Reparent2/1002.dcm')
		);

		await Promise.all([
			api.importDICOM(filePath3, studyInfo.studyId1),
			api.importDICOM(filePath2, studyInfo.studyId1),
			api.importDICOM(filePath1, studyInfo.studyId),
			api.importDICOM(filePath, studyInfo.studyId),
		]);

		await page.waitForTimeout(60000); // 60-second wait for potential sync delay
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);		
	});

	test('Reparent series', async ({}) => {
		const poManager = new POManager(page);
		await page.route('**/reparent/**', async route => {
			await route.continue();
		});

		await page.waitForTimeout(2000);

		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);

		await poManager.imageViewer.studyAccordion(1).click();
		await page.waitForTimeout(4000);

		const dragElement = await poManager.imageViewer.studyExplorerSeriesStudy();
		const dropElement = await poManager.imageViewer.studyExplorerDroppableArea(1);

		// Ensure both draggable and drop target are visible
		await expect(dragElement).toBeVisible();
		await expect(dropElement).toBeVisible();

		await page.waitForTimeout(2000);

		await Promise.all([
			// Perform drag and drop
			dragElement.dragTo(dropElement),
			// Validate API call success
			poManager.apiWaitUtils.waitForAPI(`/reparent/`, 'POST'),
		]);
	});
});

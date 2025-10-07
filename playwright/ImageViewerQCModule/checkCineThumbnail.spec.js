const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
let studyInfo;
let browserContext;
let page;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe.serial('Study explorer cine image', () => {
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
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/dicomImport/cine.dcm'));
		await api.importDICOM(filePath, studyInfo.studyId);

		await page.waitForTimeout(60000); // 60-second wait for potential sync delay
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);		
	});

	test('Check cine thumbnail', async ({}) => {
		const poManager = new POManager(page);

		await page.waitForTimeout(2000);

		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);

		await poManager.imageViewer.studyAccordion(1).click();
		await page.waitForTimeout(4000);

		const seriesThumbnail = await poManager.imageViewer.studyExplorerSeriesThumbnail();

		// Ensure both draggable and drop target are visible
		await expect(seriesThumbnail).toBeVisible();
	});
});

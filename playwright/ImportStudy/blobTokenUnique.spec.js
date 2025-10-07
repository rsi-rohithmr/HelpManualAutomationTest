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
const seriesUID = '1.2.124.113540.0.20050726654.3.4446.4.4';
const seriesUID1 = '1.2.124.113540.1.3.3252941001.2636.1717490204.301';
const instanceUID = '1.2.124.113540.1.4.1765208552.2676.1151093921.6030';
const instanceUID1 = '1.2.124.113540.1.4.3252941001.2636.1717490209.352';

test.describe('blobTokenUnique', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudywithPrior().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Import study to the organization');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/blobTokenUnique/1.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/blobTokenUnique/2.dcm')
		);

		await Promise.all([
			api.importDICOM(filePath1, studyInfo.studyId),
			api.importDICOM(filePath2, studyInfo.studyId1),
		]);

		await page.waitForTimeout(20000); // 20-second wait for potential sync delay
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Reparent series', async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		const poManager = new POManager(page);

		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo.patientName);
		await poManager.homePage.filterStudiesBySingleColumn('Accession #', studyInfo.accessionNum);

		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true);
		await page.waitForTimeout(2000);
		await poManager.imageViewer.leftSectionExpandBtn().click();
		await page.waitForTimeout(2000);
		await poManager.imageViewer.studyAccordion(1).click();
		await page.waitForTimeout(4000);

		// Ensure both draggable and drop target are visible
		const dragElement = await poManager.imageViewer.studyExplorerSeriesStudy();
		const dropElement = await poManager.imageViewer.studyExplorerDroppableArea(1);
		await expect(dragElement).toBeVisible();
		await expect(dropElement).toBeVisible();
		await page.waitForTimeout(3000);

		await Promise.all([
			// Perform drag and drop
			dragElement.dragTo(dropElement),
			// Validate API call success
			poManager.apiWaitUtils.waitForAPI(`/reparent/`, 'POST'),
		]);

		// Import to study 1 again
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/blobTokenUnique/1.dcm')
		);

		await api.importDICOM(filePath1, studyInfo.studyId);
		await page.waitForTimeout(20000);

		console.log('checking blob token');
		await api.getInstanceInfo(studyInfo.studyUID, seriesUID, instanceUID, managingOrgId).then(result => {
			console.log('instance info result', result);
			let localFileID = result[0]["31891010"].Value[0];
			const splitValues = localFileID.split("/");

			// Check if there are exactly 5 items
			expect(splitValues.length).toBe(5);
		});
	});
});
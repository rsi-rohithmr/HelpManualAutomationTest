const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

const managingOrgName = playwrightConfig.managingOrg.organizationName;
const patientName = 'FREDWHITEWOOD';

test.describe('Drag Drop Series To Maxmized Layout', async () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		console.log('Import study to the organization');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/dragSeriesToMaxLayout/FREDWHITEWOOD1.DCM')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/dragSeriesToMaxLayout/FREDWHITEWOOD3.DCM')
		);
		console.log('Importing: FREDWHITEWOOD1');
		await api.importStudyToManaginOrg(filePath1);
		console.log('Importing: FREDWHITEWOOD3');
		await api.importStudyToManaginOrg(filePath3);
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(patientName, managingOrgName);
		await page.waitForTimeout(2000);
	});

	test('Drag Drop Series To Maxmized Layout', async ({ page }) => {
		const poManager = new POManager(page);
		// Expand Study Explorer
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);	
		// Change To 1x2 layout
		await expect(poManager.imageViewer.changeLayoutBtn()).toBeVisible();
		await poManager.imageViewer.changeLayoutBtn().click({ force: true });
		await poManager.imageViewer.layoutGridItem(1, 2).click({ force: true });		
		await page.waitForTimeout(1000);
		// Double Click 2nd Layout To A Maximize Viewport
		await poManager.imageViewer.imageViewport().nth(1).dblclick();
		const count = await poManager.imageViewer.imageViewport().count();  
		expect(count).toEqual(1);
		await poManager.imageViewer.verifyImageDisplay(2);
		//Drag/Drop 1st Series To The Maximized Viewport
		const dragElement = await poManager.imageViewer.studyExplorerSeriesStudy();
		const dropElement = await poManager.imageViewer.imageViewport();
		await expect(dragElement).toBeVisible();
		await dragElement.dragTo(dropElement);
		await page.waitForTimeout(1000);
		await poManager.imageViewer.verifyImageDisplay(1);
	});
});
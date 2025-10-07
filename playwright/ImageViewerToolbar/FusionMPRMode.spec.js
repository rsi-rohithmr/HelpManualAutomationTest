const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Fusion/MPR Mode', () => {
	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Importing studies');

		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/CTAC1.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/CTAC2.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/CTAC3.dcm')
		);
		const filePath4 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/PETAC1.dcm')
		);
		const filePath5 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/PETAC2.dcm')
		);
		const filePath6 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/PETAC3.dcm')
		);

		await api.importDICOM(filePath1, studyInfo.studyId);
		await api.importDICOM(filePath2, studyInfo.studyId);
		await api.importDICOM(filePath3, studyInfo.studyId);
		await api.importDICOM(filePath4, studyInfo.studyId);
		await api.importDICOM(filePath5, studyInfo.studyId);
		await api.importDICOM(filePath6, studyInfo.studyId);

		await poManager.loginPage.loginOmegaAI();
		await page.waitForTimeout(20000);
		await page.route('**/Patient/**', async route => route.continue());
		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await poManager.apiWaitUtils.waitForAPI('/Patient/', 'GET');
	});
	test('Verify MPR and Fusion Mode Window Level', async ({ page }) => {
		const poManager = new POManager(page);

		console.log('Setting layout to 1x2');
		await poManager.imageViewer.changeLayoutBtn().click();
		await poManager.imageViewer.layoutGridItem(1, 2).click();
		await page.waitForTimeout(1000);

		await expect(page.locator('[data-testid="ImageViewerViewportCornerstone"]')).toHaveCount(2);

		let viewports = await poManager.imageViewer.getCornerstoneViewports();
		expect(viewports.length).toBe(2);

		const firstViewportWindowLevel = viewports[0].properties.voiRange;
		console.log('CT viewport window level:', firstViewportWindowLevel);

		console.log('Switching to MPR Mode');
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.MPRbutton().click();
		await page.waitForTimeout(5000);

		let mprViewports = await poManager.imageViewer.getCornerstoneViewports();
		expect(mprViewports.length).toBe(3);

		const firstMprViewportWindowLevel = mprViewports[0].properties.voiRange;
		console.log('First MPR viewport window level:', firstMprViewportWindowLevel);

		// Verify that the MPR viewport's window level is SIMILAR to the first viewport's window level
		expect(Math.abs(firstMprViewportWindowLevel.lower - firstViewportWindowLevel.lower)).toBeLessThan(5);
		expect(Math.abs(firstMprViewportWindowLevel.upper - firstViewportWindowLevel.upper)).toBeLessThan(5);

		console.log('Exiting Fusion Mode');
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.MPRbutton().click();
		await page.waitForTimeout(2000);

		const secondViewportWindowLevel = viewports[1].properties.voiRange;
		console.log('PET viewport window level:', secondViewportWindowLevel);

		console.log('Switching to Fusion Mode');
		await poManager.imageViewer.expandLessIcon().hover({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.FusionButton().click();
		await page.waitForTimeout(5000);

		let fusionViewports = await poManager.imageViewer.getCornerstoneViewports();
		expect(fusionViewports.length).toBe(4);

		const firstFusionViewportWindowLevel = fusionViewports[0].properties.voiRange;
		console.log('First Fusion viewport window level:', firstFusionViewportWindowLevel);

		// Verify that the Fusion viewport's window level is SIMILAR to the first viewport's window level
		expect(Math.abs(firstFusionViewportWindowLevel.lower - secondViewportWindowLevel.lower)).toBeLessThan(5);
		expect(Math.abs(firstFusionViewportWindowLevel.upper - secondViewportWindowLevel.upper)).toBeLessThan(5);

		console.log('Exiting Fusion Mode');
		await page.locator('[data-testid="ElectricalServicesIcon"]').click({ force: true });
		await page.waitForTimeout(2000);
	});
});

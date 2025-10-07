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

test.describe('ImageViewer US Images', () => {
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
		
		// Import US images to the study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testUSImages/US_2Regions.dcm')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
		]);

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
	});

	test('Length tool value should show correct unit', async () => {
		// Change layout to 1 by 1 and wait for the layout to settle
		// await page.waitForTimeout(2000);
		// await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		// await page.waitForTimeout(200);
		// await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		await poManager.imageViewer.initLayoutTo1x1();
		// Wait for the ImageViewerViewportCornerstone to be available
		await page.waitForSelector('[data-testid="ImageViewerViewportCornerstone"]', { timeout: 5000 });
		const firstViewport = page.locator('[data-testid="ImageViewerViewportCornerstone"]').first();

		// Click on the first viewport with the right mouse button
		await firstViewport.click({ button: 'right', force: true });
		await page.waitForTimeout(200);

		// Click on MarkupMode, and then click on Length tool
		await poManager.imageViewer.controlWheelMarkupMode().click({ force: true });
		await page.waitForTimeout(200);
		await poManager.imageViewer.controlWheelLength().click({ force: true });
		console.log('Length Tool Clicked');

		await page.waitForTimeout(200);
		const boundingBox = await firstViewport.boundingBox();
		const centerX = boundingBox.x + boundingBox.width / 2;
		const centerY = boundingBox.y + boundingBox.height / 2;

		// Move 200px to the left of the center (left region) and draw the line
		await page.mouse.move(centerX - 200, centerY);
		await page.mouse.down();
		await page.mouse.move(centerX - 100, centerY, { steps: 1 }); // draw the line
		await page.mouse.up();
		await page.waitForTimeout(200);
		let viewportInnerText = await firstViewport.innerText({ timeout: TIMEOUT_IN_MSEC1 });
		expect(viewportInnerText).toContain('px');
		expect(viewportInnerText).not.toContain('cm US Region');

		// Move 200px to the right of the center (right region) and draw the line
		await page.mouse.move(centerX + 200, centerY);
		await page.mouse.down();
		await page.mouse.move(centerX + 300, centerY, { steps: 1 }); // draw the line
		await page.mouse.up();
		await page.waitForTimeout(200);
		viewportInnerText = await firstViewport.innerText({ timeout: TIMEOUT_IN_MSEC1 });
		expect(viewportInnerText).toContain('cm US Region');

		// Click on MarkupMode, and then click on Probe tool
		await firstViewport.click({ button: 'right', force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.controlWheelMarkupMode().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.controlWheelProbe().click({ force: true });
		console.log('Probe Tool Clicked');
		await page.waitForTimeout(1000);
		page.mouse.click(centerX - 300, centerY, { button: 'left', delay: 100 });
		await page.waitForTimeout(1000);
		viewportInnerText = await firstViewport.innerText({ timeout: TIMEOUT_IN_MSEC2 });
		expect(viewportInnerText).toContain('seconds');
	});
});
const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('PT SUV Measurement', () => {
	let apiContext;
	let api;

	test.beforeAll(async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);
	});

	test.beforeEach(async ({ page }) => {
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});

		console.log('Importing studies');

		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/dicomImport/PtSuv/1.dcm'));

		await api.importDICOM(filePath, studyInfo.studyId);

		const poManager = new POManager(page);
		// Handling sync delay for uploaded study

		await poManager.loginPage.loginOmegaAI();
		await page.route('**/config?item=ImageViewer3DWheelSetting', async route => route.continue());
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName),
			poManager.apiWaitUtils.waitForAPI('config?item=ImageViewer3DWheelSetting', 'GET', 120000),
		]);
	});

	test('PtSuvMeasurements', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.openRightSection();
		await page.waitForTimeout(1000);

		const firstImageBox = await poManager.imageViewer.nthLayoutItem(0).boundingBox();
		console.log('First image box:', firstImageBox);

		if (firstImageBox) {
			console.log('Selecting RectangleROI tool');
			await poManager.imageViewer.nthLayoutItem(0).click({ button: 'right' });
			await page.waitForTimeout(1000);
			await poManager.imageViewer.controlWheelMarkupMode().click();
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelRectangleROIIcon().click();
			await page.waitForTimeout(1000);

			await page.mouse.down();
			await page.mouse.move(1000, 550, { steps: 10 });
			await page.mouse.up();
			await page.waitForTimeout(1000);
		} else {
			console.error('Image Box not found');
		}

		console.log('Test default');
		await expect(page.locator('[data-testid="SUV-Menu"]')).toBeVisible();
		let measurementText = await poManager.imageViewer.measurementText();
		expect(measurementText).toContain('Area');
		expect(measurementText).toContain('Perimeter');

		console.log('Cick on SUVbw');
		await page.getByRole('button', { name: 'SUVbw' }).click();
		await page.waitForTimeout(1000);

		measurementText = await poManager.imageViewer.measurementText();
		expect(measurementText).toContain('SUVbw Max');
		expect(measurementText).toContain('SUVbw Mean');

		console.log('Cick on SUVbsa');
		await page.getByTestId('change-unit-button').click({ force: true });
		await page.getByRole('button', { name: 'SUVbsa' }).click();
		await page.waitForTimeout(1000);

		measurementText = await poManager.imageViewer.measurementText();
		expect(measurementText).toContain('SUVbsa Max');
		expect(measurementText).toContain('SUVbsa Mean');

		console.log('Cick on SUVlbm');
		await page.getByTestId('change-unit-button').click({ force: true });
		await page.getByRole('button', { name: 'SUVlbm' }).click();
		await page.waitForTimeout(1000);

		measurementText = await poManager.imageViewer.measurementText();
		expect(measurementText).toContain('SUVlbm Max');
		expect(measurementText).toContain('SUVlbm Mean');

		console.log('Verify SUV menu will not show again and latest selection is cached');
		await page.mouse.move(625, 528);
		await page.mouse.down();
		await page.mouse.move(725, 628, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await expect(page.locator('[data-testid="SUV-Menu"]')).not.toBeVisible();
		measurementText = await poManager.imageViewer.measurementText();
		expect(measurementText).toContain('SUVlbm Max');
		expect(measurementText).toContain('SUVlbm Mean');
	});
});

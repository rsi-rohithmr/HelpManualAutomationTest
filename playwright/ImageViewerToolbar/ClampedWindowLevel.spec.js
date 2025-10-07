const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Clamped Window Level Tool Test', () => {
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

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/FusionMpr/PETAC1.dcm')
		);

		await api.importDICOM(filePath, studyInfo.studyId);

		await poManager.loginPage.loginOmegaAI();
		await page.waitForTimeout(20000);
		await page.route('**/Patient/**', async route => route.continue());
		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await poManager.apiWaitUtils.waitForAPI('/Patient/', 'GET');
	});
	test('Verify Clamped Window Level Tool behavior', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.imageViewer.initLayoutTo1x1();

		const windowLevelIcon = await page
			.locator('[data-testid="top-toolbar"] [data-testid="ContrastIconIcon"]')
			.isVisible();

		if (!windowLevelIcon) {
			// Add window level tool to toolbar
			await poManager.imageViewer.clickOnMoreOptions();
			await page.getByText('Settings').click();
			await page.waitForTimeout(1000);
			await page.getByText('Customize Toolbar').click();

			await expect(page.locator('[data-testid="toolgroup-container"]')).toBeVisible();
			await expect(
				page.locator('[data-testid="toolgroup-container"]  [data-testid="ContrastIconIcon"]')
			).toBeVisible();

			await page.locator('[data-testid="ContrastIconIcon"]').click();
			await page.locator('[data-testid="CloseIcon"]').click();
			await page.waitForTimeout(1000);
		}

		// Switch to Clamped Window Level tool
		await page
			.locator('[data-testid="top-toolbar"] [toolname="Window Level"] [data-testid="ArrowDropDownIcon"]')
			.click();
		await page.getByText('Clamped Window Level').click();

		await expect(page.locator('[data-testid="ColorMapBar"]')).toBeVisible();
		await page.getByLabel('X Rain').click();

		const firstImageBox = await poManager.imageViewer.nthLayoutItem(0).boundingBox();
		const originalViewport = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
		const originalWindowLevel = originalViewport.properties.voiRange;

		// Move mouse horizontally
		await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200, { steps: 10 });
		await page.mouse.down();
		await page.mouse.move(firstImageBox.x + 1000, firstImageBox.y + 200, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(1000);

		const newViewport_1 = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
		const newWindowLevel_1 = newViewport_1.properties.voiRange;

		expect(newWindowLevel_1.lower).toEqual(0);
		expect(newWindowLevel_1.upper).toBeGreaterThan(originalWindowLevel.upper);

		// Move mouse vertically
		await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200, { steps: 10 });
		await page.mouse.down();
		await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 1000, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(1000);

		const newViewport_2 = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
		const newWindowLevel_2 = newViewport_2.properties.voiRange;

		expect(newWindowLevel_2.lower).toEqual(0);
		expect(newWindowLevel_2.upper).toEqual(newWindowLevel_1.upper);

		// Move mouse diagonally
		await page.mouse.move(firstImageBox.x + 1000, firstImageBox.y + 200, { steps: 10 });
		await page.mouse.down();
		await page.mouse.move(firstImageBox.x + 100, firstImageBox.y + 900, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(1000);

		const newViewport_3 = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
		const newWindowLevel_3 = newViewport_3.properties.voiRange;
		expect(newWindowLevel_3.lower).toEqual(0);
		expect(newWindowLevel_3.upper).toBeLessThan(newWindowLevel_2.upper);
	});
});

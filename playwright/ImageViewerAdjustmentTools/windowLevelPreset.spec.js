const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
const { TIMEOUT_IN_MSEC4 } = require('../POM/timeouts');

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let browserContext;
let page;

test.describe.serial('ImageViewer Window Level Preset', () => {
	let windowPreset1;
	let windowPreset2;
	let defaultPresetName = 'Lung';
	const windowLevelValue1 = '1000';
	const windowLevelValue2 = '500';
	const windowWidthValue1 = '2000';
	const windowWidthValue2 = '1000';
	const defaultWLValue = -600;
	const defaultWWValue = 1500;

	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch();
		page = await browserContext.newPage();
		await api.postStudy().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
		// Generate a random number between 1111 and 9999
		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		windowPreset1 = `Test Window Preset ${randomNum}`;
		windowPreset2 = `Update Window Preset ${randomNum}`;
		console.log('Import study to the organization');
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testWindowLevel/ARTIFIXIMAGE1.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testWindowLevel/ARTIFIXIMAGE2.dcm')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId),
		]);
		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
	});
	test('Add Window Level Preset', async ({}) => {
		// Open Image Control Wheel by right-clicking (center click is default in Playwright)
		await poManager.imageViewer.highlightedViewport().click({ button: 'right' });
		// Select the W/L Tool
		await poManager.imageViewer.wheelTuneIcon().hover();
		await poManager.imageViewer.wheelTuneIcon().click();
		await poManager.imageViewer.controlWheelWindowLevel().click({ force: true });

		// Open the W/L Presets Menu by clicking twice on the highlighted viewport
		await poManager.imageViewer.highlightedViewport().click({ force: true, position: { x: 0.5, y: 0.5 }, delay: 200 /** long click */ });
		await expect(poManager.imageViewer.windowPresetMenu()).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });

		// Open the W/L Configuration Drawer
		await poManager.imageViewer.configurePresetsBtn().click();
		// Add a new W/L Preset
		await poManager.imageViewer.addWLPresetBtn().click();
		await poManager.imageViewer.presetNameInputField().fill(windowPreset1);
		await poManager.imageViewer.windowLevelInputField().fill(windowLevelValue1);
		await poManager.imageViewer.windowWidthInputField().fill(windowWidthValue1);
		await poManager.imageViewer.windowLevelConfigSaveBtn().click();
	});

	test('Verify Window Level Preset on W/L Configuration Drawer and Presets Menu', async ({}) => {
		// Verify the preset is visible in the configuration drawer
		await expect(poManager.imageViewer.windowLevelConfigDrawer().locator(`text=${windowPreset1}`)).toBeVisible({
			timeout: TIMEOUT_IN_MSEC4,
		});
		await poManager.imageViewer.windowLevelConfigDrawerCloseBtn().click();
		// Re-open the presets menu
		await poManager.imageViewer.highlightedViewport().click({ timeout: TIMEOUT_IN_MSEC4, delay: 200 /** long click */ });
		await expect(poManager.imageViewer.windowPresetMenu()).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		await expect(poManager.imageViewer.windowPresetMenu().locator(`text=${windowPreset1}`)).toBeVisible({
			timeout: TIMEOUT_IN_MSEC4,
		});
	});

	test('Apply Window Level Preset', async ({}) => {
		// Click the preset in the presets menu
		await poManager.imageViewer.windowPresetMenu().locator(`text=${windowPreset1}`).click();
		await poManager.imageViewer.verifyImageDisplay(1);
		// Verify the window level overlay is displayed with the expected values
		await expect(await poManager.imageViewer.windowLevelOverlay(windowWidthValue1, windowLevelValue1)).toBeVisible();
		// Scroll to bottom and verify again
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect(await poManager.imageViewer.windowLevelOverlay(windowWidthValue1, windowLevelValue1)).toBeVisible();
		// Scroll to top and verify once more
		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(await poManager.imageViewer.windowLevelOverlay(windowWidthValue1, windowLevelValue1)).toBeVisible();
	});

	test('Modify Window Level Preset', async ({}) => {
		// Re-open the presets menu
		await poManager.imageViewer.highlightedViewport().click({ timeout: TIMEOUT_IN_MSEC4, delay: 200 /** long click */});
		await expect(poManager.imageViewer.windowPresetMenu()).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		// Open the configuration drawer
		await poManager.imageViewer.configurePresetsBtn().click();
		// Select the preset to modify
		await poManager.imageViewer.windowLevelConfigDrawer().locator(`text=${windowPreset1}`).click();
		// Update the preset name and values
		await poManager.imageViewer.presetNameInputField().fill(windowPreset2);
		await poManager.imageViewer.windowLevelInputField().fill(windowLevelValue2);
		await poManager.imageViewer.windowWidthInputField().fill(windowWidthValue2);
		await poManager.imageViewer.windowLevelConfigSaveBtn().click();
	});

	test('Delete Window Level Preset', async ({}) => {
		// Verify the modified preset is visible in the configuration drawer
		await expect(poManager.imageViewer.windowLevelConfigDrawer().locator(`text=${windowPreset2}`)).toBeVisible({
			timeout: TIMEOUT_IN_MSEC4,
		});
		// Delete the preset (assuming deleteWindowPreset handles clicking the appropriate delete button)
		await poManager.imageViewer.deleteWindowPreset(windowPreset2);
		await expect(poManager.imageViewer.windowLevelConfigDrawer().locator(`text=${windowPreset2}`)).toHaveCount(0);
		await poManager.imageViewer.windowLevelConfigDrawerCloseBtn().click();
		// Re-open the presets menu and verify the preset is no longer listed
		await poManager.imageViewer.highlightedViewport().click({ timeout: TIMEOUT_IN_MSEC4, delay: 200 /** long click */});
		await expect(poManager.imageViewer.windowPresetMenu()).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		await expect(poManager.imageViewer.windowPresetMenu().locator(`text=${windowPreset2}`)).toHaveCount(0);
		// Close the presets menu
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		console.log('Preset deleted successfully');
	});

	test('Apply Default Preset', async ({}) => {
		//Setup viewport to 2x2 layout
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		try {
			//ensure the layout setting grid is visible
			await expect(poManager.imageViewer.layoutSettingGrid()).toBeVisible();
		}
		catch (e) {
			//if the layout setting grid is not visible, click on the change layout button again
			await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		}
		await poManager.imageViewer.layoutGridItem(2, 2).click({ force: true });
		await page.waitForTimeout(1000);
		// Open Image Control Wheel by right-clicking (center click is default in Playwright)
		await poManager.imageViewer.highlightedViewport().click({ button: 'right' });
		// Select the W/L Tool
		await poManager.imageViewer.wheelTuneIcon().hover();
		await poManager.imageViewer.wheelTuneIcon().click();
		await poManager.imageViewer.controlWheelWindowLevel().click({ force: true });
		// Open the W/L Presets Menu by clicking twice on the highlighted viewport
		await poManager.imageViewer.highlightedViewport().click({ force: true, position: { x: 0.5, y: 0.5 }, delay: 200 /** long click */ });
		await expect(poManager.imageViewer.windowPresetMenu()).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		// Select a default preset
		await poManager.imageViewer.defaultPresetBtn(defaultPresetName).click();
		await poManager.imageViewer.verifyImageDisplay(1);
		// Verify the window level overlay is displayed with the expected values
		await poManager.imageViewer.verifyWLAppliedOnViewport(0, defaultWWValue, defaultWLValue);
		// Scroll to bottom and verify again
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await poManager.imageViewer.verifyWLAppliedOnViewport(0, defaultWWValue, defaultWLValue);
		// Scroll to top and verify once more
		await page.evaluate(() => window.scrollTo(0, 0));
		await poManager.imageViewer.verifyWLAppliedOnViewport(0, defaultWWValue, defaultWLValue);
	});
});

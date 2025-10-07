const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC1 } = require('../POM/timeouts');

const viewCodeList = [
	'Burn Study',
	'Toggles',
	'Link Series',
	'Download',
	'Settings',
	'Popout in Window',
	'Fullscreen Mode',
];

test.describe('ImageViewer', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeEach(async ({ page }) => {
		// Initialize the POManager with the Playwright page
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
			path.join(__dirname, '../TestData/dicomImport/testMoreOptions/ELIZABETHI1.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testMoreOptions/ELIZABETHI2.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testMoreOptions/ELIZABETHI3.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testMoreOptions/ELIZABETHI4.dcm')
		);
		await Promise.all([
			api.importDICOM(filePath, studyInfo.studyId),
			api.importDICOM(filePath1, studyInfo.studyId),
			api.importDICOM(filePath2, studyInfo.studyId),
			api.importDICOM(filePath3, studyInfo.studyId),
		]);

		await poManager.loginPage.loginOmegaAI();

		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await poManager.imageViewer.waitPageToLoad();
	});

	test('More options list validation', async ({ page }) => {
		const poManager = new POManager(page);
		// Open the More Options menu
		await poManager.imageViewer.clickOnMoreOptions();
		console.log('Click on more options');

		// Get the list of option elements (assumed to return a Locator)
		const moreOptionsLocator = poManager.imageViewer.moreOptionsCrossCheck();
		const count = await moreOptionsLocator.count();
		console.log('length of list', count);

		// Validate that each item’s text matches the expected list
		for (let i = 0; i < count; i++) {
			const text = await moreOptionsLocator.nth(i).innerText();
			expect(text).toBe(viewCodeList[i]);
		}

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click();
	});

	test('Click on Toggle', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Click on the "Toggles" option (force click if needed)
		await poManager.imageViewer.clickOnToggles().click({ force: true });

		// Verify that "Overlay" is visible
		await expect(page.locator('[role="menuitem"]').getByText('Overlay')).toBeVisible();

		// Verify that "Scout Lines" is not visible (or does not exist)
		await expect(page.locator('text=Scout Lines')).toHaveCount(0);

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});

	test('Click on Link Series', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Click on the "Link Series" option
		await poManager.imageViewer.clickOnLinkSeries().click();

		// Verify that "Unlink", "Manual Link" and "Plane Link" options are visible
		await expect(page.locator('text=Unlink')).toBeVisible();
		await expect(page.locator('text=Manual Link')).toBeVisible();
		await expect(page.locator('text=Plane Link')).toBeVisible();

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});

	test('Click on Download', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Click on the "Download" option (using force if necessary)
		await poManager.imageViewer.downloadOption().click({ force: true });

		// Verify that both "Download Image" and "Download Study" are visible
		await expect(page.locator('text=Download Image')).toBeVisible();
		await expect(page.locator('text=Download Study')).toBeVisible();

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});

	test('Click on Settings', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Click on the "Settings" option (with a timeout if needed)
		await page.locator('text=Settings').click({ timeout: TIMEOUT_IN_MSEC1 });

		// Verify the visibility of the settings options
		await expect(page.locator('text=Hanging protocol')).toBeVisible();
		await expect(page.locator('text=Customize Overlays')).toBeVisible();
		await expect(page.locator('text=Customize Wheel')).toBeVisible();
		await expect(page.locator('text=DICOM Header Tags')).toBeVisible();
		await expect(page.locator('text=Reset Markup Tool')).toBeVisible();
		await expect(page.locator('text=Autohide Viewport Menu')).toBeVisible();
		await expect(page.locator('text=About Image Viewer')).toBeVisible();

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});

	test('Verify Popout in Window option', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Verify that "Popout in Window" is visible
		await expect(page.locator('text=Popout in Window')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});

	test('Verify Fullscreen Mode option', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();

		// Verify that "Fullscreen Mode" is visible
		await expect(page.locator('text=Fullscreen Mode')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

		// Close the More Options menu
		await poManager.imageViewer.minimiseMoreOption().click({ force: true });
	});
});

const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');

const managingOrgName = playwrightConfig.managingOrg.organizationName;
const patientName = 'MELANIX';
const station = 'CT48545';

// let randomNum;
const randomNum = faker.datatype.number({
	min: 111111,
	max: 999999,
});

test.describe('Customize Overlays', async () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		console.log('Import study to the organization');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/customizeOverlays/MELANIX.dcm')
		);
		console.log('Importing: MELANIX.dcm');
		await api.importStudyToManaginOrg(filePath1);
		const poManager = new POManager(page);
		// await page.waitForTimeout(2000);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(patientName, managingOrgName);
		await page.waitForTimeout(2000);
	});

	test('Customize Overlays in Detailed Tier', async ({ page }) => {
		const poManager = new POManager(page);
		//Open Customize Overlays Detailed Tier
		await poManager.imageViewer.clickOnMoreOptions();
		await page.click('text=Settings');
		await expect(page.locator('text=Customize Overlays')).toBeVisible();
		await poManager.imageViewer.customizeOverlaysOption().click();
		//Add a customize overlay and a Dicom tag 'Station Name'
		await poManager.imageViewer.insertDicomTagField(1).click();
		await page.keyboard.press('Enter');
		await poManager.imageViewer.insertDicomTagField(1).type(`NewCustomizedOL${randomNum}#station`);
		await poManager.imageViewer.insertDicomTagField(1).press('Enter');
		await poManager.imageViewer.saveOverlayBtn().click();
		await poManager.imageViewer.backBtn().click();
		await page.waitForTimeout(3000);
		//Setup viewport layout to 1x1 to use Detailed Tier
		await expect(poManager.imageViewer.changeLayoutBtn()).toBeVisible();
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		await page.waitForTimeout(3000);
		//Verify overlays display on viewport with the expected values
		await page.locator(`NewCustomizedOL${randomNum}`).isVisible();
		await page.locator(`${station}`).isVisible();
		//Delete the overlays from Customize Overlays Detailed Tier
		await poManager.imageViewer.clickOnMoreOptions();
		await page.click('text=Settings');
		await expect(page.locator('text=Customize Overlays')).toBeVisible();
		await poManager.imageViewer.customizeOverlaysOption().click();
		await poManager.imageViewer.insertDicomTagField(1).click();
		await poManager.imageViewer.deleteOverlays(`NewCustomizedOL${randomNum}`);
		await poManager.imageViewer.saveOverlayBtn().click();
		await poManager.imageViewer.backBtn().click();
		await page.waitForTimeout(1000);
		//Verify the overlays no longer display on viewport
		await poManager.imageViewer.verifyImageDisplay(1);
		expect(page.locator(`NewCustomizedOL${randomNum}`)).not.toBeVisible();
	});

	test('Customize Overlays in Minimal Tier', async ({ page }) => {
		const poManager = new POManager(page);
		//Open Customize Overlays Minimal Tier
		await poManager.imageViewer.clickOnMoreOptions();
		await page.click('text=Settings');
		await expect(page.locator('text=Customize Overlays')).toBeVisible();
		await poManager.imageViewer.customizeOverlaysOption().click();
		await poManager.imageViewer.minimalTierIcon().click();
		await page.mouse.move(2000, 3000);
		//Add a customize overlay and a Dicom tag 'Station Name'
		await poManager.imageViewer.insertDicomTagField(0).click();
		await page.keyboard.press('Enter');
		await poManager.imageViewer.insertDicomTagField(0).type(`NewCustomizedOL${randomNum}#station`);
		await poManager.imageViewer.insertDicomTagField(0).press('Enter');
		await poManager.imageViewer.saveOverlayBtn().click();
		await poManager.imageViewer.backBtn().click();
		await page.waitForTimeout(1000);
		//Setup viewport layout to 3x2 to use Minimal Tier
		await expect(poManager.imageViewer.changeLayoutBtn()).toBeVisible();
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await poManager.imageViewer.layoutGridItem(3, 2).click({ force: true });
		await page.waitForTimeout(1000);
		//Verify overlays display on viewport with the expected values
		await poManager.imageViewer.verifyImageDisplay(1);
		await page.locator(`NewCustomizedOL${randomNum}`).isVisible();
		await page.locator(`${station}`).isVisible();
		//Delete the overlays from Customize Overlays Minimal Tier
		await poManager.imageViewer.clickOnMoreOptions();
		await page.click('text=Settings');
		await expect(page.locator('text=Customize Overlays')).toBeVisible();
		await poManager.imageViewer.customizeOverlaysOption().click();
		await poManager.imageViewer.minimalTierIcon().click();
		await page.mouse.move(2000, 3000);
		await poManager.imageViewer.insertDicomTagField(0).click();
		await poManager.imageViewer.deleteOverlays(`NewCustomizedOL${randomNum}`);
		await poManager.imageViewer.saveOverlayBtn().click();
		await poManager.imageViewer.backBtn().click();
		await page.waitForTimeout(1000);
		//Verify the overlays no longer display on viewport
		await expect(poManager.imageViewer.changeLayoutBtn()).toBeVisible();
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await poManager.imageViewer.layoutGridItem(3, 2).click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.verifyImageDisplay(1);
		expect(page.locator(`NewCustomizedOL${randomNum}`)).not.toBeVisible();
	});
});

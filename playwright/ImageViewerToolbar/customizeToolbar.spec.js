const path = require('path');
const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
//commenting out the import of patientGenerator as it is not used in this test and try to use the patient v2 patient generator
//const patientGenerator = require('../POM/patient/patientGenerator');

const viewCodeList = [
	'Burn Study',
	'Toggles',
	'Link Series',
	'Download',
	'Settings',
	'Popout in Window',
	'Fullscreen Mode',
];
let studyInfo = {
	patientName: 'ANZELMO ELIZABETH',
	patientId: '139433',
	patientBirthday: '1927-03-12',
	accession: '79424',
	confidentiality: '',
	patientPhone: '',
};
let browserContext;
let page;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe.serial('ImageViewer', () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// const patientGenerator = new PatientGenerator(page);
		// Create a shared browser context and page

		browserContext = await chromium.launch();
		page = await browserContext.newPage();
		console.log('Import study to the organization');
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
		console.log('Importing: 1.dcm');
		await api.importStudyToManaginOrg(filePath);
		console.log('Importing: 2.dcm');
		await api.importStudyToManaginOrg(filePath1);
		console.log('Importing: 1.dcm');
		await api.importStudyToManaginOrg(filePath2);
		console.log('Importing: 2.dcm');
		await api.importStudyToManaginOrg(filePath3);

		// await poManager.imageViewer.importStudy('dicomImport/testMoreOptions/ELIZABETHI1.dcm', managingOrgId);
		// await poManager.imageViewer.importStudy('dicomImport/testMoreOptions/ELIZABETHI2.dcm', managingOrgId);
		// await poManager.imageViewer.importStudy('dicomImport/testMoreOptions/ELIZABETHI3.dcm', managingOrgId);
		// await poManager.imageViewer.importStudy('dicomImport/testMoreOptions/ELIZABETHI4.dcm', managingOrgId);

		// const patientId = await patientGenerator.getPatientId(studyInfo.patientName, managingOrgId);
		// studyInfo.patientId = patientId[0].InternalPatientID;
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		// await poManager.imageViewer.waitPageToLoad();
	});

	test('Check Customize Toolbar Option on More menu', async ({}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.clickOnMoreOptions();
		await page.click('text=Settings');
		await expect(page.locator('text=Customize Toolbar')).toBeVisible();
	});

	test('Test Customize Toolbar Edit Page', async ({}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.customizeToolbarOption().click();
		await poManager.imageViewer.resetCustomizeToolbarBtn().click();
		await poManager.imageViewer.resetAllConfirmBtn().click();
	});

	test('Add Additional Tools to Toolbar', async ({}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.burnStudyBtn().click();
		await poManager.imageViewer.cineBtn().click();
		await poManager.imageViewer.copyBtn().click();
		await poManager.imageViewer.downloadBtn().click();
		await poManager.imageViewer.fusionBtn().click();
		await poManager.imageViewer.keyImageBtn().click();
		await poManager.imageViewer.linkBtn().click();
		await poManager.imageViewer.MPRBtn().click();
		await poManager.imageViewer.printBtn().click();
		await poManager.imageViewer.tileModeBtn().click();
		//Verify Additional Tools on Toolbar
		await expect(poManager.imageViewer.burnStudyBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.cineBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.copyBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.downloadBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.fusionBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.keyImageBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.linkBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.MPRBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.printBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.tileModeBtn().nth(0)).toBeVisible();
	});

	test('Remove Additional Tools from Toolbar', async ({}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.burnStudyBtn().nth(1).click({ force: true });
		await poManager.imageViewer.cineBtn().nth(1).click({ force: true });
		await poManager.imageViewer.copyBtn().nth(1).click({ force: true });
		await poManager.imageViewer.downloadBtn().nth(1).click({ force: true });
		await poManager.imageViewer.fusionBtn().nth(1).click({ force: true });
		await poManager.imageViewer.keyImageBtn().nth(1).click({ force: true });
		await poManager.imageViewer.linkBtn().nth(1).click({ force: true });
		await poManager.imageViewer.MPRBtn().nth(1).click({ force: true });
		await poManager.imageViewer.printBtn().nth(1).click({ force: true });
		await poManager.imageViewer.tileModeBtn().nth(1).click({ force: true });
	});

	test('Add Markup Tools on Toolbar Save Customize Toolbar Edit Page', async ({}) => {
		const poManager = new POManager(page);
		// Add Markup Tools on Toolbar
		await poManager.imageViewer.angleBtn().click();
		await poManager.imageViewer.annotateBtn().click();
		await poManager.imageViewer.bidirectionalBtn().click();
		await poManager.imageViewer.cardiothoracicBtn().click();
		await poManager.imageViewer.dragProbeBtn().click();
		await poManager.imageViewer.lengthBtn().click();
		await poManager.imageViewer.plumbLineBtn().click();
		await poManager.imageViewer.ROIBtn().click();
		await poManager.imageViewer.spineLabelingBtn().click();

		// Save the Customize Toolbar Edit Page
		await poManager.imageViewer.saveCustomizeToolbarPage().click();

		// Verify Markup Tools on Toolbar
		await expect(poManager.imageViewer.angleBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.annotateBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.bidirectionalBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.cardiothoracicBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.dragProbeBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.lengthBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.plumbLineBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.ROIBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.spineLabelingBtn().nth(0)).toBeVisible();
	});

	test('Test Reset All Changes', async ({}) => {
		const poManager = new POManager(page);

		await poManager.imageViewer.clickOnMoreOptions();
		await page.locator('text=Settings').click();
		await poManager.imageViewer.customizeToolbarOption().click();

		// Click Reset ALL
		await poManager.imageViewer.resetCustomizeToolbarBtn().click();
		await poManager.imageViewer.resetAllConfirmBtn().click();
		await poManager.imageViewer.saveCustomizeToolbarPage().click();

		// All Buttons Are Removed from Toolbar After Reset All
		await expect(poManager.imageViewer.angleBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.annotateBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.bidirectionalBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.cardiothoracicBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.dragProbeBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.lengthBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.plumbLineBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.ROIBtn()).not.toBeVisible();
		await expect(poManager.imageViewer.spineLabelingBtn()).not.toBeVisible();
	});

	test('Add Adjustment Tools to Toolbar', async ({}) => {
		const poManager = new POManager(page);

		await poManager.imageViewer.clickOnMoreOptions();
		await page.locator('text=Settings').click();
		await poManager.imageViewer.customizeToolbarOption().click();

		// Add Adjustment Tools on Toolbar
		await poManager.imageViewer.crosshairPointerBtn().click();
		await poManager.imageViewer.flipBtn().click();
		await poManager.imageViewer.invertBtn().click();
		await poManager.imageViewer.magnifyBtn().click();
		await poManager.imageViewer.panBtn().click();
		await poManager.imageViewer.rotateBtn().click();
		await poManager.imageViewer.shutterBtn().click();
		await poManager.imageViewer.stackScrollBtn().click();
		await poManager.imageViewer.windowLevelBtn().click();
		await poManager.imageViewer.zoomBtn().click();

		// Verify Adjustment Tools on Toolbar
		await expect(poManager.imageViewer.crosshairPointerBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.flipBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.invertBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.magnifyBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.panBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.rotateBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.shutterBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.stackScrollBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.windowLevelBtn().nth(0)).toBeVisible();
		await expect(poManager.imageViewer.zoomBtn().nth(0)).toBeVisible();
	});

	test('Test Undo Previous Changes', async ({}) => {
		const poManager = new POManager(page);

		// Click Undo on Customize Toolbar Edit Page
		await page.locator('[role="group"] .css-6xugel').hover();
		await poManager.imageViewer.undoCustomizeToolbarBtn().click();

		// Adjustment Tools Removed from Toolbar After Undo Previous
		await expect(poManager.imageViewer.crosshairPointerBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.flipBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.invertBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.magnifyBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.panBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.rotateBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.shutterBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.stackScrollBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.windowLevelBtn().nth(1)).not.toBeVisible();
		await expect(poManager.imageViewer.zoomBtn().nth(1)).not.toBeVisible();
	});
});

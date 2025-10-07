const path = require('path');
const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

let browserContext;
let page;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let studyInfo;

test.describe.serial('ImageViewer', () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log(`Posted study value`,result);
			studyInfo = result;
		});

		browserContext = await chromium.launch();
		page = await browserContext.newPage();
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
	});

	test('Check Customize Toolbar Option on More menu', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		await poManager.imageViewer.clickOnMoreOptions();
		await poManager.aiUtils.executeAICommand('Click on Settings from the options menu', 'basePrompt');
		await expect(page.locator('text=Customize Toolbar')).toBeVisible();
	});

	test('Test Customize Toolbar Edit Page', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		await poManager.imageViewer.customizeToolbarOption().click();
		await poManager.imageViewer.resetCustomizeToolbarBtn().click();
		await poManager.imageViewer.resetAllConfirmBtn().click();
	});

	test('Add Additional Tools to Toolbar', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		await poManager.aiUtils.executeAICommand('Click on all options under Additional Tools', 'basePrompt');
		//Verify Additional Tools selection
		const additionalToolIconSection = page.locator('[data-testid="additional-toolgroup-body"]');
		const additionalToolIconSectionImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/AdditionalToolsSection.png');
		const result = await poManager.aiUtils.compareImages(additionalToolIconSection, additionalToolIconSectionImgPath);
		console.log('Additional Tools comparison result:', result);
		await expect(result.hasDifferences).toBe(false);
		//Verify Additional Tools on Toolbar
		const topToolbarwithAdditionalToolsImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbarWithAdditionalTools.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarwithAdditionalToolsImgPath);
		console.log('Additional Tools top toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
		

	});

	test('Remove Additional Tools from Toolbar', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		const additionalToolIconSection = page.locator('[data-testid="additional-toolgroup-body"]');
		await poManager.aiUtils.executeAICommand(`Click on all options under Additional Tools with indetifier ${additionalToolIconSection}`, 'basePrompt');
		const additionalToolIconSectionImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/AdditionalToolsSectionCleared.png');
		const result = await poManager.aiUtils.compareImages(additionalToolIconSection, additionalToolIconSectionImgPath);
		console.log('Additional Tools comparison result:', result);
		await expect(result.hasDifferences).toBe(false);
		//Verify Additional Tools on Toolbar
		const topToolbarwithAdditionalToolsRemovedImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbarWithoutAdditionalTools.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarwithAdditionalToolsRemovedImgPath);
		console.log('Additional Tools top toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
	});

	test('Add Markup Tools on Toolbar Save Customize Toolbar Edit Page', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		const markupToolIconSection = page.locator('[data-testid="markup-toolgroup-body"]');
		await poManager.aiUtils.executeAICommand(`Click on Angle,Annotate,Bidirectional,Cardiothoracic,Drag Probe,Length,Plumb Line,ROI,Spine Labeling options under Markup Tools `, 'basePrompt');
		const markupToolIconSectionImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/MarkupToolsSection.png');
		const result = await poManager.aiUtils.compareImages(markupToolIconSection, markupToolIconSectionImgPath);
		console.log('Markup Tools comparison result:', result);
		await expect(result.hasDifferences).toBe(false);
		//Verify Additional Tools on Toolbar
		const topToolbarwithMarkupToolsImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbarWithMarkupTools.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarwithMarkupToolsImgPath);
		console.log('Markup Tools top toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
		// Save the Customize Toolbar Edit Page
		await poManager.imageViewer.saveCustomizeToolbarPage().click();
		
	});

	test('Test Reset All Changes', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);
		await poManager.imageViewer.moreOptionsBtn().click();
		await page.locator('text=Settings').click();
		await poManager.imageViewer.customizeToolbarOption().click();

		// Click Reset ALL
		await poManager.imageViewer.resetCustomizeToolbarBtn().click();
		await poManager.imageViewer.resetAllConfirmBtn().click();
		await poManager.imageViewer.saveCustomizeToolbarPage().click();

		//Verify Additional Tools on Toolbar
		const topToolbarImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbar.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarImgPath);
		console.log('Top Toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
	});

	test('Add Adjustment Tools to Toolbar', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);

		await poManager.imageViewer.clickOnMoreOptions();
		await page.locator('text=Settings').click();
		await poManager.imageViewer.customizeToolbarOption().click();

		await poManager.aiUtils.executeAICommand('Click on all options under Adjustment Tools', 'basePrompt');
		const adjustmentToolIconSection = page.locator('[data-testid="adjustment-toolgroup-body"]');
		const adjustmentToolIconSectionImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/AdjustmentSection.png');
		const result = await poManager.aiUtils.compareImages(adjustmentToolIconSection, adjustmentToolIconSectionImgPath);
		console.log('Adjustment Tools comparison result:', result);
		await expect(result.hasDifferences).toBe(false);
		
		//Verify Additional Tools on Toolbar
		const topToolbarwithAdjustmentToolsImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbarWithAdjustmentTools.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarwithAdjustmentToolsImgPath);
		console.log('Adjustment Tools top toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
	});

	test('Test Undo Previous Changes', async ({},testInfo) => {
		const poManager = new POManager(page,null,testInfo);

		// Click Undo on Customize Toolbar Edit Page
		await page.locator('[role="group"] .css-6xugel').hover();
		await poManager.imageViewer.undoCustomizeToolbarBtn().click();

		//Verify Additional Tools on Toolbar
		const topToolbarImgPath = path.join(__dirname, '../../screenshots-testdata/IVCustomizeToolbar/TopToolbar.png');
		const result1 = await poManager.aiUtils.compareImages(poManager.imageViewer.topToolbar(), topToolbarImgPath);
		console.log('Top Toolbar comparison result:', result1);
		await expect(result1.hasDifferences).toBe(false);
	});
});

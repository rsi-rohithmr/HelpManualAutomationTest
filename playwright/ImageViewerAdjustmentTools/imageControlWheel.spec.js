const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const enabledTool = 'rgba(255, 255, 255, 0.87)';
const disabledTool = 'rgba(255, 255, 255, 0.3)';
test.describe('Image control wheel', () => {
	test.beforeEach(async ({ page }) => {
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
			path.join(__dirname, '../TestData/dicomImport/testWindowLevel/ARTIFIXIMAGE1.dcm')
		);

		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testWindowLevel/ARTIFIXIMAGE2.dcm')
		);
		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);
		const poManager = new POManager(page);
		// Handling sync delay for uploaded study
		await page.waitForTimeout(20000);
		await poManager.loginPage.loginOmegaAI();
		await page.route('**/config?item=ImageViewer3DWheelSetting', async route => route.continue());
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName),
			poManager.apiWaitUtils.waitForAPI('config?item=ImageViewer3DWheelSetting', 'GET', 120000),
		]);
	});

	test('Check Image Control Wheel - Adjustment Mode', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);			
		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await expect(poManager.imageViewer.controlWheelZoom()).toBeVisible();
		await poManager.imageViewer.controlWheelZoom().click({ force: true });
		console.log('Verified Zoom Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelMagnify().click({ force: true });
		console.log('Verified Magnify Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelFlipHorizontal().click({ force: true });
		console.log('Verified Flip Horizontal Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelFlipVertical().click({ force: true });
		console.log('Verified Flip Vertical Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelWindowLevel().click({ force: true });
		console.log('Verified Window Level Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelPan().click({ force: true });
		console.log('Verified Pan Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelStackScroll().click({ force: true });
		console.log('Verified Stack Scroll Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.wheelTuneIcon().click({ force: true });
		await poManager.imageViewer.controlWheelRotate().click({ force: true });
		console.log('Verified Rotate Tool');
	});

	test('Check Wheel Customization - Adjustment Tab', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);			
		await poManager.imageViewer.clickOnMoreOptions();
		await page.getByText('Settings').click();
		await poManager.imageViewer.customizeWheelOption().click();

		await poManager.imageViewer.wheelDivisionEight().click();
		await expect(poManager.imageViewer.customizeWheelPan()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelWL()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelStackScroll()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelZoom()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelMagnify()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelRotate()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipH()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipV()).toHaveCSS('color', enabledTool);

		await poManager.imageViewer.wheelDivisionSix().click();
		await expect(poManager.imageViewer.customizeWheelFlipH()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipV()).toHaveCSS('color', disabledTool);

		await poManager.imageViewer.wheelDivisionFour().click();
		await expect(poManager.imageViewer.customizeWheelMagnify()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelRotate()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipH()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipV()).toHaveCSS('color', disabledTool);

		await poManager.imageViewer.cancelWheelCustomization().click();
	});

	test('Check Image Control Wheel - Markup Mode', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);		
		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelAngle().click({ force: true });
		console.log('Verified Angle Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelAnnotate().click({ force: true });
		console.log('Verified Annotate Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelCardiothoracic().click({ force: true });
		console.log('Verified Cardiothoracic Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelLength().click({ force: true });
		console.log('Verified Length Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelPlumbLine().click({ force: true });
		console.log('Verified Plumb Line Tool');

		await poManager.imageViewer.highlightedViewport().click({ button: 'right', force: true });
		await poManager.imageViewer.controlWheelMarkupMode().click();
		await poManager.imageViewer.controlWheelProbe().click({ force: true });
		console.log('Verified Probe Tool');
	});

	test('Check Wheel Customization - Markup Tab', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);				
		await poManager.imageViewer.clickOnMoreOptions();
		await page.getByText('Settings').click();
		await page.waitForTimeout(4000);
		await poManager.imageViewer.customizeWheelOption().click({ force: true });
		await page.waitForTimeout(4000);
		await poManager.imageViewer.customizeWheelMarkup().click({ force: true });

		await poManager.imageViewer.wheelDivisionEight().click();
		await expect(poManager.imageViewer.customizeWheelSpineLabeling()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelLength()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelCobbAngle()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelCardiothoracic()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelPlumb()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelAnnotate()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelAngle()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelProbe()).toHaveCSS('color', enabledTool);

		await poManager.imageViewer.wheelDivisionSix().click();
		await expect(poManager.imageViewer.customizeWheelAngle()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelProbe()).toHaveCSS('color', disabledTool);

		await poManager.imageViewer.wheelDivisionFour().click();
		await expect(poManager.imageViewer.customizeWheelPlumb()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelAnnotate()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelAngle()).toHaveCSS('color', disabledTool);
		await expect(poManager.imageViewer.customizeWheelProbe()).toHaveCSS('color', disabledTool);

		await poManager.imageViewer.cancelWheelCustomization().click();
	});

	test('Check Enable/Disable Tools on Image Control Wheel', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);		
		await poManager.imageViewer.clickOnMoreOptions();
		await page.getByText('Settings').click();
		await poManager.imageViewer.customizeWheelOption().click();
		await page.waitForTimeout(4000);
		await poManager.imageViewer.customizeWheelAdjustment().click({ force: true });

		const target = await poManager.imageViewer.customizeWheelDropArea('DropableArea-7');
		const element = await poManager.imageViewer.dragIndicatorIcon('Invert');
		await page.locator(`[data-rbd-draggable-id="Invert"]`).hover();
		await element.hover();

		// Get bounding boxes to ensure valid positions
		const sourceBox = await element.boundingBox();
		const targetBox = await target.boundingBox();

		if (sourceBox && targetBox) {
			await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
			await page.mouse.down();
			await page.waitForTimeout(200); // Add small delay to mimic human behavior
			await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
			await page.waitForTimeout(200); // Allow time for UI update
			await page.mouse.up();
		} else {
			console.error('Drag or drop target not found');
		}

		await expect(poManager.imageViewer.customizeWheelInvert()).toHaveCSS('color', enabledTool);
		await expect(poManager.imageViewer.customizeWheelFlipH()).toHaveCSS('color', disabledTool);

		await poManager.imageViewer.cancelWheelCustomization().click();
	});
});

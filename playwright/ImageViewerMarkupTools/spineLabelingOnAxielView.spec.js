const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');

let studyInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let browserContext;
let page;

test.describe('Spine Labeling on Axial View', () => {
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
		// Import study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testSpineLabelingOnAxielSeries/axial.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testSpineLabelingOnAxielSeries/sagital.dcm')
		);		
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId)
		]);
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);	
	});

	test('Spine Labeling on Axial View', async ({}, testInfo) => {
		const poManager = new POManager(page, null, testInfo);
		await page.waitForTimeout(2000);
		// Set hotkey for Spine Labeling Tool
		await poManager.imageViewer.clickOnMoreOptions();
		await page.getByText('Settings').click();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.customizeWheelOption().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.customizeWheelMarkup().click({ force: true });
		await page.waitForTimeout(1000);
		// Check if hotkey 'N' is assigned to Spine Labeling Tool
		const hotkeyElement = page.locator('div[data-rbd-draggable-id="SpineLabeling"] p.MuiTypography-root:has-text("N")');
		const hotkeyCount = await hotkeyElement.count();
		// Output current hotkey text
		const hotkeyText = await page.locator('div[data-rbd-draggable-id="SpineLabeling"] p.MuiTypography-root').last().textContent();
		console.log(`Spine Labeling hotkey: ${hotkeyText}`);
		// If hotkey 'N' is already assigned, click Cancel button
		if (hotkeyCount > 0) {
			console.log("Spine Labeling hotkey 'N' is already assigned, clicking Cancel button");
			await page.locator('button.MuiButton-outlinedRsPrimary:has-text("CANCEL")').click();
			console.log('Clicked Cancel button');
		} else {
			// If hotkey 'N' is not assigned, assign it and click Save button
			console.log("Spine Labeling hotkey 'N' is not assigned, assigning and saving...");
			await page.locator('div[data-rbd-draggable-id="SpineLabeling"] div.MuiBox-root.css-12y2iiz').click();
			await page.waitForTimeout(1000);
			await page.keyboard.press('N');
			await page.waitForTimeout(1000);
			await page.locator('button.MuiButton-root.MuiButton-contained:has-text("Save")').click();
			console.log('Clicked Save button');
		}
		// Set layout 
		await page.waitForTimeout(1000);
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.layoutGridItem(1, 1).click({ force: true });
		// Wait for the ImageViewerViewportCornerstone to be available
		await page.waitForSelector('[data-testid="ImageViewerViewportCornerstone"]', { timeout: 5000 });
		const firstViewport = page.locator('[data-testid="ImageViewerViewportCornerstone"]').first();
		// Enable spine labeling Tool
		await page.waitForTimeout(1000);
		await page.keyboard.press('N');
		console.log('Enabling Spine Labeling Tool');
		await poManager.aiUtils.executeAICommand("click the Save button", "base");
		console.log('click save button');
		await page.waitForTimeout(1000);
		// Add spine labels to the image
		for (let i = 0; i < 4; i++) {
    		await firstViewport.click({ position: { x: 800, y: 500 + i * 50 } }); 
    		await page.waitForTimeout(1000); 
		}
		// Change layout to 1x2
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.layoutGridItem(1, 2).click({ force: true });
		await page.waitForTimeout(1000);
		const secondViewport = page.locator('[data-testid="ImageViewerViewportCornerstone"]').nth(1);
		await secondViewport.click();
		await page.waitForTimeout(1000);
		// Scroll to frame 15 and verify 'C2'
	    let frameIndex = 0;
	    while (frameIndex < 14) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(100);
        frameIndex++;
    	}
		const textFrame15 = await secondViewport.evaluate(el => el.textContent || el.innerText);
		console.log(`Frame 15 text: ${textFrame15}`);
    	expect(textFrame15).toContain('C2');
	    // Scroll to frame 22 and verify 'C1-C2'
		while (frameIndex < 21) {
	    await page.mouse.wheel(0, 100);
	    await page.waitForTimeout(100);
	    frameIndex++;
		}
		const textFrame22 = await secondViewport.evaluate(el => el.textContent || el.innerText);
		console.log(`Frame 22 text: ${textFrame22}`);
		expect(textFrame22).toContain('C1-C2');
 	   // Scroll to frame 34 and verify 'C1'
	    while (frameIndex < 33) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(100);
        frameIndex++;
	    }
	    const textFrame34 = await secondViewport.evaluate(el => el.textContent || el.innerText);
	    console.log(`Frame 34 text: ${textFrame34}`);
	    expect(textFrame34).toContain('C1');
	});
});
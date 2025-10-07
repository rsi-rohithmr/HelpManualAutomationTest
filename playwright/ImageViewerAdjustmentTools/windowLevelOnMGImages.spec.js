const { test, expect, request, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const fs = require('fs'); 
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const WLValue2D = 2785;
const WWValue2D = 1050;
const WLValue3D = 2798;
const WWValue3D = 614;
const totalFrames = 5; // 3D MG image frame count

test.describe('Test Window Level With MG Images', () => {
	// Use beforeAll to run the setup code once before all tests
	let page;
	let browser;
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		browser = await chromium.launch({ channel: 'chrome' });
		page = await browser.newPage();
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Importing studies');
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testWLOnMGImages/2DMG.dcm')
		);
		console.log('__dirname:', __dirname);
		// Check if the 3D image is checked out from SmallTestData repo before importing
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../../../TestData/Common_Test_Images/MG_STUDIES/TomoImages/3DMG.dcm')
		);
		console.log('filePath1:', filePath1);

		if (!fs.existsSync(filePath1)) {
            throw new Error(`Cannot find 3DMG.dcm：${filePath1}`);
        }		
		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);
		const poManager = new POManager(page);

		// Turn off FF before testing (WON-4248)
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON
			if (bodyJson.features && bodyJson.features['won-iv-bookmarking3d']) {
				bodyJson.features['won-iv-bookmarking3d'].variationName = 'Variation 2';
				bodyJson.features['won-iv-bookmarking3d'].variationKey = 'variation-2';
			}

			if (bodyJson.variables && bodyJson.variables['won-iv-bookmarking3d']) {
				bodyJson.variables['won-iv-bookmarking3d'].value = false;
			}

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		await poManager.loginPage.loginOmegaAI();
		await Promise.all([poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName)]);
	});

	test('Test Window Level On MG Images', async () => {
		const poManager = new POManager(page);
		// Change layout to multi-view and wait for the layout to settle
		await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
		await poManager.imageViewer.layoutGridItem(1, 2).click({ force: true });
		// Test 2D MG images
		await poManager.imageViewer.verifyImageDisplay(1);
		await poManager.imageViewer.highlightedViewport().click();
		await page.waitForTimeout(20000);
		await poManager.imageViewer.verifyWLAppliedOnViewport(0, WWValue2D, WLValue2D);
		// Test 3D MG image
		await poManager.imageViewer.highlightedViewport(1).click();	
		await poManager.imageViewer.verifyWLAppliedOnViewport(1, WWValue3D, WLValue3D);
		// Scroll each frame and verify WL is applied on each frame
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            console.log(`Verifying frame ${frameIndex + 1}/${totalFrames}`);
            await poManager.imageViewer.verifyWLAppliedOnViewport(1, WWValue3D, WLValue3D);
            if (frameIndex < totalFrames - 1) {
                await poManager.imageViewer.highlightedViewport(1).click();
                await page.mouse.wheel(0, 100); // Scroll down to the next frame
            }
		}		
	});
});

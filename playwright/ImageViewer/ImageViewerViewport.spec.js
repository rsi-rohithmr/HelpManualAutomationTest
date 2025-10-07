const { test, expect, request, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('ImageViewer Viewport', () => {
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

		// Upload two DICOM files of different series for the study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiSeries/knee-00-image-00000.dcm')
		);

		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiSeries/knee-01-image-00000.dcm')
		);
		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);
		const poManager = new POManager(page);

		// Mock - Modify network request response to disable bookmarking feature flag
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

		// Handling sync delay for uploaded study
		await page.waitForTimeout(20000);
		await poManager.loginPage.loginOmegaAI();
		await Promise.all([poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName)]);
	});

	test.describe.serial('Handle double click on ImageViewer viewport', () => {
		// Test case for verifying rotation and scale after double click on the viewport

		test('should preserve image changes on switch between multi-view to highlighted view', async () => {
			const poManager = new POManager(page);

			let multiViewState = {};

			// Wait for the ImageViewerViewportCornerstone to be available
			await page.waitForSelector('[data-testid="ImageViewerViewportCornerstone"]', { timeout: 5000 });

			// Change layout to multi-view and wait for the layout to settle
			await poManager.imageViewer.clickOnChangeLayout().click({ force: true });
			await poManager.imageViewer.layoutGridItem(1, 2).click({ force: true });
			await page.waitForTimeout(3000);

			const firstViewport = page.locator('[data-testid="ImageViewerViewportCornerstone"]').first();

			// Click on the first viewport with the right mouse button
			await firstViewport.click({ button: 'right', force: true });
			await page.waitForTimeout(200);

			// Hover and click on controlWheelRotate to select rotate tool
			await poManager.imageViewer.controlWheelRotate().hover();
			await poManager.imageViewer.controlWheelRotate().click({ force: true });
			console.log('Rotate Tool Clicked');

			// Simulate mouse drag to perform rotation
			await page.waitForTimeout(200);
			await firstViewport.hover();
			await page.mouse.down();
			await page.mouse.move(100, 0, { steps: 10 }); // Move right
			await page.mouse.up();

			// Hover and click on controlWheelZoom to select zoom tool
			await page.waitForTimeout(200);
			await firstViewport.click({ button: 'right', force: true });
			await poManager.imageViewer.controlWheelZoom().hover();
			await poManager.imageViewer.controlWheelZoom().click({ force: true });
			console.log('Zoom Tool Clicked');

			// Simulate mouse drag to perform zoom
			await page.waitForTimeout(200);
			await firstViewport.hover();
			await page.mouse.down();
			await page.mouse.move(0, 100, { steps: 10 }); // Move down
			await page.mouse.up();

			// Get cornerstone elements to check rotation value
			let multiViewElements = await poManager.imageViewer.getCornerstoneViewports();
			console.log('multiViewElements -> M to H1111', multiViewElements);

			multiViewState = {
				rotation: multiViewElements[0].rotation,
				scale: multiViewElements?.[0]?.camera.parallelScale,
			};
			// Assert cornerstone elements exist
			expect(multiViewElements).toBeDefined();
			expect(multiViewElements.length).toBeGreaterThan(0);

			// Test the first viewport in the multi-view
			expect(multiViewElements[0].rotation).toBeGreaterThan(50); // Rotation should be greater than 50
			expect(multiViewElements?.[0]?.camera.parallelScale).toBeGreaterThan(440); // Scale should be greater than 440

			// Reset mouse position before switching
			await page.mouse.move(0, 0);
			await page.waitForTimeout(100);

			// Double click on first viewport to switch to the highlighted view
			await page.waitForTimeout(200);
			await firstViewport.dblclick();

			await page.waitForTimeout(1000);
			// Evaluate the highlighted viewport's properties after switching
			const highlightedViewProp = await poManager.imageViewer.getCornerstoneViewportByIndex(0);

			console.log('highlightedViewProp -> M to H', highlightedViewProp);
			console.log('multiViewState -> M to H - ', multiViewState);

			const viewportCount = await page.locator('[data-testid="ImageViewerViewportCornerstone"]').count();
			console.log(`Viewport count after switch: ${viewportCount}`);

			// should preserve changes from multi-view  on double click
			expect(highlightedViewProp).toBeDefined();
			expect(highlightedViewProp.rotation).toEqual(multiViewState.rotation);
			expect(highlightedViewProp.camera.parallelScale).toEqual(multiViewState.scale);
		});

		test('should preserve image changes on switch between highlighted view to multi-view', async () => {
			const poManager = new POManager(page);

			let highlightedState = {};
			// Action on Highlighted viewport layout starts here
			await page.waitForTimeout(200);
			const highlightedViewport = page.locator('[data-testid="ImageViewerViewportCornerstone"]').first();

			// Simulate mouse drag to perform zoom, as zoom-tool is selected already in previous test
			await page.waitForTimeout(200);
			await highlightedViewport.hover();
			await page.mouse.down();
			await page.mouse.move(0, -100, { steps: 10 }); // Move up
			await page.mouse.up();

			// Click on the highlightedViewport with the right mouse button
			// await highlightedViewport.click({ button: 'right', force: true });
			// await page.waitForTimeout(200);

			// // Hover and click on controlWheelRotate to select rotate tool
			// await poManager.imageViewer.controlWheelRotate().hover();
			// await poManager.imageViewer.controlWheelRotate().click();
			// console.log('Rotate Tool Clicked');

			// // Simulate mouse drag to perform rotation
			// await page.waitForTimeout(200);
			// debugger;
			// await page.mouse.move(0, 0); // Reset mouse position
			// await page.mouse.move(10, 10); // Tiny move to reset
			// await highlightedViewport.hover();
			// await page.mouse.down();
			// await page.mouse.move(200, 0, { steps: 10 }); // Move right
			// await page.mouse.up();

			// FIXME:: because of mouse drag simulation failure, used cornerstone hack to SIMULATE rotation
			await page.evaluate(() => {
				const cs = window.cornerstone;
				if (!cs || !cs.getEnabledElements) return [];
				const elements = cs.getEnabledElements();
				for (let element of elements) {
					if (element.viewportId === 'SHADOW_ACTIVE_VIEWPORT_ID') continue;
					element.viewport.setRotation(60);
					element.viewport.render();
					break; // Stop after setting rotation for the first eligible viewport
				}
			});

			// Get cornerstone elements to check rotation value
			const highlightedViewProp = await poManager.imageViewer.getCornerstoneViewportByIndex(0);
			console.log('highlightedViewProp -> H to M', highlightedViewProp);

			expect(highlightedViewProp).toBeDefined();
			highlightedState = {
				rotation: highlightedViewProp.rotation,
				scale: highlightedViewProp.camera.parallelScale,
			};
			expect(highlightedViewProp.rotation).toBeGreaterThan(50); // Rotation should be greater than 50
			expect(highlightedViewProp.camera.parallelScale).toBeGreaterThan(400); // Scale should be greater than 400

			// Double click on highlighted viewport to switch to the multi viewport
			await page.waitForTimeout(200);
			await highlightedViewport.dblclick();

			await page.waitForTimeout(1000);
			await page.waitForSelector('[data-testid="ImageViewerViewportCornerstone"]', { timeout: 2000 });

			const multiViewElement = await poManager.imageViewer.getCornerstoneViewportByIndex(0);

			console.log('multiViewElements -> H to M', multiViewElement);
			console.log('highlightedState -> H to M', highlightedState);

			// Test the first viewport in the multi-view
			expect(multiViewElement).toBeDefined();
			// should preserve changes from highlighted view on double click
			expect(multiViewElement.rotation).toEqual(highlightedState.rotation);
			expect(multiViewElement.camera.parallelScale).toEqual(highlightedState.scale);
		});
	});
});

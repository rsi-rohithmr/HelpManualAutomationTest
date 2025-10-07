const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
import { v4 as uuid } from 'uuid';

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('ImageViewer Bookmark', () => {
	let apiContext;
	let api;
	let tokenObj = {};
	const protocolID = uuid();

	const postTestHangingProtocol = async () => {
		const url =
			playwrightConfig.baseURL +
			`dicomweb/hangingprotocol?InternalManagingOrgId=${managingOrgId}&ProtocolID=${protocolID}`;
		const hangingProtocolJson = {
			'Hanging Protocol Name': 'E2E TEST HP 2x2',
			'Number of Priors Referenced': 1,
			'Compare Mode Exists': 'N',
			'Public Protocol': 'Y',
			'Hanging Protocol Description': '',
			'Hanging Protocol Level': '',
			'Hanging Protocol Definition Sequence': [
				{
					'Item 1': {
						Modality: ['BI'],
						'Anatomic Region Sequence': {
							'Item 1': ['T-D3000', 'SRT', 'Chest'],
							Laterality: '',
							BodyPart: '',
							'Procedure Code Sequence': '',
							'Reason for Requested Procedure Code Sequence': '',
						},
					},
				},
			],
			defaultForModality: false,
			Stages: [
				{
					monitors: [
						{
							id: uuid(),
							viewCode: 'Any',
							modifier: '',
							parentId: null,
							rules: [],
							layout: { x: 0, y: 0 },
						},
						{
							id: uuid(),
							viewCode: 'Any',
							modifier: null,
							parentId: null,
							rules: [],
							layout: { x: 0, y: 0 },
						},
						{
							id: uuid(),
							viewCode: 'Any',
							modifier: null,
							parentId: null,
							rules: [],
							layout: { x: 0, y: 0 },
						},
						{
							id: uuid(),
							viewCode: 'Any',
							modifier: null,
							parentId: null,
							rules: [],
							layout: { x: 0, y: 0 },
						},
					],
					layout: { x: 1, y: 1 },
				},
			],
			managingorganizationid: `${managingOrgId}`,
			ProtocolID: `${protocolID}`,
		};
		let requestPayload = {
			method: 'POST',

			headers: {
				Authorization: 'Bearer ' + tokenObj?.accessToken,
				SessionID: tokenObj?.sessionId,
			},
			data: hangingProtocolJson,
		};
		try {
			const response = await apiContext.post(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
		} catch (error) {
			console.error('Error creating hanging protocol:', error);
			throw error;
		}
	};

	test.beforeAll(async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);
		tokenObj = await api.getTokenAndSessionId();
		console.log('Creating a testing hanging protocol');
		await postTestHangingProtocol();
	});

	test.beforeEach(async ({ page }) => {
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});

		console.log('Importing studies');

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testBookmark/1.dcm')
		);

		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testBookmark/2.dcm')
		);

		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testBookmark/3.dcm')
		);

		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testBookmark/4.dcm')
		);

		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);
		await api.importDICOM(filePath2, studyInfo.studyId);
		await api.importDICOM(filePath3, studyInfo.studyId);

		const poManager = new POManager(page);
		// Open the image viewer and wait for the page to load.
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);		
	});

	test('Manual layout 3x3 - Confirm saved and re-loaded successfull', async ({ page }) => {
		const poManager = new POManager(page);
		console.log('Setting layout to 3x3');
		await poManager.imageViewer.changeLayoutBtn().click();
		await page.waitForTimeout(1000);		
		await poManager.imageViewer.layoutGridItem(3, 3).click();
		await page.waitForTimeout(1000);
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(9);

		// console.log('Reloading the page');
		await poManager.imageViewer.goBackBtn().click();
		await page.waitForTimeout(1000);
		await page.goBack({ waitUntil: 'load' });
		await page.waitForTimeout(10000);		
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(9);

		// Reset layout to 1x1 to avoid conflict with other tests
		await poManager.imageViewer.initLayoutTo1x1();
		await page.waitForTimeout(1000);
	});

	test('Confirm saved and reload success with Left/right panel open/close, DV split view open/close', async ({
		page,
	}) => {
		const poManager = new POManager(page);
		console.log('Open left, right panel and DV split view');
		await poManager.imageViewer.openLeftSection();
		await poManager.imageViewer.openRightSection();
		await poManager.imageViewer.openDocumentSplitView();
		await page.waitForTimeout(5000);

		await expect(poManager.imageViewer.seriesDrawer()).toBeVisible();
		await expect(poManager.imageViewer.measurementsDrawer()).toBeVisible();
		await expect(poManager.imageViewer.DocumentSpiltView()).toBeVisible();

		// console.log('Reloading the page');
		await poManager.imageViewer.goBackBtn().click();
		await page.waitForTimeout(1000);
		await page.goBack({ waitUntil: 'load' });	
		await page.waitForTimeout(10000);		

		// Check if bookmarks are applied
		await expect(poManager.imageViewer.seriesDrawer()).toBeVisible();
		await expect(poManager.imageViewer.measurementsDrawer()).toBeVisible();
		await expect(poManager.imageViewer.DocumentSpiltView()).toBeVisible();

		console.log('Close left, right panel and DV split view');
		await poManager.imageViewer.closeLeftSection();
		await poManager.imageViewer.closeRightSection();
		await poManager.imageViewer.closeDocumentSplitView();
		await page.waitForTimeout(5000);

		// console.log('Reloading the page');
		await poManager.imageViewer.goBackBtn().click();
		await page.waitForTimeout(1000);
		await page.goBack({ waitUntil: 'load' });
		await page.waitForTimeout(10000);

		// Check if bookmarks are applied
		await expect(poManager.imageViewer.seriesDrawer()).not.toBeVisible();
		await expect(poManager.imageViewer.measurementsDrawer()).not.toBeVisible();
		await expect(poManager.imageViewer.DocumentSpiltView()).not.toBeVisible();
	});

	test('Select an HP - Confirm saved and re-loaded successfull', async ({ page }) => {
		const poManager = new POManager(page);
		console.log('Setting layout to 2x2 by selecting HP');
		await poManager.imageViewer.changeLayoutBtn().click();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.hangingProtocol().click();
		await page.waitForTimeout(1000);
		await page.getByText('E2E TEST HP 2x2').first().click();
		await page.waitForTimeout(5000);
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(4);

		// console.log('Reloading the page');
		await poManager.imageViewer.goBackBtn().click({ force: true });
		await page.waitForTimeout(1000);
		await poManager.imageViewer.goBackBtn().click({ force: true });	
		await page.waitForTimeout(1000);		
		await page.goBack({ waitUntil: 'load' });
		await page.waitForTimeout(10000);

		await poManager.imageViewer.changeLayoutBtn().click();
		await poManager.imageViewer.hangingProtocol().click();
		await page.waitForTimeout(5000);
		// Check if bookmarks are applied
		await expect(page.getByText('E2E TEST HP 2x2').first()).toHaveCSS('color', 'rgb(66, 165, 245)');
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(4);
	});

	test('Confirm saved and reload success with WL/Rotate/Zoom/Pan states', async ({ page }) => {
		// Tolerant equality check for cornerstone elements
		const isCornerstoneElementEqual = (element1, element2, tolerance = 0.1) => {
			if (
				element1.elementId !== element2.elementId ||
				Math.abs(element1.pan[0] - element2.pan[0]) > tolerance ||
				Math.abs(element1.pan[1] - element2.pan[1]) > tolerance ||
				Math.abs(element1.zoom - element2.zoom) > tolerance ||
				Math.abs(element1.rotation - element2.rotation) > tolerance ||
				element1.voiRange.lower !== element2.voiRange.lower ||
				element1.voiRange.upper !== element2.voiRange.upper
			) {
				return false;
			}

			return true;
		};

		const poManager = new POManager(page);

		await poManager.imageViewer.initLayoutTo1x1();

		const firstImageBox = await poManager.imageViewer.nthLayoutItem(0).boundingBox();
		console.log('First image box:', firstImageBox);

		if (firstImageBox) {
			console.log('Selecting rotate tool');
			await poManager.imageViewer.nthLayoutItem(0).click({ button: 'right' });
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelTuneIcon().click();
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelRotateIcon().click();
			await page.waitForTimeout(1000);

			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200);
			await page.mouse.down();
			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 600);
			await page.mouse.up();
			await page.waitForTimeout(1000);

			console.log('Selecting window level tool');
			await poManager.imageViewer.nthLayoutItem(0).click({ button: 'right' });
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelTuneIcon().click();
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelWindowLevelIcon().click();
			await page.waitForTimeout(1000);

			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200);
			await page.mouse.down();
			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 400);
			await page.mouse.up();
			await page.waitForTimeout(1000);

			console.log('Selecting zoom tool');
			await poManager.imageViewer.nthLayoutItem(0).click({ button: 'right' });
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelTuneIcon().click();
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelZoomIcon().click();
			await page.waitForTimeout(1000);

			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200);
			await page.mouse.down();
			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 300);
			await page.mouse.up();
			await page.waitForTimeout(1000);

			console.log('Selecting pan tool');
			await poManager.imageViewer.nthLayoutItem(0).click({ button: 'right' });
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelTuneIcon().click();
			await page.waitForTimeout(1000);
			await poManager.imageViewer.wheelPanIcon().click();
			await page.waitForTimeout(1000);

			await page.mouse.move(firstImageBox.x + 200, firstImageBox.y + 200);
			await page.mouse.down();
			// await page.mouse.move(firstImageBox.x + 400, firstImageBox.y + 400);
			await page.mouse.move(firstImageBox.x + 100, firstImageBox.y + 100);
			await page.mouse.up();
			await page.waitForTimeout(5000);
		} else {
			console.error('Image Box not found');
		}

		const cornerstoneElement = await page.evaluate(() => {
			const cs = window.cornerstone;
			if (!cs || !cs.getEnabledElements) return [];
			// const firstElement = cs.getEnabledElements()?.[0];
			const firstElement = cs.getEnabledElements()?.filter(element => element.viewportId !== 'SHADOW_ACTIVE_VIEWPORT_ID')?.[0];
			return {
				elementId: firstElement.viewportId,
				pan: firstElement.viewport.getPan(),
				zoom: firstElement.viewport.getZoom(),
				rotation: firstElement.viewport.getRotation(),
				voiRange: firstElement.viewport.voiRange,
			};
		});

		console.log('cornerstone elements::', cornerstoneElement);

		console.log('Reloading the page');
		await poManager.imageViewer.goBackBtn().click();
		await page.waitForTimeout(1000);
		await page.goBack();
		await page.waitForTimeout(10000);
		const cornerstoneElementAfterReload = await page.evaluate(() => {
			const cs = window.cornerstone;
			if (!cs || !cs.getEnabledElements) return [];
			// const firstElement = cs.getEnabledElements()?.[0];
			const firstElement = cs.getEnabledElements()?.filter(element => element.viewportId !== 'SHADOW_ACTIVE_VIEWPORT_ID')?.[0];
			return {
				elementId: firstElement.viewportId,
				pan: firstElement.viewport.getPan(),
				zoom: firstElement.viewport.getZoom(),
				rotation: firstElement.viewport.getRotation(),
				voiRange: firstElement.viewport.voiRange,
			};
		});

		console.log('cornerstone elements after reload::', cornerstoneElementAfterReload);

		const isElementEqual = isCornerstoneElementEqual(cornerstoneElement, cornerstoneElementAfterReload);

		console.log('Cornerstone Element Equal::', isElementEqual);

		expect(isElementEqual).toBeTruthy();
	});

	test.afterAll(async () => {
		console.log('Deleting the testing hanging protocol');
		const deleteUrl = playwrightConfig.baseURL + `dicomweb/hangingprotocol/?ProtocolId=${protocolID}`;
		await apiContext.delete(deleteUrl, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + tokenObj?.accessToken,
				SessionID: tokenObj?.sessionId,
			},
		});
	});
});

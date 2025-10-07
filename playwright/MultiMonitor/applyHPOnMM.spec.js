const { test, expect, chromium, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
import { v4 as uuid } from 'uuid';

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let IVPage1;
let IV1POManager;
let name;
let userdetails;
let url = { mainPageURL: '', IV1PageURL: ''};

test.describe('Test Hanging Protocol on MM mode', () => {
	let apiContext;
	let api;
	let tokenObj = {};
	const protocolID = uuid();

	const postTestHangingProtocol = async () => {
		const url =
			playwrightConfig.baseURL +
			`dicomweb/hangingprotocol?InternalManagingOrgId=${managingOrgId}&ProtocolID=${protocolID}`;
		const hangingProtocolJson = {
			'Hanging Protocol Name': 'HP RG 2x2',
			'Number of Priors Referenced': 1,
			'Compare Mode Exists': 'N',
			'Public Protocol': 'Y',
			'Hanging Protocol Description': '',
			'Hanging Protocol Level': '',
			'Hanging Protocol Definition Sequence': [
				{
					'Item 1': {
						Modality: ['RG'],
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

	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
	});

	test.beforeEach(async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/applyHPOnMM/1.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/applyHPOnMM/2.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/applyHPOnMM/3.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/applyHPOnMM/4.dcm')
		);		

		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);
		await api.importDICOM(filePath2, studyInfo.studyId);
		await api.importDICOM(filePath3, studyInfo.studyId);

		// Modify network request response
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json();

			if (bodyJson.features && bodyJson.features['won-mm-e2e-mocking']) {
				bodyJson.features['won-mm-e2e-mocking'].variationName = 'Variation On';
				bodyJson.features['won-mm-e2e-mocking'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['won-mm-e2e-mocking']) {
				bodyJson.variables['won-mm-e2e-mocking'].value = true;
			}

			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});
		await page.waitForTimeout(60000);
		await poManager.loginPage.loginOmegaAI();

		// Get the initial number of open pages
		const initialPages = await page.context().pages();
		console.log(`Initial page count: ${initialPages.length}`);

		// Trigger additional image viewer popup
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(12000);
		// Get all pages again and find the new ones
		const allPages = page.context().pages();
		const newPages = allPages.filter(pg => !initialPages.includes(pg));

		console.log(`Total open pages: ${allPages.length}`);
		console.log(`New popups detected: ${newPages.length}`);

		// Debugging: Print all URLs to check what is being captured
		await newPages.forEach((pg, index) => console.log(`Popup ${index + 1} URL: ${pg.url()}`));

		// Assign page as image viewer
		IVPage1 = newPages[1];

		// Ensure the pages are fully loaded before interacting
		await IVPage1.waitForLoadState();
		console.log('Main Page URL:', page.url());
		console.log('IVPage1 URL:', IVPage1.url());
		url.mainPageURL = page.url();
		url.IV1PageURL = IVPage1.url();

		// Create POManagers for image viewer #2 
		IV1POManager = new POManager(IVPage1);

		async function checkAndRecoverIVPage(ivPage, pageName) {
			try {
				if ((await ivPage.url()) === 'about:blank') {
					console.log(`${pageName} loaded about:blank. Reloading...`);
					await ivPage.reload();
				} else {
					const isWhiteScreen = await ivPage.evaluate(() => {
						return document.body.innerText.trim().length === 0;
					});

					if (isWhiteScreen) {
						console.log(`${pageName} is blank. Reloading...`);
						await ivPage.reload();
					} else {
						console.log(`${pageName} is functioning correctly.`);
					}
				}
			} catch (error) {
				console.log(`Error detected on ${pageName}. Reloading...`, error);
				await ivPage.reload();
			}
		}

		// Check the new image viewer page
		await checkAndRecoverIVPage(IVPage1, 'IVPage1');
	});

	test('Test Apply HP on MM mode', async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		// Check if patient and study shows in image viewer
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		// Check if the hanging protocol is applied
		await poManager.imageViewer.changeLayoutBtn().click();
		await poManager.imageViewer.hangingProtocol().click();
		await expect(page.getByText('HP RG 2x2').first()).toHaveCSS('color', 'rgb(66, 165, 245)');
		// Check if images can display based on the hanging protocol on the main image viewer
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(2);
		await poManager.imageViewer.verifyImageDisplay(1);
		await expect(page.getByText('S#: 2')).toBeVisible();
		await poManager.imageViewer.verifyImageDisplay(2);
		await expect(page.getByText('S#: 4')).toBeVisible();		
		// Check if images can display based on the hanging protocol on the 2nd image viewer 
		await expect(IVPage1.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(2);
		await IV1POManager.imageViewer.verifyImageDisplay(1);
		await expect(IVPage1.getByText('S#: 3')).toBeVisible();
		await IV1POManager.imageViewer.verifyImageDisplay(2);
		await expect(IVPage1.getByText('S#: 5')).toBeVisible();		
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
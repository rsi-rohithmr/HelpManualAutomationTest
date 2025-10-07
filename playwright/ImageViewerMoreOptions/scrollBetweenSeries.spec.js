const { test, expect, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
import { v4 as uuid } from 'uuid';

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Scroll Between Series', () => {
	let apiContext;
	let api;
	let tokenObj = {};
	const protocolID = uuid();

	const postTestHangingProtocol = async () => {
		const url =
			playwrightConfig.baseURL +
			`dicomweb/hangingprotocol?InternalManagingOrgId=${managingOrgId}&ProtocolID=${protocolID}`;
		const hangingProtocolJson = {
			'Hanging Protocol Name': 'PTHP',
			'Number of Priors Referenced': 1,
			'Compare Mode Exists': 'N',
			'Public Protocol': 'Y',
			'Hanging Protocol Description': '',
			'Hanging Protocol Level': '',
			'Hanging Protocol Definition Sequence': [
				{
					'Item 1': {
						Modality: ['PT'],
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
							// rules: [],
							rules: [
                            	{
                                type: 'toggle',
                                values: {
                                    options: {
                                        scroll: true,
                                    },
                                },
                            	},
                        	],
							layout: { x: 0, y: 0 },
						},
						{
							id: uuid(),
							viewCode: 'Any',
							modifier: null,
							parentId: null,
							// rules: [],
							rules: [
                            	{
                                type: 'toggle',
                                values: {
                                    options: {
                                        scroll: true,
                                    },
                                },
                            	},
                        	],
							layout: { x: 0, y: 0 },
						},
					],
					layout: { x: 1, y: 0 },
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
			path.join(__dirname, '../TestData/dicomImport/scrollBetweenSeries/5.dcm')
		);

		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/scrollBetweenSeries/6.dcm')
		);
		await api.importDICOM(filePath, studyInfo.studyId);
		await api.importDICOM(filePath1, studyInfo.studyId);

		const poManager = new POManager(page);
		// Handling sync delay for uploaded study
		await poManager.loginPage.loginOmegaAI();
		await page.route('**/config?item=ImageViewer3DWheelSetting', async route => route.continue());
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName),
			await page.waitForTimeout(2000),
		]);
	});

	test('Scroll Between Series', async ({ page }) => {
		const poManager = new POManager(page);
		// Select Hanging Protocol with scroll option enabled
		console.log('Select Hanging Protocol');
		await poManager.aiUtils.executeAICommand("click the Change Layout button", "base");
		await page.waitForTimeout(1000);		
		await poManager.imageViewer.hangingProtocol().click();
		await page.waitForTimeout(2000);
		await poManager.aiUtils.executeAICommand("click exactly on 'PTHP' button from the hanging protocol section", "base");
		// await page.getByText('PTHP').first().click();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.changeLayoutBtn().click({ force: true });
		await page.waitForTimeout(1000);
		await expect(page.locator('[data-testid="ImageViewerLayoutItems"] > div')).toHaveCount(2);
		// Double click 1st layout To open maximize viewport
		await poManager.imageViewer.imageViewport().nth(0).dblclick();
		await page.waitForTimeout(1000);
		await expect(page.getByText('S#: 1')).toBeVisible();
		await expect(poManager.imageViewer.imageViewport()).toHaveCount(1);
		// Scroll down to the next series
    	await page.mouse.wheel(0, 100); 
    	await page.waitForTimeout(1000); 
		await expect(page.getByText('S#: 3')).toBeVisible();
		// Scroll back up to the previous series
		await page.mouse.wheel(0, -100);
		await page.waitForTimeout(500); 
		await expect(page.getByText('S#: 1')).toBeVisible();
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

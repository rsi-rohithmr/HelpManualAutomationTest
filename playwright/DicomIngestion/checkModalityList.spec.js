const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
let studyInfo;
let browserContext;
let page;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('ImageViewer', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch({ channel: 'chrome' });
		page = await browserContext.newPage();
		await api.postStudywithPrior().then(result => {
			studyInfo = result;
		});

		const filePaths = ['CT.dcm', 'MG.dcm', 'SC.dcm', 'SC_2.dcm'].map(file =>
			path.relative(
				process.cwd(),
				path.join(__dirname, `../TestData/dicomImport/checkModalityListIntegrity/${file}`)
			)
		);

		await api.importDICOM(filePaths[0], studyInfo.studyId1);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[1], studyInfo.studyId1);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[2], studyInfo.studyId1);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[3], studyInfo.studyId1);

		await api.importDICOM(filePaths[0], studyInfo.studyId);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[1], studyInfo.studyId);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[2], studyInfo.studyId);
		await page.waitForTimeout(5000);
		await api.importDICOM(filePaths[3], studyInfo.studyId);

		await page.waitForTimeout(60000); // 60-second wait for potential sync delay
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
	});

	test('Dicom ingestion - Check modality list integrity', async ({}) => {
		const poManager = new POManager(page);
		await page.route('**dicomweb/study/*/series/**', async route => {
			route.continue();
		});

		await page.waitForTimeout(4000);

		await poManager.imageViewer.leftSectionExpandBtn().click();
		await page.waitForTimeout(10000);

		//// Now check if current modality list contains all the modalities
		let modalityText = (await poManager.imageViewer.studyExplorerModalityList().innerText()).split('\\');
		expect(modalityText.length).toBe(3);
		expect(modalityText).toEqual(expect.arrayContaining(['SC', 'MG', 'CT']));
	});
});
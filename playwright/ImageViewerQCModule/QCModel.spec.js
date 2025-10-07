const faker = require('community-faker');
const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
let studyInfo = {
	patientName: 'TOM HUY',
	patientId: 'CHILDREN',
	internalPatientId: '',
	patientBirthday: '1995-12-8',
	accession: '256365447',
	confidentiality: '',
	patientPhone: '',
};
let browserContext;
let page;
let randomNum;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe.serial('ImageViewer QCModel', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch();
		page = await browserContext.newPage();
		console.log('Import study to the organization');
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testImageViewer/1.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testImageViewer/2.dcm')
		);
		console.log('Importing: 1.dcm');
		await api.importStudyToManaginOrg(filePath);
		console.log('Importing: 2.dcm');
		await api.importStudyToManaginOrg(filePath1);
		await page.waitForTimeout(60000); // 60-second wait for potential sync delay
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		randomNum = faker.datatype.number({
			min: 1111,
			max: 9999,
		});
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);		
	});

	test('Rename series', async ({}) => {
		const poManager = new POManager(page);
		await page.route('**dicomweb/studies/*/series/**', async route => {
			route.continue();
		});
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);			
		await page.locator('[data-testid="series"]').first().hover();
		await poManager.imageViewer.seriesStudiesExplorerRenameSeriesBtn().click();
		await page.waitForTimeout(1500);
		await poManager.imageViewer.seriesStudiesExplorerRenameSeriesInputField().fill(`New series name${randomNum}`);
		await poManager.imageViewer.seriesStudiesExplorerRenameSeriesInputField().press('Enter');
		await poManager.apiWaitUtils.waitForAPI(`dicomweb/studies/`, 'PUT');
		await expect(poManager.imageViewer.seriesStudiesExplorerRenameSeriesInputField()).toHaveValue(
			`New series name${randomNum}`
		);
		await poManager.imageViewer.closeLeftSection();
	});

	test('Delete series', async ({}) => {
		const poManager = new POManager(page);
		await page.route('**dicomweb/study/*/series/**', async route => {
			route.continue();
		});
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);		
		// deleting the series
		await poManager.imageViewer.seriesStudiesExplorerDeleteSeriesBtn().dispatchEvent('mousedown');
		await page.waitForTimeout(6000);
		await poManager.imageViewer.seriesStudiesExplorerDeleteSeriesBtn().dispatchEvent('mouseup');
		await poManager.apiWaitUtils.waitForAPI(`/study/`, 'DELETE');
		await poManager.imageViewer.closeLeftSection();		
	});

	test('Delete study', async ({}) => {
		const poManager = new POManager(page);
		await page.route('**/dicomweb/study/**', async route => {
			route.continue();
		});
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);
		await poManager.imageViewer.studyCollapseButton().hover();
		await Promise.all([
			// deleting the study
			poManager.imageViewer.studyDeleteButton().dispatchEvent('mousedown'),
			expect(page.locator(`[data-cy="Managing Organization_filter"]`),{timeout:20000}).toBeVisible({timeout:20000}),
			poManager.apiWaitUtils.waitForAPI(`dicomweb/study/`, 'DELETE'),
		]);
	});
});

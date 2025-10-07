
const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');
let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName
let name = '';
let documentName;
let finalReportName;

test.describe.skip('IV', () => {

	test.beforeAll(async ({ }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result)
			studyInfo = result;

		})
		console.log('import study')
		
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/1.dcm'));

		await api.importDICOM(filePath, studyInfo.studyId)
		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text)
			name = userdetails.name[0].text

		})
	})
	test.beforeEach('login', async ({ page}) => {
		// const browser = await puppeteer.launch({ headless: false });
		// const page = await browser.newPage();
		const poManager = new POManager(page)
		poManager.loginPage
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		})
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		await poManager.loginPage.loginOmegaAI()
	})

	test('DICOM import and  load image', async ({ page}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, false);
		await page.locator('[data-testid="ExpandableSection"]').first().click();
		await expect(page.getByTestId('ImageViewerViewportCornerstone').locator('canvas')).toBeVisible();
	});


});
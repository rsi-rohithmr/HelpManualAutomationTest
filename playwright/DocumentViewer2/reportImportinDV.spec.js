
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

test.describe('DV Report Import', () => {

	test.beforeAll(async ({ }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result)
			studyInfo = result;

		})
		console.log('import study')

		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/3.dcm'));

		await api.importDICOM(filePath, studyInfo.studyId)
		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text)
			name = userdetails.name[0].text

		})
	})
	test.beforeEach('login', async ({ page }) => {
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

	test('Import Final Report', async ({ page }) => {
		const poManager = new POManager(page);
		await page.route('**/ReportContent*', async (route) => {
			route.continue();
		});
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText('Liver is unremarkable. Gallbladder is unremarkable. No biliary ductal dilation. Pancreas unremarkable');

		await expect(poManager.documentViewer.finalCardReportTitle()).toContainText('FINAL');

	});


});
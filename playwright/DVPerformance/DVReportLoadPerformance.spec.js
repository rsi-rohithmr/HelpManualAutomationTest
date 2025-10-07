
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

test.describe('DV Rename', () => {

	test.beforeAll(async ({ }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result)
			studyInfo = result;
		})

		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text)
			name = userdetails.name[0].text

		})
	})
	test.beforeEach('login', async ({ page }) => {
		const poManager = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		})
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		await poManager.loginPage.loginOmegaAI()
	})

	test('Preliminary report report load', async ({ page }) => {
		const poManager = new POManager(page);
		// const reportTxt = 'Test report save';
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.addReportTxtToEditorFromFile();
		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await expect(poManager.documentViewer.newReportEditorTextArea()).toContainText('Post IV and oral contrast fine slice imaging was obtained from the lung apices to the lung bases and');

		// await expect(poManager.documentViewer.newReportEditorTextArea()).toHaveScreenshot('verifyReliminaryText.png',{
		// 	threshold: 0.2,
		// 	maxDiffPixels: 500,
		// 	maxDiffPixelRatio: 0.01,
		//   });
		await poManager.documentViewer.deletePrelimnaryReport();

	});

	test('final report Rename', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);
		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText('Comparison is made with previous CT scan reported DATE and DATE');
		await poManager.documentViewer.deleteReport();
	});

	test('SD rename', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.uploadDocumentInStudyList(documentName, false);
		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await page.waitForTimeout(6000);
		await poManager.documentViewer.studyCardReportTitle().nth(0).click();
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText('Comparison is made with previous CT scan reported DATE and DATE');
		await poManager.documentViewer.deleteStudyDocument();
	});

});
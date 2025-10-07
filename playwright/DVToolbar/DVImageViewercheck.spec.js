const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');
test.describe('Document Viewer', () => {
	let studyInfo = {};
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const date = new Date().toDateString();
	let userdetails;

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/1.dcm'));
		await api.importDICOM(filePath, studyInfo.studyId);
	});

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('ImageViewer in DV test and preliminary report download', async ({ page }) => {
		const reportTxt = 'Test';
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		expect(await poManager.documentViewer.imageViewerBtn()).toBeVisible();
		await poManager.documentViewer.imageViewerBtn().click();
		await expect(page.locator('[data-testid="imageviewer-external-viewport-cornerstone"]')).toBeVisible();
		await poManager.documentViewer.imageViewerBtn().click();
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		await poManager.documentViewer.downloadPreliminaryReport();
		await poManager.documentViewer.deletePreliminaryReportUsingMultiDelete();
	});
});

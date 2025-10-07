const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
const studyUID = '1.2.124.113540.1.2.12855.14640.17990.16962';
const patientName = 'JOHNNY CYBER';
const udpStudyID = '6578460';
const updAccessionNumber = '362006002';
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Import Deleted Study', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
	
		// Importing test study
		console.log('Importing test study');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importDeletedStudy/1.dcm')
		);
		await api.importStudyToManaginOrg(filePath1);

		// Delete the study
		const responseBody = await api.deleteStudyFromMangingOrg(studyUID);
		expect(responseBody).toContain(`Soft Delete for Study: ${studyUID} success`);

		// Importing test study again with updated info
		console.log('Importing test study again with updated info');
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importDeletedStudy/2.dcm')
		);
		await api.importStudyToManaginOrg(filePath2);

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Check Study Infomation', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientName);

		//verify accesstionnumber has been updated
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${updAccessionNumber}$`, 'g'))
		).toHaveCount(1);

		await poManager.imageViewer.openImageViewer(patientName, managingOrgName, true);

		await page.waitForTimeout(20000);

		//verify studyid has been updated
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(udpStudyID);
	});
});
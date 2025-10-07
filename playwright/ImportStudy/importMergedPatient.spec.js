const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
const studyUID1 = '1.2.124.113540.1.2.13878.13889.14149.13105';
const studyUID2 = '1.2.124.113540.0.201803143659.3.6601';
const patientName = 'DEATH CYBER';
const accessionNum1 = '320144001'
const accessionNum2 = 'RAM04142';
const accessionNum3 = '320144002';
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const managingOrgId = playwrightConfig.managingOrg.organizationId;

test.describe('Import Merged Patient', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
	
		// Importing test patient 1
		console.log('Importing test patient 1');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importMergedPatient/1.dcm')
		);
		await api.importStudyToManaginOrg(filePath1);

		// Importing test patient 2 study 1
		console.log('Importing test patient 2 study 1');
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importMergedPatient/2.dcm')
		);
		await api.importStudyToManaginOrg(filePath2);

		// Handling sync delay for uploaded study
		await page.waitForTimeout(10000);

		let resourceName = 'imagingstudy';
		// Get patient 1
		let studyCriteria1 = `studyuid=${studyUID1}&managingorganization=${managingOrgId}`;
		let response1 = await api.getFhirResourceByCriteria(resourceName, studyCriteria1);
		console.log(`response1 ${response1}`);
		let internalPatientId1 = response1.entry[0].resource.subject.id;
		console.log(`Importing test patient 2 ${internalPatientId1}`);

		// Get patient 2
		let studyCriteria2 = `studyuid=${studyUID2}&managingorganization=${managingOrgId}`;
		let response2 = await api.getFhirResourceByCriteria(resourceName, studyCriteria2);
		console.log(`response1 ${response2}`);
		let internalPatientId2 = response2.entry[0].resource.subject.id;
		console.log(`Importing test patient 2 ${internalPatientId2}`);

		// Merge the patients
		await api.mergePatients(internalPatientId2, internalPatientId1);

		// Handling sync delay for merged patients
		await page.waitForTimeout(40000);

		// Importing test patient 2 study 2
		console.log('Importing test patient 2 study 2');
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importMergedPatient/3.dcm')
		);
		await api.importStudyToManaginOrg(filePath3);

		// Handling sync delay for uploaded study
		await page.waitForTimeout(5000);

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Check Merged Patient Study Infomation', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientName);

		//verify worklist contain study 1
		await expect(poManager.homePage.worklistTableRows().getByText(new RegExp(`^${accessionNum1}$`, 'g'))).toHaveCount(1);

		//verify worklist contain study 2
		await expect(poManager.homePage.worklistTableRows().getByText(new RegExp(`^${accessionNum2}$`, 'g'))).toHaveCount(1);

		//verify worklist contain study 3
		await expect(poManager.homePage.worklistTableRows().getByText(new RegExp(`^${accessionNum3}$`, 'g'))).toHaveCount(1);
	});
});
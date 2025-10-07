const path = require('path');
const { test, request, expect, chromium } = require('@playwright/test');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');

const managingOrgName = playwrightConfig.managingOrg.organizationName;
const patientName = 'DEMO LISA 4';

test.describe('Avoid Duplicate Studies', async () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
	
		// import studies with same studyuid and different accessionnumber
		console.log('Import study to the organization');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/avoidDuplicateStudies/1.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/avoidDuplicateStudies/2.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/avoidDuplicateStudies/3.dcm')
		);
		console.log('Importing: 1');
		await api.importStudyToManaginOrg(filePath1);
		console.log('Importing: 2');
		await api.importStudyToManaginOrg(filePath2);
		console.log('Importing: 3');
		await api.importStudyToManaginOrg(filePath3);

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Check import Study', async ({ page }) => {
		const poManager = new POManager(page);
		
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientName);

		// check only one study is created
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${managingOrgName}$`, 'g'))
		).toHaveCount(1);
	});
});

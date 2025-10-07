const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
const patientName = 'VANVT TESTTTT';
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Import Empty Accession Number', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
	
		// Importing test patient 1
		console.log('Importing test patient');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importEmptyAccessNumber/1.dcm')
		);
		await api.importStudyToManaginOrg(filePath1)

		
		// Handling sync delay for uploaded study
		await page.waitForTimeout(20000);

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

	});
		test('Check if there is a study with empty access number', async ({ page }) => {
			const poManager = new POManager(page);
	
			await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
			await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientName);
			await expect(poManager.homePage.worklistTableRows()).toHaveCount(1);
			await expect(poManager.homePage.worklistTableRows().getByTestId('study-status-cell-0_accessionNumber')).toHaveText('');
		});
});
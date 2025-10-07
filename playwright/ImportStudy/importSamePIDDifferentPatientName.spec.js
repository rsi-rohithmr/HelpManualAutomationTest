const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
test.describe('Import two studies for same PID but different patient names', () => {
	let apiContext;
	let api;
	const patientNameOne = 'BATMAN DA SILVA';
	const patientNameTwo = 'CABRAL MARINA';
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeEach(async ({ page }) => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);

		await api.importStudyToManaginOrg(
			path.relative(
				process.cwd(),
				path.join(__dirname, '../TestData/dicomImport/testSamePidDiffPatientName/dicomFileOne.dcm')
			)
		);

		await page.waitForTimeout(10000);

		await api.importStudyToManaginOrg(
			path.relative(
				process.cwd(),
				path.join(__dirname, '../TestData/dicomImport/testSamePidDiffPatientName/dicomFileTwo.dcm')
			)
		);

		await page.waitForTimeout(10000);

		await new POManager(page).loginPage.loginOmegaAI();
	});

	test('PID should be find conflict and be regenerated', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientNameOne);
		await expect(poManager.homePage.worklistTableRows()).toHaveCount(1);
		await expect(page.getByTestId('study-status-cell-0_patientID')).toHaveText('PID_DUPLICATED');

		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientNameTwo);
		await expect(poManager.homePage.worklistTableRows()).toHaveCount(1);

		const itemRow = poManager.homePage.worklistPidRow();
		const pidText = await itemRow.textContent();
		expect(pidText).toBeDefined();
		expect(pidText.trim()).not.toBe('');
		expect(pidText).not.toBe('PID_ABC');
	});
});

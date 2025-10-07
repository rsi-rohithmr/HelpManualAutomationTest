const { test, expect, chromium, request } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
let studyInfo;
let browserContext;
let page;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const expStudyStatus = 'VERIFIED';

test.describe('clickDoneWithoutDV', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result)
			studyInfo = result;
		});
		console.log('Import study to the organization');
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/clickDoneWithoutDV/1.dcm')
		);

		await api.importDICOM(filePath1, studyInfo.studyId);
		await page.waitForTimeout(20000); // 20-second wait for potential sync delay

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAIUser04();
	});

	test('Click Done And Check Study Status', async ({ page }) => {
		const poManager = new POManager(page);

		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo.patientName);
		await poManager.homePage.filterStudiesBySingleColumn('Accession #', studyInfo.accessionNum);

		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true);
		await page.waitForTimeout(5000);

		await poManager.imageViewer.signBtnIV().click({ force: true });
		await page.waitForTimeout(30000);

		await expect(poManager.homePage.worklistTableRows().getByText(new RegExp(`^${expStudyStatus}$`, 'g')).first()).toBeVisible();
	});
});
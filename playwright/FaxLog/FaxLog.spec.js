import { test, expect, request } from '@playwright/test';
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

let patientInfo = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let faxNumber = '18884080252';

test.describe.serial('Fax Log', async () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log('Posted study', result);
			patientInfo = result;
		});
	});

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('send fax', async ({ page }) => {
		const reportTxt = 'Test report save';
		const poManager = new POManager(page);
		await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
			await route.fulfill({
				status: 200,
				body: [],
			});
		});
		await poManager.documentViewer.openDocumentViewer(patientInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		await poManager.documentViewer.signDiagnosticReport();
		await poManager.faxPage.sendFax({patientName: patientInfo.patientName, faxNumber});
		await poManager.faxPage.filterFax({patientName: patientInfo.patientName, accessionNum: patientInfo.accessionNum, faxNumber});
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
		).toBeVisible();
	});
});

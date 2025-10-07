const { test, request, expect } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const managingrganizationId = playwrightConfig.managingOrg.organizationId;
const path = require('path');
const ACTION = 'COMPLETED';
const TRIGGER_TYPE = 'STATUS';
const TRIGGER_SOURCE = 'dicomInjection';
test.describe('statusStudySendEmailAction', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const apiRequests = new APIRequests(apiContext);
		const api = new postStudyNGetToken(apiContext);
		let studyInfo = {};
		await api.postStudy().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.workflowAutomationPage.clearWorkflowAutomation(
			apiRequests,
			ACTION,
			'StudyStatus',
			managingrganizationId
		);

		console.log('go to Workflow Automation Page');
		await poManager.workflowAutomationPage.openWorkflowAutomationPageByUrl(managingrganizationId);
		await poManager.workflowAutomationPage.createStudyStatusTrigger(ACTION);
		await poManager.workflowAutomationPage.createSendEmailActionToSpecificUser(ACTION, TRIGGER_TYPE, true, false);
		await poManager.workflowAutomationPage.createSendEmailActionToReadingPhysician(
			ACTION,
			TRIGGER_TYPE,
			false,
			true,
			TRIGGER_SOURCE
		);
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/dicomImport/11371-1.DCM'));
		await api.importDICOM(filePath, studyInfo.studyId)

	});
	test('Check if there Email Send by Workflow Automation', async ({ page }) => {
		const apiContext = await request.newContext();
		const postStudy = new postStudyNGetToken(apiContext);
		await page.waitForTimeout(30000);
		let response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&reasoncode=Email&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=est%20Email%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20COMPLETEDTriggerSource${TRIGGER_SOURCE}`
		);
	
		expect(response.total).toBeGreaterThan(0);
	});
});

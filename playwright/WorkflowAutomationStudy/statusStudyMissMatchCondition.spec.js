const { test, request, expect } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const managingrganizationId = playwrightConfig.managingOrg.organizationId;

const ACTION = 'CONFIRMED';
const TRIGGER_SOURCE = 'STATUS'
let accessionNum = ''
test.describe('statusStudyMissMatchCondition', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const apiRequests = new APIRequests(apiContext);
		
		const postStudy = new postStudyNGetToken(apiContext);
		let studyInfo = {};
		await postStudy.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
			accessionNum = result.accessionNum;
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
		await poManager.workflowAutomationPage.addMissMatchStudyCondition();
		await poManager.workflowAutomationPage.createSendEmailActionToSpecificUser(ACTION, TRIGGER_SOURCE, true, true);

		const studyResponse = await postStudy.getFhirResourceByCriteria(
			'ImagingStudy',
			`page=1&_count=1&accession=${accessionNum}&managingorganization=${managingrganizationId}`
		);
		console.log('Study Response ', studyResponse);
		const studyId = studyResponse.entry[0].resource.id;
		const studyObject = studyResponse.entry[0].resource;
		const studyStatus = studyObject.extension.find(
			element => element.url === 'http://www.ramsoft.com/fhir/StructureDefinition/status'
		);
		if (studyStatus) {
			studyStatus.valueString = ACTION;
		} else {
			studyObject.extension.push({
				url: 'http://www.ramsoft.com/fhir/StructureDefinition/status',
				valueString: ACTION,
			});
		}
		delete studyObject.procedureCode;
		// remove the procedureCode from the study object
		const updatedResult = await apiRequests.putResource('ImagingStudy', studyId, studyObject);
		
		console.log(`Study Status Updated to ${ACTION}`, updatedResult);
		await page.waitForTimeout(2000);
	});
	test('Check if there Email Send by Workflow Automation statusStudyMissMatchCondition', async ({ page }) => {
		const apiContext = await request.newContext();
		const postStudy = new postStudyNGetToken(apiContext);
		let response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&message=Note%3ATest%20Email%20Send%20to%20Specific%20User(s)%20by%20Workflow%20Automation%20on%20${ACTION}&reasoncode=Email`
		);
	
		expect(response.total).toBeGreaterThan(0);
	});
});

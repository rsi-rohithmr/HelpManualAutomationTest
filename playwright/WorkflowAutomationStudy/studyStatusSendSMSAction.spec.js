const { test, request, expect } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const managingrganizationId = playwrightConfig.managingOrg.organizationId;
const studyUID = '1.2.124.113540.0.202411080521.3.661';
const path = require('path');
const ACTION = 'SIGNED';
const TRIGGER_TYPE = 'STATUS';
test.describe('statusStudySendSMSAction', () => {
	test.beforeEach(async ({ page }) => {
		const apiContext = await request.newContext();
		const apiRequests = new APIRequests(apiContext);
		const postStudy = new postStudyNGetToken(apiContext);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/importEmptyAccessNumber/1.dcm')
		);
		const response = await postStudy.importStudyToManaginOrg(filePath1);
		console.log('Study Imported', response);
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
		await poManager.workflowAutomationPage.createSendSMSActionToPatient(ACTION, TRIGGER_TYPE, true, true);
		// await poManager.workflowAutomationPage.createSendEmailActionToReadingPhysician(ACTION,TRIGGER_TYPE);

		const studyResponse = await postStudy.getFhirResourceByCriteria(
			'ImagingStudy',
			`page=1&_count=1&studyuid=${studyUID}&managingorganization=${managingrganizationId}`
		);
		console.log('Study Response ', studyResponse);
		const studyId = studyResponse.entry[0].resource.id;
		const studyObject = studyResponse.entry[0].resource;
		const studyStatus = studyObject.extension.find(
			element => element.url === 'http://www.ramsoft.com/fhir/StructureDefinition/status'
		);
		if (studyStatus) {
			studyStatus.valueString = 'SIGNED';
		} else {
			studyObject.extension.push({
				url: 'http://www.ramsoft.com/fhir/StructureDefinition/status',
				valueString: 'SIGNED',
			});
		}
		const updatedResult = await apiRequests.putResource('ImagingStudy', studyId, studyObject);
		console.log('Study Status Updated to SIGNED ', updatedResult);
		await page.waitForTimeout(2000);
	});
	test('Check if there SMS Send by Workflow Automation', async ({ page }) => {
		const apiContext = await request.newContext();
		const postStudy = new postStudyNGetToken(apiContext);
		let response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&reasoncode=SMS&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=est%20SMS%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20SIGNED`
		);

		// Check if the response status is 200 or OK
		await expect(response.total).not.toBe(undefined);
	});
});

const { test, request, expect } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
import { OrganizationDetailPage } from '../POM/organizationDetailPage';
const managingOrgName = playwrightConfig.managingOrg.organizationName;
const managingrganizationId = playwrightConfig.managingOrg.organizationId;
const ACTION = 'Signed Report';
const TRIGGER_TYPE = 'OPERATION';
let studyInfo = {};
test.describe('signedReportOperationTrigger', () => {
	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		await poManager.loginPage.loginOmegaAI();
		const apiRequests = new APIRequests(apiContext);
		await poManager.workflowAutomationPage.clearWorkflowAutomation(
			apiRequests,
			ACTION,
			'Operation',
			managingrganizationId
		);
		await poManager.workflowAutomationPage.openWorkflowAutomationPageByUrl(managingrganizationId);
		await poManager.workflowAutomationPage.createOperationTrigger(ACTION);
		await poManager.workflowAutomationPage.createSendEmailActionToSpecificUser(ACTION, TRIGGER_TYPE, true, false);
		await poManager.workflowAutomationPage.createSendEmailActionToReadingPhysician(
			ACTION,
			TRIGGER_TYPE,
			false,
			false
		);
		await poManager.workflowAutomationPage.distributeReportViaEmail(ACTION, TRIGGER_TYPE,'Email')
		await poManager.workflowAutomationPage.distributeReportViaEmail(ACTION, TRIGGER_TYPE,'Fax')
		await page.getByLabel('save-button').click();
		await poManager.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
		await page.getByTestId('change-enable').click();

		// setup managing organization
		const organizationDetailPage = new OrganizationDetailPage(page);
		await organizationDetailPage.openPageByUrl(managingrganizationId);
		await organizationDetailPage.AddingEmailAndFax('RAMSOFTLOCALUSER02@GMAIL.COM', '+18884080251');
		// setup sign off report
		const postStudy = new postStudyNGetToken(apiContext);
		await postStudy.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		const reportTxt = 'Test report final';
		await page.route('**/fhir/DiagnosticReport/*', route => route.continue());

		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);

		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		console.log(await poManager.documentViewer.getElementCount('[data-code="signature"]'));
		await poManager.documentViewer.signDiagnosticReport();

		await page.route('**/DiagnosticReport/**/ReportContent?*', route => route.continue());
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.apiWaitUtils.waitForAPI('ReportContent', 'GET');
	});
	test('Check if there Email Send by Workflow Automation for Signed Report', async ({ page }) => {
		const apiContext = await request.newContext();
		const postStudy = new postStudyNGetToken(apiContext);
		let response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&reasoncode=Email&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=Test%20Email%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20Signed%20Report`
		);
		await expect(response.total).toBeGreaterThan(0);
		response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&reasoncode=Email&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=Test%20Email%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20Signed%20Report`
		);
		await expect(response.total).toBeGreaterThan(0);

		// verify the distribute report action by email
		response = await postStudy.getFhirResourceByCriteria(
			'task',
			`managingOrganization=${managingrganizationId}&reasoncode=Email&trigger=Workflow%20Automation&patientName=${encodeURIComponent(studyInfo.patientName)}`
		);
		await expect(response.total).toBeGreaterThan(0);
		// verify the distribute report action by fax
		response = await postStudy.getFhirResourceByCriteria(
			'fax',
			`organizationid=${managingrganizationId}&patient=${encodeURIComponent(studyInfo.patientName)}`
		);
		await expect(response.total).toBeGreaterThan(0);
	});
});

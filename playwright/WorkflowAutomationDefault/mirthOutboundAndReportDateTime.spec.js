const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe.serial(
	'Mirth Outbound And Report Date Time Tests',
	{ tags: ['@sf-mirthoutboundandreprtdatetime'] },
	() => {
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		let studyInfo = {};
		let browser;
		let page;
		test.beforeAll(async () => {
			browser = await chromium.launch();
			page = await browser.newPage();
			const poManager = new POManager(page);

			const apiContext = await request.newContext();
			const api = new postStudyNGetToken(apiContext);

			await api.postStudy().then(result => {
				console.log(result);
				studyInfo = result;
			});

			await poManager.loginPage.loginOmegaAI();
			await poManager.workflowAutomationPage.openWorkflowAutomationPage(managingOrgName);
		});

		test('Test MirthOutbound task is created after sign off', async () => {
			const apiContext = await request.newContext();
			const api = new postStudyNGetToken(apiContext);
			const poManager = new POManager(page);
			// Create new final report
			const reportTxt = 'New Test report final';
			let newInternalReportID = 0;

			await page.route('**/fhir/DiagnosticReport/*', route => route.continue());

			await poManager.documentViewer.openHomePage();
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);

			await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
			console.log(await poManager.documentViewer.getElementCount('[data-code="signature"]'));
			await poManager.documentViewer.signDiagnosticReport();

			const signoffResponse = await api.getFhirResourceByCriteria(
				'DiagnosticReport',
				`imagingstudy=${studyInfo.studyId}`
			);

			console.log('Signoff Response: ' + JSON.stringify(signoffResponse));

			newInternalReportID = signoffResponse.entry[0].resource.id;
			console.log('New Internal Report ID: ' + newInternalReportID);

			await page.waitForTimeout(60000); // Wait for az function created mirthoutbound task (60 seconds)

			const uri = `reasoncode=mirthoutbound&status=ready&focus.reference=diagnosticreport/${newInternalReportID}`;
			console.log('Get outbound task by request url: ' + uri);

			const result = await api.getFhirResourceByCriteria('task', uri);
			expect(result.total).toBe(1);
		});

		test('Test Datetime Read After Sign Report', async () => {
			const apiContext = await request.newContext();
			const api = new postStudyNGetToken(apiContext);
			const uri = `studyid=${studyInfo.studyId}`;
			console.log(`Fetching resource using URL: ${uri}`);

			const result = await api.getFhirResourceByCriteria('ImagingStudyWorklist/elk', uri);
			console.log('Response received:', JSON.stringify(result));

			expect(result.total).toBe(1);
			expect(result.entry[0].resource.dateTimeRead).not.toBe('');
		});
	}
);

const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
let postData;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
// When DICOM file is changed then update below variable i.e patientName,studyInstanceuid
const patientName = 'CHEST ANGIO';
const studyInstanceuid = '1.3.6.1.4.1.5962.1.2.80.1166562673.14401';
let studyInfo;

test.describe('studyReactivation, verify the internalPatientID in diagnostic report save request and added check for patient report mismatch', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
		console.log('Import study to the organization');
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/CT0081.dcm'));
		await api.importStudyToManaginOrg(filePath);
		const responseBody = await api.deleteStudyFromMangingOrg(studyInstanceuid);
		expect(responseBody).toContain(`Soft Delete for Study: ${studyInstanceuid} success`);
		await api.importStudyToManaginOrg(filePath);
	});

	test.beforeEach('login', async ({ page }) => {
		const poManager = new POManager(page);
		await page.waitForTimeout(60000); // 60-second wait for potential sync delay
		await poManager.loginPage.loginOmegaAI();
	});

	test('DICOM import and load image and verify the internalPatientID in diagnostic report save request', async ({
		page,
	}) => {
		const poManager = new POManager(page);
		await poManager.imageViewer.openImageViewer(patientName, managingOrgName);
		await poManager.imageViewer.waitPageToLoad();
			await page.locator('[data-testid="ExpandableSection"]').first().click();
		await expect(
			page
				.getByTestId('ImageViewerViewportCornerstone')
				.locator('[data-testid="ImageViewerViewportOverlay"]')
				.first()
		).toBeVisible();
		await page.getByTestId('ImageViewerSplitButton').getByRole('button').click();

		// Intercept and capture POST request payload
		await page.route('**/fhir/DiagnosticReport?*', async route => {
			if (route.request().method() === 'POST') {
				postData = JSON.parse(route.request().postData());
				console.log('Request Payload:', postData);
			}
			await route.continue();
		});
		await page.waitForTimeout(10000); // Editor to render
		await Promise.all([
			poManager.documentViewer.newReportEditorTextArea().pressSequentially('reportTxt'),
			poManager.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport?', 'POST'),
		]);

		// Log to verify access to postData outside of the route
		const url = await page.url();
		const urlParams = new URL(url).searchParams;
		const patientInfo = urlParams.get('PatientInfo');

		console.log('PatientInfo value:', patientInfo);

		console.log('Captured Patient internal ID:', postData.subject.id);
		expect(patientInfo).toEqual(postData.subject.id);
		// checking whether correct report is opening for different patient after opening the embedded DV RT-4242
		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		// blank report should be there
		await poManager.documentViewer.preliminaryReportCardValidation(
			'Reading Physician'.toLowerCase(),
			`Preliminary Report`,
			'Managing Organization'.toLocaleLowerCase(),
			'skip',
			'Date/Time'
		);
		// Use postData as needed, such as in an API call
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.deleteStudyFromMangingOrg(studyInstanceuid);
	});
});

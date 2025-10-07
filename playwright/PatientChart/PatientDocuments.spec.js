const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');

const playwrightConfig = require('../../playwright.config');
const managingOrgName = playwrightConfig.managingOrg.organizationName;

let studyInfo = {};

test.describe('DV Patient Chart', () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log('The Study Info ', result);
			studyInfo = result;
		});
	});
	test.beforeEach('login', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Patient Chart - Patient Documents', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

		let patientDocumentsLength = 0;
		let blumePatientFormsLength = 0;

		// Get the total number of patient documents at page load
		const patientDocumentsResponse = await poManager.apiWaitUtils.waitForAPI('/fhir/DocumentReference', 'GET');
		patientDocumentsLength = patientDocumentsResponse?.total;

		console.log('Document Reference API Response : ', patientDocumentsLength);

		// Get the total number of blume patient forms at page load
		const blumePatientFormsResponse = await poManager.apiWaitUtils.waitForAPI('/fhir/Form', 'GET');
		blumePatientFormsLength = blumePatientFormsResponse?.total;

		console.log('Blume API Response : ', blumePatientFormsLength);

		// Test the patient chart card stack container is visible
		expect(poManager.documentViewer.patientChartCardStackContainer()).toBeVisible();

		// Test the patient chart card stack container is visible
		expect(poManager.documentViewer.patientChartCardStackContainer()).toBeVisible();

		const cards = poManager.documentViewer.patientChartCardTitle();

		// Test the patient chart card titles
		await expect(cards.nth(0)).toContainText('Patient Documents');
		await expect(cards.nth(1)).toContainText(studyInfo?.patientName);

		// Only 2 cards are expected to be displayed
		await expect(cards).toHaveCount(2);

		// Click on the patient documents
		await cards.nth(0).click();

		// Move the mouse away from the card to avoid hover effect on a different card
		await page.mouse.move(0, 0);

		// Test the patient chart - patient documents card
		const patientChartPatientDocumentsCard = poManager.documentViewer.patientChartCardContainer('documents');

		// Patient chart with patient documents should be expanded
		expect(patientChartPatientDocumentsCard).toBeVisible();

		// Check for the tabs to be present
		const allTab = poManager.documentViewer.patientChartPatientDocumentTabs('All');
		const uploadedDocumentTab = poManager.documentViewer.patientChartPatientDocumentTabs('Uploaded Document');
		const registrationFormTab = poManager.documentViewer.patientChartPatientDocumentTabs('Registration Form');

		// By default, the 'All' tab should be selected
		expect(allTab).toBeVisible();
		expect(uploadedDocumentTab).toBeVisible();
		expect(registrationFormTab).toBeVisible();

		let totalNumberOfDocuments = patientDocumentsLength + blumePatientFormsLength;

		let uploadButton;

		// If the patient documents + blume forms are 0, the message should be displayed
		if (totalNumberOfDocuments > 0) {
			uploadButton = page.locator("button[aria-label='Upload Document']");
			console.log('Documents found. Upload document button :', uploadButton);
			expect(uploadButton).toBeVisible();
		} else {
			uploadButton = page.getByTestId('no-documents-text');
			console.log('No documents found. Upload document button :', uploadButton);
			expect(uploadButton).toBeVisible();
		}

		// Upload by drag and drop the document and assert that the number is increased.
		const uploadedFileName = await poManager.documentViewer.documentFileUpload(poManager);

		console.log('Upload API call completed - Upload complete');

		await page.waitForTimeout(2000);

		// Check the number of documents
		expect(page.locator('[data-testid="patient-document-count"]')).toContainText(`${totalNumberOfDocuments + 1}`);

		console.log('Document count verified : ', totalNumberOfDocuments + 1);

		// Increment the number of documents if the assertion is successful
		totalNumberOfDocuments += 1;
		patientDocumentsLength += 1;

		// Check the documents
		expect(page.locator(`[data-testid="patient-document-${uploadedFileName}"]`)).toBeVisible();

		console.log('Total number of documents : ', totalNumberOfDocuments);
		expect(page.getByText('All Documents')).toBeVisible();

		// Switch to the 'Uploaded Document' tab
		await uploadedDocumentTab.click();

		await page.waitForTimeout(2000);

		// Check the 'Uploaded Document' tab is selected
		expect(page.getByText('Uploaded Documents')).toBeVisible();

		// The upload button should be visible in the 'Uploaded Document' tab
		uploadButton = page.locator("button[aria-label='Upload Document']");
		console.log('Upload document button :', uploadButton);
		expect(uploadButton).toBeVisible();

		// Open the final doc on left panel
		const preliminaryDoc = poManager.documentViewer.preliminaryReportCard();
		await preliminaryDoc.click({ force: true });

		await page.waitForTimeout(2000);

		// Drag and drop the document to the viewport
		// Open the viewport
		const viewport = page.locator('[data-testid="add-viewport-button"]');
		await viewport.click();

		const emptyViewport = page.locator('[data-testid="viewport-empty-container"]');
		expect(emptyViewport).toBeVisible();

		// Open the side bar
		const sideBar = page.locator('[data-testid="navigator-wrapper"]');
		expect(sideBar).toBeVisible();

		await sideBar.click();

		await page.waitForTimeout(2000);

		// Document should be visible in the uploaded tab
		const uploadedFile = page.locator(`[data-testid="patient-document-${uploadedFileName}"]`);
		expect(uploadedFile).toBeVisible();

		// Drag and drop the document to the viewport
		await uploadedFile.dragTo(emptyViewport);

		await page.waitForTimeout(2000);

		// Check if the document is visible in the viewport
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);

		// Switch to the 'Registration form' tab
		await registrationFormTab.click();

		// Check if 'Registration Form' tab is selected
		if (blumePatientFormsLength > 0) {
			expect(page.getByText('Registration Form:')).toBeVisible();
		} else {
			expect(page.getByText('No Forms available')).toBeVisible();
		}
	});
});

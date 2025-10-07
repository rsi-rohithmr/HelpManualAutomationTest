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

	test('Patient Chart - Patient Info Card', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

		// Test the patient chart card stack container is visible
		expect(poManager.documentViewer.patientChartCardStackContainer()).toBeVisible();

		const cards = poManager.documentViewer.patientChartCardTitle();

		// Test the patient chart card titles
		await expect(cards.nth(0)).toHaveText('Patient Documents');
		await expect(cards.nth(1)).toHaveText(studyInfo?.patientName);

		// Only 2 cards are expected to be displayed
		await expect(cards).toHaveCount(2);

		// Click on the patient name
		await cards.nth(1).click();

		// Test the patient chart card
		const patientChartPatientCard = poManager.documentViewer.patientChartCardContainer('info');

		// Patient chart with patient info should be expanded
		expect(patientChartPatientCard).toBeVisible();

		expect(page.getByTestId('name-label')).toHaveText(studyInfo?.patientName);
		// Commented out the below line as the patient ID is not available in the study info
		// expect(page.getByTestId('patient-id-label')).toHaveText(`Patient ID: ${studyInfo?.patientId}`);

		// Convert the patient gender and birthdate to the correct format
		const patientGender =
			studyInfo?.patientGender === 'UNKNOWN'
				? 'unknown'
				: studyInfo?.patientGender?.charAt(0).toUpperCase() + studyInfo?.patientGender?.slice(1).toLowerCase();

		const patientBirthday = poManager.documentViewer.formatDateWithAge(studyInfo?.patientBirthday);

		expect(page.getByTestId('gender-text')).toHaveText(patientGender);
		expect(page.getByTestId('birthDate-text')).toHaveText(patientBirthday);
	});
});

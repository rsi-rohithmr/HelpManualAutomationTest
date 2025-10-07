const { test, expect, request } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { PatientAlertPage } from 'playwright/POM/patientInformation/patientAlertPage';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { studyGenerator } from 'playwright/generators/studyGenerator';

let utilFuncs;
let patientInfo = {};
const today = new Date();
let alert = {
	alertDescription: '',
	startYear: today.getFullYear(),
	endYear: today.getFullYear() + 1,
	note: '',
};

test.describe.serial('Patient Alert', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
		patientInfo = await studyGenerator.postStudy();
	});

	test.beforeEach('login and open Patient Alert page', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		const patientAlertPage = new PatientAlertPage(page);
		await patientAlertPage.openPatientAlertPage(patientInfo?.patientId);
	});

	test('Create a Patient Alert successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		alert.alertDescription = `E2E Alert ${randomNum}`;
		alert.note = `Note ${randomNum}`;

		const patientAlertPage = new PatientAlertPage(page);

		await patientAlertPage.addNewAlertIcon().click();
		await expect(patientAlertPage.formHeader()).toHaveText('Alerts');

		// Input data
		await patientAlertPage.inputFormData(alert);

		// Verify alert description and  note preview
		await expect(patientAlertPage.alertDescriptionAndNotePreview(alert.alertDescription)).toBeVisible();
		await expect(patientAlertPage.alertDescriptionAndNotePreview(alert.note)).toBeVisible();

		const inputStartDate = await patientAlertPage.startDatePicker().inputValue();
		const inputEndDate = await patientAlertPage.endDatePicker().inputValue();

		await page.route('/fhir/PatientAlert', route => route.continue());
		await Promise.all([
			patientAlertPage.createBtn().click(),
			patientAlertPage.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'POST'),
		]);

		await expect(patientAlertPage.formHeader()).not.toBeVisible();

		// Verify alert contents on the Alert card
		await expect(page.getByText(alert.alertDescription)).toBeVisible();
		await expect(page.getByText(alert.note)).toBeVisible();
		await expect(page.getByText(`${inputStartDate} - ${inputEndDate}`)).toBeVisible();
	});

	test('Update a Patient Alert successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const newAlertContent = {
			alertDescription: `E2E Alert ${randomNum}`,
			endYear: alert.endYear + 1,
			note: `Note ${randomNum}`,
		};

		const patientAlertPage = new PatientAlertPage(page);

		await page.getByText(alert.alertDescription).click();
		await patientAlertPage.inputFormData(newAlertContent);

		alert.alertDescription = newAlertContent.alertDescription;
		alert.note = newAlertContent.note;
		alert.endYear = newAlertContent.endYear;

		const inputStartDate = await patientAlertPage.startDatePicker().inputValue();
		const inputEndDate = await patientAlertPage.endDatePicker().inputValue();

		await page.route('/fhir/PatientAlert', route => route.continue());
		await Promise.all([
			patientAlertPage.updateBtn().click(),
			patientAlertPage.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'PUT'),
		]);

		await expect(patientAlertPage.formHeader()).not.toBeVisible();

		// Verify updated contents on the Alert card
		expect(page.getByText(alert.alertDescription)).toBeVisible();
		expect(page.getByText(alert.note)).toBeVisible();
		expect(page.getByText(`${inputStartDate} - ${inputEndDate}`)).toBeVisible();
	});

	test('Delete a Patient Alert successfully', async ({ page }) => {
		const patientAlertPage = new PatientAlertPage(page);

		await page.getByText(alert.alertDescription).hover();
		await patientAlertPage.deleteIcon().click();
		await page.mouse.down();
		await page.waitForTimeout(3000);
		await page.mouse.up();

		expect(page.getByText(alert.alertDescription)).not.toBeVisible();
		expect(page.getByText(alert.note)).not.toBeVisible();
	});
});

const { test, expect, request } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { PatientAllergyPage } from 'playwright/POM/patientInformation/patientAllergyPage';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { studyGenerator } from 'playwright/generators/studyGenerator';

let utilFuncs;
let patientInfo = {};

test.describe.serial('Patient Allergy', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
		patientInfo = await studyGenerator.postStudy();
	});

	test.beforeEach('login and open Patient Allergy page', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		const patientAllergyPage = new PatientAllergyPage(page);
		await patientAllergyPage.openPatientAllergyPage(patientInfo?.patientId);
	});

	test('Create a Patient Allergy successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const today = new Date();
		const startYear = today.getFullYear() + 1;
		const recordedYear = today.getFullYear() - 1;
		const allergy = {
			offendingAgent: 'BIOTIN 100',
			offendingAgentDrugCode: '99992007',
			reactionType: 'Low',
			startYear: startYear,
			severity: 'Mild',
			reactionDescription: `E2E Allergy ${randomNum}`,
			recordedYear: recordedYear,
			note: `Note ${randomNum}`,
		};

		const patientAllergyPage = new PatientAllergyPage(page);

		await patientAllergyPage.addNewAllergyIcon().click();
		expect(patientAllergyPage.formHeader()).toHaveText('Allergies & Adverse Reactions');

		// Input data
		await patientAllergyPage.inputFormData(allergy);

		// Verify calculating initial card in the drawer
		expect(patientAllergyPage.offendingAgentOnInitialCard(allergy.offendingAgent)).toBeVisible();
		expect(patientAllergyPage.reactionDescriptionOnInitialCard(allergy.reactionDescription)).toBeVisible();

		const inputStartDate = await patientAllergyPage.startDatePicker().inputValue();

		await page.route('fhir/AllergyIntolerance', route => route.continue());
		await Promise.all([
			patientAllergyPage.createBtn().click(),
			patientAllergyPage.apiWaitUtils.waitForAPI('/fhir/AllergyIntolerance', 'POST'),
		]);

		await expect(patientAllergyPage.formHeader()).not.toBeVisible();

		// Verify Allergy data on the card after saving
		expect(
			patientAllergyPage.allergyCardInfo(`${allergy.offendingAgent}${allergy.offendingAgentDrugCode}`)
		).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(inputStartDate)).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(allergy.reactionType)).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(allergy.severity)).toBeVisible();
	});

	test('Update a Patient Allergy successfully', async ({ page }) => {
		const randomNum1 = utilFuncs.generateRandomNumber(111111, 999911);
		const randomNum2 = utilFuncs.generateRandomNumber(111111, 999911);
		const today = new Date();
		const startYear = today.getFullYear() + 1;
		const recordedYear = today.getFullYear() - 1;
		const allergy1 = {
			offendingAgent: 'BIOTIN 100',
			offendingAgentDrugCode: '99992007',
			reactionType: 'Low',
			severity: 'Mild',
			reactionDescription: `E2E Allergy ${randomNum1}`,
			note: `Note ${randomNum1}`,
		};
		const allergy2 = {
			offendingAgent: 'BIOVAC',
			offendingAgentDrugCode: '99993002',
			reactionType: 'High',
			startYear: startYear,
			severity: 'Moderate',
			reactionDescription: `E2E Allergy ${randomNum2}`,
			recordedYear: recordedYear,
			note: `Note ${randomNum2}`,
		};

		const patientAllergyPage = new PatientAllergyPage(page);

		await patientAllergyPage.addPatientAllergy(allergy1);

		await expect(patientAllergyPage.formHeader()).not.toBeVisible();

		// Click on the card to open Edit drawer
		await patientAllergyPage
			.allergyCardInfo(`${allergy1.offendingAgent}${allergy1.offendingAgentDrugCode}`)
			.click();

		await patientAllergyPage.inputFormData(allergy2, true);

		const inputStartDate = await patientAllergyPage.startDatePicker().inputValue();

		await page.route('/fhir/AllergyIntolerance', route => route.continue());
		await Promise.all([
			patientAllergyPage.updateBtn().click(),
			patientAllergyPage.apiWaitUtils.waitForAPI('/fhir/AllergyIntolerance', 'PUT'),
		]);

		await expect(patientAllergyPage.formHeader()).not.toBeVisible();

		// Verify Allergy data on the card after saving
		expect(
			patientAllergyPage.allergyCardInfo(`${allergy2.offendingAgent}${allergy2.offendingAgentDrugCode}`)
		).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(inputStartDate)).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(allergy2.reactionType)).toBeVisible();
		expect(patientAllergyPage.allergyCardInfo(allergy2.severity)).toBeVisible();
	});

	test('Delete a Patient Allergy successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const allergy = {
			offendingAgent: 'BIOVAC -D',
			offendingAgentDrugCode: '99994008',
			reactionType: 'Low',
			severity: 'Severe',
			reactionDescription: `E2E Allergy ${randomNum}`,
			note: `Note ${randomNum}`,
		};

		const patientAllergyPage = new PatientAllergyPage(page);

		await patientAllergyPage.addPatientAllergy(allergy);

		await expect(patientAllergyPage.formHeader()).not.toBeVisible();

		await patientAllergyPage.allergyCardInfo(allergy.severity).hover();
		await patientAllergyPage.deleteIcon().click();
		await page.mouse.down();
		await page.waitForTimeout(3000);
		await page.mouse.up();

		expect(patientAllergyPage.allergyCardInfo(allergy.severity)).not.toBeVisible();
	});
});

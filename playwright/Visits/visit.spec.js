import { visitDO } from '../dataObjects/visitsDO';
const { POManager } = require('../POM/POManager');
const { test, expect } = require('@playwright/test');
const { visitGenerator } = require('../generators/visitGenerator');
const { VisitInformationPage } = require('../POM/visits/visitInformationPage');
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { StudyInfoPage } from 'playwright/POM/study/studyInfoPage';
import { dateTimeHelper } from 'playwright/POM/utils/dateTimeHelper';
import { cloneDeep } from 'lodash';
const playwrightConfig = require('../../playwright.config');

let visitInfo;
let page;
let visitInformationPage;
let context;
test.describe.serial('VisitInfo Tests', () => {
	let expectedVisitInfoDO = {
		clinicalSection: { ...visitDO.clinicalSection },
		visitDetailsSection: { ...visitDO.visitDetailsSection },
		visitHeaderSection: { ...visitDO.visitHeaderSection },
	};
	let expectedVisitCount = 0;
	test.beforeAll(async ({ browser }) => {
		context = await browser.newContext();
		page = await context.newPage();
		visitInfo = await studyGenerator.postStudy();
		const poManager = new POManager(page);
		visitInformationPage = new VisitInformationPage(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('View visit header section details using the url', async ({}) => {
		const response = await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');

		expectedVisitInfoDO = await visitGenerator.getVisitDetailsFromInputJson(response);
		expectedVisitCount = response.total;
		const actualVisitDetailsDO = await visitInformationPage.getVisitInformationFromPage();
		expect(actualVisitDetailsDO.visitNumber).toEqual(expectedVisitInfoDO.visitHeaderSection['Visit Number']);
		expect(actualVisitDetailsDO.patientClass).toEqual(
			expectedVisitInfoDO.visitHeaderSection['Visit Class'] === 'inpatient encounter'
				? 'Inpatient'
				: expectedVisitInfoDO.visitHeaderSection['Visit Class']
		);
		expect(actualVisitDetailsDO.specialCourtesy).toEqual(
			expectedVisitInfoDO.visitHeaderSection['Special Courtesy'] === 'extended courtesy'
				? 'Extended'
				: expectedVisitInfoDO.visitHeaderSection['Special Courtesy']
		);
	});

	test('verify the visits number in visit section left panel', async ({}) => {
		const response = await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');
		expectedVisitInfoDO = await visitGenerator.getVisitDetailsFromInputJson(response);
		expectedVisitCount = response.total;
		const actualVisitCount = await visitInformationPage.visitListCount();
		expect(actualVisitCount).toEqual(expectedVisitCount.toString());
	});
	test('verify the expand and collapse for every visit section', async ({}) => {
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');

		const sections = [
			{
				button: visitInformationPage.expandVisitDetailsSectionBtn(),
				content: visitInformationPage.visitDetailsSection(),
			},
			{
				button: visitInformationPage.expandVisitPatientVitalSectionBtn(),
				content: visitInformationPage.visitPatientVitalSection(),
			},
			{
				button: visitInformationPage.expandVisitClinicalSectionBtn(),
				content: visitInformationPage.visitClinicalSection(),
			},
			{
				button: visitInformationPage.expandVisitAccidentNotesSectionBtn(),
				content: visitInformationPage.visitAccidentNotesSection(),
			},
		];
		await visitInformationPage.expandVisitSectionInfoBtn().click();

		for (const section of sections) {
			// Initially, the section should be collapsed
			await expect(section.content.locator('div.MuiCollapse-entered')).toBeVisible();

			// Click to expand the section
			await section.button.click();
			await expect(section.content.locator('div.MuiCollapse-hidden')).not.toBeVisible();

			// Click to collapse the section
			await section.button.click();
			await expect(section.content.locator('div.MuiCollapse-entered')).toBeVisible();
		}
	});

	test('verify visit details information', async ({}) => {
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		const response = await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');

		expectedVisitInfoDO = await visitGenerator.getVisitDetailsFromInputJson(response);
		const expectedVisitDetails = expectedVisitInfoDO.visitDetailsSection;
		await visitInformationPage.expandVisitSectionInfoBtn().click();
		const actualVisitDetails = await visitInformationPage.getVisitDetailsInformationFromPage();
		console.log('actualVisitDetails', actualVisitDetails);
		console.log('expectedVisitDetails', expectedVisitDetails);
		//await visitInformationPage.expandVisitSectionInfoBtn().click();
		const expectedDate = new Date(expectedVisitInfoDO.visitDetailsSection['Date/Time of Visit']);
		const formattedExpectedDate = !isNaN(expectedDate.getTime())
			? new Intl.DateTimeFormat('en-US', {
					month: '2-digit',
					day: '2-digit',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit',
			  }).format(expectedDate)
			: 'Invalid Date';
		expect(actualVisitDetails.dateTime).toEqual(formattedExpectedDate);
		expect(actualVisitDetails.type).toEqual(expectedVisitInfoDO.visitDetailsSection['Encounter Type']);
		expect(actualVisitDetails.physician).toEqual(
			expectedVisitInfoDO.visitDetailsSection['Attending Physician/Nurse']
		);
		expect(actualVisitDetails.location).toEqual(expectedVisitInfoDO.visitDetailsSection['Location of Encounter']);
		expect(actualVisitDetails.reason).toEqual(expectedVisitInfoDO.visitDetailsSection['Visit Reason/History']);
	});
	//Will enable once this Jira gets fixed https://ramsoftinc.atlassian.net/browse/PRO-6274
	test.skip('edit visit details information', async ({}) => {
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');

		await visitInformationPage.expandVisitSectionInfoBtn().click();

		const patchExpectedVisitInfoDO = await visitInformationPage.setVisitDetailsInformation();
		// Verify the updated visit details
		const actualVisitDetails = await visitInformationPage.getVisitDetailsInformationFromPage();
		expectedVisitInfoDO = await visitGenerator.getVisitDetailsFromInputJsonWithoutEntryResource(
			patchExpectedVisitInfoDO
		);
		const expectedVisitDetails = expectedVisitInfoDO.visitDetailsSection;
		console.log('actualVisitDetails', actualVisitDetails);
		console.log('newVisitDetails', expectedVisitDetails);
		const expectedDate = new Date(expectedVisitInfoDO.visitDetailsSection['Visit Date/Time']);
		const formattedExpectedDate = !isNaN(expectedDate.getTime())
			? new Intl.DateTimeFormat('en-US', {
					month: '2-digit',
					day: '2-digit',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
			  }).format(expectedDate)
			: 'N/A';
		expect(actualVisitDetails.dateTime).toEqual(formattedExpectedDate);
		expect(actualVisitDetails.type).toEqual(expectedVisitInfoDO.visitDetailsSection['Encounter Type']);
		expect(actualVisitDetails.physician).toEqual(
			expectedVisitInfoDO.visitDetailsSection['Attending Physician/Nurse']
		);
		expect(actualVisitDetails.location).toEqual(expectedVisitInfoDO.visitDetailsSection['Location of Encounter']);
	});
	test('verify and edit plan of care and follow-up instructions', async ({}) => {
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		const response = await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');

		expectedVisitInfoDO = await visitGenerator.getVisitDetailsFromInputJson(response);

		// Test data for plan of care and follow-up instructions
		const careInstructions = {
			planOfCare: 'Patient requires regular monitoring of vital signs',
			followUpInstructions: 'Schedule follow-up appointment in 2 weeks',
		};

		await visitInformationPage.expandVisitSectionInfoBtn().click();

		// Fill in the plan of care and follow-up instructions
		await visitInformationPage.formFieldPlanOfCare().click();
		await visitInformationPage.formFieldPlanOfCare().fill(careInstructions.planOfCare);

		await visitInformationPage.formFieldFollowUpInstruction().click();
		await visitInformationPage.formFieldFollowUpInstruction().fill(careInstructions.followUpInstructions);

		// Save the changes
		await page.getByTestId('save-button').click();

		// Verify the updated values
		const planOfCareValue = await visitInformationPage.formFieldPlanOfCare().inputValue();
		const followUpValue = await visitInformationPage.formFieldFollowUpInstruction().inputValue();

		expect(planOfCareValue).toEqual(careInstructions.planOfCare);
		expect(followUpValue).toEqual(careInstructions.followUpInstructions);
	});
	test.skip('verify and edit patient vitals section', async ({}) => {
		// Setup route interception
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');
		await visitInformationPage.expandVisitSectionInfoBtn().click();

		// Test data
		const patientVitals = {
			height: '178',
			weight: '80',
			heartRate: '80',
			systole: '70',
			diastole: '180',
			observation: ['Light', 'Social'],
		};

		// Helper function for hovering and filling form fields
		const fillFormField = async (fieldSelector, fieldId, value) => {
			const formField = page.locator(`[data-testid="${fieldSelector}"]`);

			await formField.hover();

			// Target the specific input using its ID
			const input = page.locator(`#form-field-${fieldId}`);
			await input.fill(value);

			await page.mouse.move(100, 100);
		};
		const heightField = await page.locator('[data-testid="form-field-height"]'); // Adjust selector if needed
		await heightField.hover();
		await visitInformationPage
			.formFieldHeight()
			.fill(
				patientVitals.height
			); /* Promise.all([ visitInformationPage.formFieldHeight().fill(patientVitals.height)]); */
		// Move to specific coordinates
		await page.mouse.move(100, 100);
		// Fill basic vitals with proper field IDs
		//await fillFormField('form-field-height', 'Height', patientVitals.height);
		await fillFormField('form-field-weight', 'Weight', patientVitals.weight);
		//await fillFormField('form-field-heartRate', 'Heart Rate', patientVitals.heartRate);
		const heartRateField = await page.locator('[data-testid="form-field-heartRate"]'); // Adjust selector if needed
		await Promise.all([
			heartRateField.hover(),
			visitInformationPage.formFieldHeartRate().fill(patientVitals.heartRate),
		]);
		// Handle blood pressure fields
		const bpField = await page.locator('[data-testid="form-field-bloodPressure"]');
		await bpField.hover();
		await visitInformationPage.formFieldSystole().fill(patientVitals.systole);
		await page.keyboard.press('Tab');
		await visitInformationPage.formFieldDiastole().fill(patientVitals.diastole);
		await page.mouse.move(100, 100);

		// Set fixed LMP date
		const lmpField = await page.locator('[data-testid="form-field-lmp"]');
		await lmpField.hover();
		await visitInformationPage.patientVitalsDatePicker().fill('11/11/2022');
		await page.mouse.move(100, 100);

		// Helper function for handling dropdowns
		const selectDropdownOption = async (fieldId, optionName) => {
			const field = await page.locator(`[data-testid="form-field-${fieldId}"]`);
			await field.hover();
			await page
				.locator(
					`div[role="button"][aria-haspopup="listbox"]#form-field-${
						fieldId.charAt(0).toUpperCase() + fieldId.slice(1)
					}\\ Habit`
				)
				.click();
			const option = page.getByRole('option', { name: optionName, exact: true });
			await expect(option).toBeVisible();
			await option.click();
			await page.mouse.move(100, 100);
		};

		// Set habits
		await selectDropdownOption('smoking', 'Light');
		await selectDropdownOption('drinking', 'Social');

		// Set pregnancy status
		const pregnancyField = await page.locator('[data-testid="form-field-pregnancy"]');
		await pregnancyField.hover();
		await page.locator('div[role="button"][aria-haspopup="listbox"]#form-field-Pregnancy\\ Status').click();
		const pregnancyOption = page.getByRole('option', { name: 'Pregnant', exact: true });
		await expect(pregnancyOption).toBeVisible();
		await pregnancyOption.click();
		await page.waitForTimeout(1000);
		await page.mouse.move(200, 400);

		// Save changes
		await page.getByTestId('save-button').click();

		// Helper function for verifying field values
		const verifyFieldValue = async (field, expectedValue) => {
			const value = await field.locator('span').textContent();
			expect(value).toEqual(expectedValue);
		};

		// Verify all values
		const fields = {
			height: await page.locator('[data-testid="form-field-height"]'),
			weight: await page.locator('[data-testid="form-field-weight"]'),
			heartRate: await page.locator('[data-testid="form-field-heartRate"]'),
			bloodPressure: await page.locator('[data-testid="form-field-bloodPressure"]'),
		};

		await verifyFieldValue(fields.height, patientVitals.height);
		await verifyFieldValue(fields.weight, patientVitals.weight);
		await verifyFieldValue(fields.heartRate, patientVitals.heartRate);

		// Verify blood pressure
		const bpValue = await fields.bloodPressure.locator('span').textContent();
		const [systolic, diastolic] = bpValue.split('/').map(v => v.trim());
		expect(systolic).toEqual(patientVitals.systole);
		expect(diastolic).toEqual(patientVitals.diastole);

		// Verify dropdowns
		const verifyDropdownValue = async (fieldId, expectedValue) => {
			const field = page.locator(`[data-testid="form-field-${fieldId}"]`);
			const value = await field.locator('span').textContent();
			expect(value).toEqual(expectedValue);
		};

		await verifyDropdownValue('smoking', 'Light');
		await verifyDropdownValue('drinking', 'Social');
		await verifyDropdownValue('pregnancy', 'Pregnant');
	});

	test('Add, update and delete accident note', async ({ page }) => {
		await page.route(`**/Encounter**`, async route => {
			route.continue();
		});

		await visitInformationPage.openVisitDetailsAndWaitForAPI(visitInfo?.orderId, '/Encounter?');
		let studyInfoPage = new StudyInfoPage(page);
		await visitInformationPage.expandVisitSectionInfoBtn().click();
		const actualVisitDetails = await visitInformationPage.getVisitDetailsInformationFromPage();
		console.log('actualVisitDetails', actualVisitDetails);

		let expectedAccidentNote = cloneDeep(visitDO.accidentNotes);

		// Add a study note
		//await visitInformationPage.accidentNotesSectionExpandBtn().click();
		expectedAccidentNote.count = 3;
		expectedAccidentNote.note0Content = 'E2E Note 1';
		expectedAccidentNote.note0CreatedBy = studyInfoPage.reverseName(playwrightConfig.userFullName2, true);
		expectedAccidentNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY h:mm A');
		await visitInformationPage.addNote(expectedAccidentNote.note0Content);
		await page.reload();
		await visitInformationPage.accidentNotesSectionExpandBtn().click();
		let actualAccidentNote = await visitInformationPage.getAccidentNoteFormValues();

		console.log('actualAccidentNoteAfterAdd', actualAccidentNote);
		console.log('expectedAccidentNoteAfterAdd', expectedAccidentNote);
		expect({ ...expectedAccidentNote, ...actualAccidentNote }).toEqual(actualAccidentNote);

		// Update study note
		const note2 = 'E2E Note 2';
		expectedAccidentNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY h:mm A');
		await visitInformationPage.accidentNotesSectionExpandBtn().click();
		await visitInformationPage.updateNote(note2);
		expectedAccidentNote.note0Content = note2;
		actualAccidentNote = await visitInformationPage.getAccidentNoteFormValues();

		console.log('actualAccidentNoteAfterAdd', actualAccidentNote);
		console.log('expectedAccidentNoteAfterAdd', expectedAccidentNote);
		expect({ ...expectedAccidentNote, ...actualAccidentNote }).toEqual(actualAccidentNote);

		// Delete a study note
		expectedAccidentNote = cloneDeep(visitDO.accidentNotes);
		await visitInformationPage.deleteNote();
		actualAccidentNote = await visitInformationPage.getAccidentNoteFormValues();
		console.log('actualAccidentNoteAfterAdd', actualAccidentNote);
		console.log('expectedAccidentNoteAfterAdd', expectedAccidentNote);
		expect({ ...expectedAccidentNote, ...actualAccidentNote }).toEqual(actualAccidentNote);
	});
});

const { test, expect } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { PatientInformationPage } from '../POM/patientInformation/patientInformationPage';
import { PatientLinkAndMergePage } from 'playwright/POM/patientInformation/PatientLinkAndMergePage';
import { TIMEOUT_IN_MSEC4, TIMEOUT_IN_MSEC5 } from 'playwright/POM/timeouts';

// Data for testing patient link and merge
let patient1ID;
let patient1Info;
let patient2ID;
let patient2Info;

// Data for testing patient merge
let patient3ID;
let patient3Info;
let patient4ID;
let patient4Info;

test.describe.serial('Link and Merge patients from PatientInfo page', () => {
	test.beforeAll(async () => {
		const postedData1 = await studyGenerator.postStudy();
		patient1ID = postedData1?.patientId;
		patient1Info = postedData1?.patientInfo;
		console.log('Posted patient1 - patient1ID: ', patient1ID);

		const postedData2 = await studyGenerator.postStudy();
		patient2ID = postedData2?.patientId;
		patient2Info = postedData2?.patientInfo;
		console.log('Posted patient2 - patient2ID: ', patient2ID);

		const postedData3 = await studyGenerator.postStudy();
		patient3ID = postedData3?.patientId;
		patient3Info = postedData3?.patientInfo;
		console.log('Posted patient3 - patient3ID: ', patient3ID);

		const postedData4 = await studyGenerator.postStudy();
		patient4ID = postedData4?.patientId;
		patient4Info = postedData4?.patientInfo;
		console.log('Posted patient4 - patient4ID: ', patient4ID);
	});

	test.beforeEach('Login OAI', async ({ page }) => {
		// Modify network request response to cross-format-person-name
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON

			// Modify JSON data
			if (bodyJson.features && bodyJson.features['cross-format-person-name']) {
				bodyJson.features['cross-format-person-name'].variationName = 'On';
				bodyJson.features['cross-format-person-name'].variationKey = 'variation-1';
			}

			if (bodyJson.variables && bodyJson.variables['cross-format-person-name']) {
				bodyJson.variables['cross-format-person-name'].value = true;
			}

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Link two patients from Patient page successfully', async ({ page }) => {
		const patientLinkAndMergePage = new PatientLinkAndMergePage(page);
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(patient1ID);
		// Field names on PatientInfo GUI and Patient Link GUI are different. So need to re-generate the expected patient DO
		const expectedCurrentPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient1Info);
		const expectedSelectedPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient2Info);
		console.log(`expectedCurrentPatientInfo-Patient1: `, expectedCurrentPatientInfo);
		console.log(`expectedSelectedPatientInfo-Patient2: `, expectedSelectedPatientInfo);

		await patientLinkAndMergePage.searchPatientAndOpenLinkPatientForm(
			`${patient2Info.generalInfo['Family Name']} ${patient2Info.generalInfo['Given Names']}`
		);

		const actualCurrentPatientInfo = await patientLinkAndMergePage.getCurrentPatientInfoFromPage();
		const actualSelectedPatientInfo = await patientLinkAndMergePage.getSelectedPatientInfoFromPage();
		console.log(`actualCurrentPatientInfo-Patient1: `, actualCurrentPatientInfo);
		console.log(`actualSelectedPatientInfo-Patient2: `, actualSelectedPatientInfo);

		// Verify that the patient details are displayed on Current Patient and Selected Patient cards correctly
		expect(actualCurrentPatientInfo).toEqual(expectedCurrentPatientInfo);
		expect(actualSelectedPatientInfo).toEqual(expectedSelectedPatientInfo);

		// Link two patients successfully
		patientLinkAndMergePage.submitBtn().click();

		// Verify toast message
		const toastMsg = `${patient1Info.generalInfo['Family Name']}, ${patient1Info.generalInfo['Given Names']}, 
		${patient1Info.generalInfo.Prefix}, ${patient1Info.generalInfo.Suffix} and 
		${patient2Info.generalInfo['Family Name']}, ${patient2Info.generalInfo['Given Names']}, 
		${patient2Info.generalInfo.Prefix}, ${patient2Info.generalInfo.Suffix} 
		have been linked`;
		await expect(page.getByText(toastMsg)).toBeVisible();

		// Verify the Linked Patient card on the left sidebar
		const gender =
			patient2Info?.generalInfo?.Gender?.charAt(0)?.toUpperCase() +
			patient2Info?.generalInfo?.Gender?.slice(1)?.toLowerCase();
		const birthDateParts = expectedSelectedPatientInfo['Birth Date']?.split('-');
		const birthDate = `${birthDateParts[1]}/${birthDateParts[2]}/${birthDateParts[0]}`;
		await expect(
			page.getByText(`${patient2Info.generalInfo['Family Name']} ${patient2Info.generalInfo['Given Names']} 
		${patient2Info.generalInfo.Prefix} ${patient2Info.generalInfo.Suffix} - ${patient2Info.generalInfo['Patient ID']}`)
		).toBeVisible();
		await expect(
			page.getByText(`${birthDate} - ${gender} - ${patient2Info.generalInfo['Assigning Authority']}`)
		).toBeVisible();
	});

	test('Navigate to the linked patient and unlink two patients from Patient page successfully', async ({ page }) => {
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(patient1ID);
		const patientLinkAndMergePage = new PatientLinkAndMergePage(page);
		expect(page.url()).toContain(`/patient/${patient1ID}`);

		const patient1NameOnCard = `${patient1Info.generalInfo['Family Name']} ${patient1Info.generalInfo['Given Names']} 
		${patient1Info.generalInfo.Prefix} ${patient1Info.generalInfo.Suffix} - ${patient1Info.generalInfo['Patient ID']}`;

		const patient2NameOnCard = `${patient2Info.generalInfo['Family Name']} ${patient2Info.generalInfo['Given Names']} 
		${patient2Info.generalInfo.Prefix} ${patient2Info.generalInfo.Suffix} - ${patient2Info.generalInfo['Patient ID']}`;

		// Verify navigation between the linked patients
		await patientLinkAndMergePage.linkPatientIcon().click();
		expect(page.url()).toContain(`/patient/${patient2ID}`);
		await expect(page.getByText(patient1NameOnCard)).toBeVisible();

		await patientLinkAndMergePage.linkPatientIcon().click();
		expect(page.url()).toContain(`/patient/${patient1ID}`);
		await expect(page.getByText(patient2NameOnCard)).toBeVisible();

		// Unlink patients
		await page.getByText(patient2NameOnCard).hover();
		await expect(patientLinkAndMergePage.unlinkIcon()).toBeVisible();
		await patientLinkAndMergePage.unlinkIcon().click();

		// Verify toast message
		const toastMsg = `${patient1Info.generalInfo['Family Name']}, ${patient1Info.generalInfo['Given Names']}, 
		${patient1Info.generalInfo.Prefix}, ${patient1Info.generalInfo.Suffix} and 
		${patient2Info.generalInfo['Family Name']}, ${patient2Info.generalInfo['Given Names']}, 
		${patient2Info.generalInfo.Prefix}, ${patient2Info.generalInfo.Suffix} 
		have been unlinked`;
		await expect(page.getByText(toastMsg)).toBeVisible();
		await expect(page.getByText(patient2NameOnCard)).not.toBeVisible();
	});

	test('Merge two patients from Patient page successfully - Current Patient is a primary patient', async ({
		page,
	}) => {
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(patient1ID);
		const patientLinkAndMergePage = new PatientLinkAndMergePage(page);

		// Navigate to the patient page
		expect(page.url()).toContain(`/patient/${patient1ID}`);

		// Open the Merge Patient form
		await patientLinkAndMergePage.searchPatientAndOpenMergePatientForm(
			`${patient2Info.generalInfo['Family Name']} ${patient2Info.generalInfo['Given Names']}`
		);

		// Verify patient details on the Merge Patient form
		const actualCurrentPatientInfo = await patientLinkAndMergePage.getCurrentPatientInfoFromPage();
		const actualSelectedPatientInfo = await patientLinkAndMergePage.getSelectedPatientInfoFromPage();
		const expectedCurrentPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient1Info);
		const expectedSelectedPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient2Info);

		expect(actualCurrentPatientInfo).toEqual(expectedCurrentPatientInfo);
		expect(actualSelectedPatientInfo).toEqual(expectedSelectedPatientInfo);

		// Submit button should be disabled at this point
		await expect(patientLinkAndMergePage.submitBtn()).toBeDisabled();

		// Select the current patient as a primary patient
		await patientLinkAndMergePage.currentPatientCheckbox().click();
		await expect(patientLinkAndMergePage.submitBtn()).toBeEnabled();
		await expect(
			page.getByText('Current Patient').locator('../..').locator('p').filter({ hasText: 'Selected as Primary' })
		).toBeVisible();

		// Select all conflict fields on the Selected Patient card. These fields will replace the coressponding fields on the Current Patient card.
		await patientLinkAndMergePage.selectConflictFieldsOnPatientCard(patientLinkAndMergePage.selectedPatientCard());

		// Merge the Selected Patient to the Current Patient
		await page.route('/fhir/patient/merge', route => route.continue());
		await Promise.all([
			patientLinkAndMergePage.submitBtn().click(),
			patientLinkAndMergePage.apiWaitUtils.waitForAPI('/fhir/patient/merge', 'POST', TIMEOUT_IN_MSEC4),
		]);

		// Verify toast message
		const toastMsg = `${patient1Info.generalInfo['Family Name']}, ${patient1Info.generalInfo['Given Names']},
		${patient1Info.generalInfo.Prefix}, ${patient1Info.generalInfo.Suffix} and
		${patient2Info.generalInfo['Family Name']}, ${patient2Info.generalInfo['Given Names']},
		${patient2Info.generalInfo.Prefix}, ${patient2Info.generalInfo.Suffix}
		have been merged`;
		await expect(page.getByText(toastMsg)).toBeVisible();

		// Verify that the Current Patient which was selected as a primary patient is still being opened
		expect(page.url()).toContain(`/patient/${patient1ID}`);

		// Verify that the Current Patient info is dislayed correctly with the data after merging
		const expectedMergedPatientInfo = patientLinkAndMergePage.generateExpectedMergePatientInfo(
			patient1Info,
			expectedSelectedPatientInfo,
			patient2Info
		);
		const actualMergedPatientInfo = await patientPage.getPatientInformationDetailsFromPage();

		console.log('patient1Info.generalInfo: ', patient1Info.generalInfo);
		console.log('patient2Info.generalInfo: ', patient2Info.generalInfo);

		console.log('expectedMergedPatientInfo.generalInfo: ', expectedMergedPatientInfo.generalInfo);
		console.log('expectedMergedPatientInfo.contactInfo: ', expectedMergedPatientInfo.contactInfo);
		console.log('expectedMergedPatientInfo.address: ', expectedMergedPatientInfo.address);
		console.log('actualMergedPatientInfo.generalInfo: ', actualMergedPatientInfo.generalInfo);
		console.log('actualMergedPatientInfo.contactInfo: ', actualMergedPatientInfo.contactInfo);
		console.log('actualMergedPatientInfo.address: ', actualMergedPatientInfo.address);

		expect(actualMergedPatientInfo.generalInfo).toEqual(expectedMergedPatientInfo.generalInfo);
		expect(actualMergedPatientInfo.contactInfo).toEqual(expectedMergedPatientInfo.contactInfo);
		expect(actualMergedPatientInfo.address).toEqual(expectedMergedPatientInfo.address);
	});

	test('Merge two patients from Patient page successfully - Selected Patient is the primary patient', async ({
		page,
	}) => {
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(patient3ID);
		const patientLinkAndMergePage = new PatientLinkAndMergePage(page);

		// Navigate to the patient page
		expect(page.url()).toContain(`/patient/${patient3ID}`);

		// Open the Merge Patient form
		await patientLinkAndMergePage.searchPatientAndOpenMergePatientForm(
			`${patient4Info.generalInfo['Family Name']} ${patient4Info.generalInfo['Given Names']}`
		);

		// Verify patient details on the Merge Patient form
		const actualCurrentPatientInfo = await patientLinkAndMergePage.getCurrentPatientInfoFromPage();
		const actualSelectedPatientInfo = await patientLinkAndMergePage.getSelectedPatientInfoFromPage();
		const expectedCurrentPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient3Info);
		const expectedSelectedPatientInfo =
			patientLinkAndMergePage.generateExpectedPatientInfoForPatientCard(patient4Info);

		expect(actualCurrentPatientInfo).toEqual(expectedCurrentPatientInfo);
		expect(actualSelectedPatientInfo).toEqual(expectedSelectedPatientInfo);

		// Select the current patient as a primary patient
		await patientLinkAndMergePage.selectedPatientCheckbox().click();
		await expect(patientLinkAndMergePage.submitBtn()).toBeEnabled();
		await expect(
			page.getByText('Selected Patient').locator('../..').locator('p').filter({ hasText: 'Selected as Primary' })
		).toBeVisible();

		// Select all conflict fields on the Selected Patient card. These fields will replace the coressponding fields on the Current Patient card.
		await patientLinkAndMergePage.selectConflictFieldsOnPatientCard(patientLinkAndMergePage.currentPatientCard());

		// Merge the Current Patient to the Selected Patient
		await page.route('/fhir/patient/merge', route => route.continue());
		await page.route('**/fhir/Patient/*', route => route.continue());
		await Promise.all([
			patientLinkAndMergePage.submitBtn().click(),
			patientLinkAndMergePage.apiWaitUtils.waitForAPI('/fhir/patient/merge', 'POST', TIMEOUT_IN_MSEC4),
			// This API is called after the patient merege API completes. So the waiting time for this API should be longer than the one for the patient merge API
			patientLinkAndMergePage.apiWaitUtils.waitForAPI('/fhir/Patient', 'GET', TIMEOUT_IN_MSEC5),
		]);

		// Verify toast message
		const toastMsg = `${patient3Info.generalInfo['Family Name']}, ${patient3Info.generalInfo['Given Names']},
		${patient3Info.generalInfo.Prefix}, ${patient3Info.generalInfo.Suffix} and
		${patient4Info.generalInfo['Family Name']}, ${patient4Info.generalInfo['Given Names']},
		${patient4Info.generalInfo.Prefix}, ${patient4Info.generalInfo.Suffix}
		have been merged`;
		await expect(page.getByText(toastMsg)).toBeVisible();

		// Verify that the Selected Patient which was selected as a primary patient is now being opened
		expect(page.url()).toContain(`/patient/${patient4ID}`);

		// Verify that the Selected Patient info is dislayed correctly with the data after merging
		const expectedMergedPatientInfo = patientLinkAndMergePage.generateExpectedMergePatientInfo(
			patient4Info,
			expectedCurrentPatientInfo,
			patient3Info
		);
		const actualMergedPatientInfo = await patientPage.getPatientInformationDetailsFromPage();

		console.log('expectedMergedPatientInfo.generalInfo: ', expectedMergedPatientInfo.generalInfo);
		console.log('expectedMergedPatientInfo.contactInfo: ', expectedMergedPatientInfo.contactInfo);
		console.log('expectedMergedPatientInfo.address: ', expectedMergedPatientInfo.address);
		console.log('actualMergedPatientInfo.generalInfo: ', actualMergedPatientInfo.generalInfo);
		console.log('actualMergedPatientInfo.contactInfo: ', actualMergedPatientInfo.contactInfo);
		console.log('actualMergedPatientInfo.address: ', actualMergedPatientInfo.address);

		expect(actualMergedPatientInfo.generalInfo).toEqual(expectedMergedPatientInfo.generalInfo);
		expect(actualMergedPatientInfo.contactInfo).toEqual(expectedMergedPatientInfo.contactInfo);
		expect(actualMergedPatientInfo.address).toEqual(expectedMergedPatientInfo.address);
	});
});

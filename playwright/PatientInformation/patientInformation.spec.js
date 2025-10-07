import { patientDO } from '../dataObjects/patientDO';
import { PatientInformationPage } from '../POM/patientInformation/patientInformationPage';
import { PatientRegistration } from '../POM/patientInformation/patientRegistrationForm';
import { CoverageInformationPage } from 'playwright/POM/patientInformation/coverageInformationPage';
import { DetailedTablePopper } from 'playwright/POM/patientInformation/detailedTablePopper';
import { studyGenerator } from 'playwright/generators/studyGenerator';

const { POManager } = require('../POM/POManager');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { test, request, expect } = require('@playwright/test');
const faker = require('community-faker');
import { generateTestEmail } from 'cypress/support/testUtils';

let postedData;
let utilFuncs;

const generateExpectedPatientDOFromPatientInfo = patientInfo => {
	if (!patientInfo) return;
	return {
		generalInfo: {
			...patientInfo.generalInfo,
			'Deceased Date': patientInfo.generalInfo['Deceased Date'] || 'N/A',
			SSN: `${patientInfo.generalInfo.SSN}`,
		},
		contactInfo: {
			Email: patientInfo.contactInfo.Email.toLowerCase(),
			Phone: patientInfo.contactInfo.Phone,
		},
		address: {
			'Address Line': patientInfo.address['Address Line'].toUpperCase(),
			City: patientInfo.address.City.toUpperCase(),
			'State/Province': patientInfo.address['State/Province'].toUpperCase(),
			'ZIP/Postal Code': patientInfo.address['ZIP/Postal Code'].toUpperCase(),
			Country: patientInfo.address.Country.toUpperCase(),
		},
		emergencyContacts: {
			Name: patientInfo.emergencyContacts.Name,
			Phone: patientInfo.emergencyContacts.Phone,
			Email: patientInfo.emergencyContacts.Email,
		},
		guarantor: {
			Name: '',
			'Relation to Patient': '',
			'Email Address': '',
			'Phone Number': '',
			Address: '',
		},
	};
};

function extractGuarantorInfo(account) {
	const guarantorParty = account?.guarantor?.[0]?.party;
	const guarantorRelationship = guarantorParty?.extension?.find(ext => ext.url.includes('guarantorRelationship'))
		?.valueCoding?.display;

	const rawDisplayName = guarantorParty?.display || '';

	//The following impletation will change after Name display is consistent throughout
	// Split by ^ and keep only first two parts (e.g., given name and family name)
	const nameParts = rawDisplayName.split('^').filter(Boolean);
	const nameWithoutPrefixSuffix = nameParts.slice(0, 2).join(' ').trim();

	return {
		guarantorName: nameWithoutPrefixSuffix, // e.g., "AAA BBB"
		guarantorRelationship, // e.g., "PARENT"
	};
}

test.describe.serial('PatientInformation Tests', () => {
	let expectedPatientDO = {
		generalInfo: { ...patientDO.generalInfo },
		contactInfo: { ...patientDO.contactInfo },
		emergencyContacts: { ...patientDO.emergencyContacts },
		address: { ...patientDO.address },
		guarantor: { ...patientDO.guarantor },
	};

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
		postedData = await studyGenerator.postStudy();
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
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(postedData?.patientId);
	});

	test('View patient details for all sections', async ({ page }) => {
		expectedPatientDO = generateExpectedPatientDOFromPatientInfo(postedData?.patientInfo);
		const patientInformationPage = new PatientInformationPage(page);

		const actualPatientDetailsDO = await patientInformationPage.getPatientInformationDetailsFromPage(1);

		console.log('expected', expectedPatientDO);
		console.log('actual', actualPatientDetailsDO);
		// Verify patient details
		expect(actualPatientDetailsDO).toEqual(expectedPatientDO);
	});

	test('update patient details for general section', async ({ page }) => {
		const patientInformationPage = new PatientInformationPage(page);
		const patientRegistration = new PatientRegistration(page);

		const updatedFamilyName = faker.name.findName().toUpperCase();
		const updatedSsn = utilFuncs.generateRandomNumber(100000000, 999999999);
		const updatedPatientId = utilFuncs.generateRandomNumber(10000000, 99999999);

		const poManager = new POManager(page);

		await patientInformationPage.familyNameTxt().hover();
		await patientInformationPage.familyNameInput().fill(updatedFamilyName);

		await patientInformationPage.ssnTxt().hover();
		await patientInformationPage.ssnInput().waitFor({ state: 'visible' });
		await patientInformationPage.ssnInput().fill(`${updatedSsn}`);

		await patientInformationPage.patientIdTxt().hover();
		await patientInformationPage.patientIdInput().waitFor({ state: 'visible' });
		await patientInformationPage.patientIdInput().fill(`${updatedPatientId}`);

		await patientInformationPage.birthDateTxt().hover();
		await patientRegistration.pickBirthDate();

		// Intercept the PUT request and wait for the API response
		await page.route('**/fhir/patient/*', route => route.continue());
		await patientInformationPage.saveButton().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PUT');

		//get the values from the updated UI
		await patientInformationPage.familyNameTxt().waitFor({ state: 'visible' });
		const actualFamilyName = await patientInformationPage.familyNameTxt().textContent();
		const actualSsn = await patientInformationPage.ssnTxt().textContent();
		const actualPatientId = await patientInformationPage.patientIdTxt().textContent();
		await patientInformationPage.maritalStatusTxt().hover();
		const actualBirthDate = await patientInformationPage.birthDateTxt().textContent();

		//assert changed values
		expect(actualFamilyName).toEqual(updatedFamilyName);
		expect(`${actualSsn.replace(/-/g, '')}`).toEqual(`${updatedSsn}`);
		expect(actualPatientId).toEqual(`${updatedPatientId}`);
		expect(actualBirthDate).toContain('01/2000');
	});

	test('create, update and delete new Emergency contact', async ({ page }) => {
		const patientInformationPage = new PatientInformationPage(page);

		const ecFamilyName = faker.name.findName().toUpperCase();
		const ecGivenNames = faker.name.findName().toUpperCase();
		const ecPhoneNumber = faker.phone.phoneNumber('1226868####');
		const ecEmail = generateTestEmail();

		const updatedEcFamilyName = faker.name.findName().toUpperCase();
		const updatedEcGivenNames = faker.name.findName().toUpperCase();
		const updatedEcPhoneNumber = faker.phone.phoneNumber('1226878####');
		const updatedEcEmail = generateTestEmail();

		const poManager = new POManager(page);

		await patientInformationPage.emergencyContactHeading().waitFor({ state: 'visible' });
		await patientInformationPage.emergencyContactHeading().click();

		//Add new EC
		await patientInformationPage.addNewEmergencyContactButton().click();
		await expect(patientInformationPage.addEmergencyContactFormHeader()).toBeVisible();

		await patientInformationPage.emergencyContactFormFamilyName().fill(ecFamilyName);
		await patientInformationPage.emergencyContactFormGivenNames().fill(ecGivenNames);
		await patientInformationPage.emergencyContactFormPhone().fill(ecPhoneNumber);
		await patientInformationPage.emergencyContactFormEmail().fill(ecEmail);

		// Intercept the PUT request and wait for the API response
		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.emergencyContactFormSaveBtn()).toBeVisible();

		await patientInformationPage.emergencyContactFormSaveBtn().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PATCH');

		//get the values from the updated UI
		const actualEmergencyContactName = await patientInformationPage.emergencyContactNameTxt().last().innerText();
		const actualEmergencyContactEmail = await patientInformationPage.emergencyContactEmailTxt().last().innerText();
		const actualEmergencyContactPhone = await patientInformationPage.emergencyContactPhoneTxt().last().innerText();

		//assert changed values
		expect(actualEmergencyContactName).toEqual(`${ecFamilyName} ${ecGivenNames}`);
		expect(actualEmergencyContactEmail).toEqual(`${ecEmail}`);
		expect(actualEmergencyContactPhone.replace(/[+\s]/g, '').trim()).toEqual(`${ecPhoneNumber}`);

		//Update the EC
		await patientInformationPage.emergencyContactLastCard().waitFor({ state: 'visible' });
		await patientInformationPage.emergencyContactLastCard().hover();
		await patientInformationPage.emergencyContactEditbutton().click();

		await expect(patientInformationPage.editEmergencyContactFormHeader()).toBeVisible();
		await patientInformationPage.emergencyContactFormFamilyName().fill(updatedEcFamilyName);
		await patientInformationPage.emergencyContactFormGivenNames().fill(updatedEcGivenNames);
		const phoneField = await patientInformationPage.emergencyContactFormPhone();
		await phoneField.fill('');
		await phoneField.fill(updatedEcPhoneNumber);
		await patientInformationPage.emergencyContactFormEmail().fill(updatedEcEmail);

		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.emergencyContactFormUpdateBtn()).toBeVisible();

		await patientInformationPage.emergencyContactFormUpdateBtn().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PATCH');

		//get the values from the updated UI
		const updatedEmergencyContactName = await patientInformationPage.emergencyContactNameTxt().last().innerText();
		const updatedEmergencyContactEmail = await patientInformationPage.emergencyContactEmailTxt().last().innerText();
		const updatedEmergencyContactPhone = await patientInformationPage.emergencyContactPhoneTxt().last().innerText();

		//assert changed values
		expect(updatedEmergencyContactName).toEqual(`${updatedEcFamilyName} ${updatedEcGivenNames}`);
		expect(updatedEmergencyContactEmail).toEqual(`${updatedEcEmail}`);

		expect(updatedEmergencyContactPhone.replace(/[+\s]/g, '').trim()).toEqual(`${updatedEcPhoneNumber}`);

		//delete the created EC
		await page.route('**/fhir/patient/*', route => route.continue());
		await patientInformationPage.emergencyContactLastCard().waitFor({ state: 'visible' });
		await patientInformationPage.emergencyContactLastCard().hover();
		await patientInformationPage.emergencyContactDeletebutton().click({ delay: 1000 });
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PATCH');

		const finalEmergencyContactName = await patientInformationPage.emergencyContactNameTxt().last().innerText();
		expect(finalEmergencyContactName).not.toEqual(`${updatedEcFamilyName} ${updatedEcGivenNames}`);
	});

	test('update email, phone and address field of the contact info section', async ({ page }) => {
		const patientInformationPage = new PatientInformationPage(page);

		const contactPhoneNumber = faker.phone.phoneNumber('1229868####');
		const contactEmail = generateTestEmail();

		const poManager = new POManager(page);

		await patientInformationPage.contactInfoHeading().waitFor({ state: 'visible' });
		await patientInformationPage.contactInfoHeading().click();

		const emailField = await patientInformationPage.emailFields().first();
		await emailField.hover();
		await expect(patientInformationPage.emailFieldInput()).toBeVisible({ timeout: 5000 });
		await patientInformationPage.emailFieldInput().fill(contactEmail);

		await page.mouse.move(0, 0);

		const phoneField = await patientInformationPage.phoneField();
		await phoneField.hover();
		await expect.poll(() => phoneField.isEnabled(), { timeout: 10000 }).toBeTruthy();
		await phoneField.fill('');
		await phoneField.fill(contactPhoneNumber);

		await patientInformationPage.addressLineTxt().waitFor({ state: 'visible' });
		await patientInformationPage.addressLineTxt().hover();

		await Promise.all([
			page.waitForResponse(
				response =>
					response
						.url()
						.includes('maps.googleapis.com/maps/api/place/js/AutocompletionService.GetPredictionsJson') &&
					response.status() === 200
			),
			patientInformationPage.addressLineInput().fill('90 Adelaide'),
		]);

		await patientInformationPage.firstSuggestedAddress().waitFor({ state: 'visible' });
		await patientInformationPage.firstSuggestedAddress().click();

		const placeDetailsResponse = await page.waitForResponse(
			response => response.url().includes('PlaceService.GetPlaceDetails') && response.status() === 200
		);

		const responseBodyText = await placeDetailsResponse.text();

		const jsonStart = responseBodyText.indexOf('{');
		const jsonEnd = responseBodyText.lastIndexOf('}');
		const jsonString = responseBodyText.slice(jsonStart, jsonEnd + 1);

		const addressComponents = JSON.parse(jsonString).result.address_components;
		const getComponent = (type, useLongName = false) => {
			const component = addressComponents.find(component => component.types.includes(type));
			return component ? (useLongName ? component.long_name : component.short_name) : '';
		};

		// Extract the individual values
		const streetNumber = getComponent('street_number');
		const route = getComponent('route');
		const addressLine = `${streetNumber} ${route}`;
		const city = getComponent('locality');
		const state = getComponent('administrative_area_level_1');
		const postalCode = getComponent('postal_code');
		const country = getComponent('country', true);

		await page.waitForTimeout(1000);
		// Intercept the PUT request and wait for the API response
		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.saveButton()).toBeVisible();

		await patientInformationPage.saveButton().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PATCH');

		//get the values from the updated UI
		await patientInformationPage.addressSectionLabel().hover();
		await patientInformationPage.addressSectionLabel().click();
		const actualContactEmail = await patientInformationPage.emailFields().first().textContent();
		const actualContactPhone = await patientInformationPage.phoneField().getAttribute('value');
		const actualAddressLine = await patientInformationPage.addressLineInput().getAttribute('value');
		const actualCity = await patientInformationPage.cityTxt().textContent();
		const actualStateProvince = await patientInformationPage.stateProvinceTxt().textContent();
		const actualZipCode = await patientInformationPage.zipPostalCodeTxt().textContent();
		const actualCountry = await patientInformationPage.countryTxt().textContent();

		//assert changed values
		expect(actualContactEmail.toLowerCase()).toEqual(`${contactEmail.toLowerCase()}`);
		expect(actualContactPhone.replace(/[+\s]/g, '').trim()).toEqual(`${contactPhoneNumber}`);
		expect(actualAddressLine).toEqual(addressLine.toUpperCase());
		expect(actualCity).toEqual(city.toUpperCase());
		expect(actualStateProvince).toEqual(state.toUpperCase());
		expect(actualZipCode).toEqual(postalCode.toUpperCase());
		expect(actualCountry).toEqual(country.toUpperCase());
	});

	test('create, update and delete new patient notes', async ({ page }) => {
		const patientInformationPage = new PatientInformationPage(page);

		const notesText = faker.lorem.sentence();
		const updatedNotesText = faker.lorem.sentence();

		const poManager = new POManager(page);

		await patientInformationPage.patientNotesHeading().waitFor({ state: 'visible' });
		await patientInformationPage.patientNotesHeading().click();

		//Add new Notes
		await patientInformationPage.addNoteButton().click();

		await patientInformationPage.notesTextArea().waitFor({ state: 'visible' });
		await patientInformationPage.notesTextArea().fill(notesText);

		// Intercept the PUT request and wait for the API response
		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.saveNotesButton()).toBeVisible();

		await patientInformationPage.saveNotesButton().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PUT');

		//get the values from the updated UI
		const actualNotesText = await patientInformationPage.notesTextArea().textContent();

		//assert changed values
		expect(actualNotesText).toEqual(`${notesText}`);

		//Update the Notes
		await patientInformationPage.newNotesCard().waitFor({ state: 'visible' });
		await patientInformationPage.newNotesCard().hover();
		await patientInformationPage.editFirstNotesButton().waitFor({ state: 'visible' });
		await patientInformationPage.editFirstNotesButton().click();

		await patientInformationPage.notesTextArea().waitFor({ state: 'visible' });
		await patientInformationPage.notesTextArea().fill(updatedNotesText);

		// Intercept the PUT request and wait for the API response
		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.saveNotesButton()).toBeVisible();

		await patientInformationPage.saveNotesButton().click();
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PUT');

		//get the values from the updated UI
		const updatedActualNotesText = await patientInformationPage.notesTextArea().textContent();

		//assert changed values
		expect(updatedActualNotesText).toEqual(`${updatedNotesText}`);

		//delete the Notes
		await page.route('**/fhir/patient/*', route => route.continue());
		await patientInformationPage.newNotesCard().waitFor({ state: 'visible' });
		await patientInformationPage.newNotesCard().hover();
		await patientInformationPage.deleteFirstNotesButton().click({ delay: 1000 });
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'PUT');

		const finalNotesText = await patientInformationPage.notesTextArea().textContent();
		expect(finalNotesText).not.toEqual(`${updatedNotesText}`);
	});

	test('update guarantor by selecting new patient', async ({ page }) => {
		const patientInformationPage = new PatientInformationPage(page);
		const coverageInformationPage = new CoverageInformationPage(page);
		const detailedTablePopper = new DetailedTablePopper(page);
		const patientRegistration = new PatientRegistration(page, coverageInformationPage);
		const poManager = new POManager(page);

		await patientInformationPage.guarantorHeading().waitFor({ state: 'visible' });
		await patientInformationPage.guarantorHeading().click();

		await patientInformationPage.guarantorAddressTxt().hover();
		await patientInformationPage.guarantorEditButton().click();

		await expect(patientInformationPage.editGuarantorFormHeader()).toBeVisible();
		await patientInformationPage.rleationshipDropdown().click();

		const parentOption = await patientInformationPage.getSecondDropdownItem();
		await parentOption.waitFor({ state: 'visible' });
		await parentOption.click();

		const selectedRelationshipText = await patientInformationPage.rleationshipDropdown().textContent();
		expect(selectedRelationshipText?.trim()).toBe('PARENT');

		expect(patientInformationPage.guarantorNameField()).toBeEnabled();
		await patientInformationPage.guarantorNameField().click();

		await detailedTablePopper.clickAddNewUsingLabel();

		await expect(patientInformationPage.createNewGuarantorFormHeader()).toBeVisible();

		const patientData = await patientRegistration.savePatientForm(true);

		await page.route(`**/patient**`, route => route.continue());

		expect(patientInformationPage.guarantorNameField()).toBeEnabled();

		const updatedPatientName = await patientInformationPage.guarantorNameField().getAttribute('value');

		const expectedName =
			`${patientData.familyName}, ${patientData.givenName}, ${patientData.prefix}, ${patientData.suffix}`.trim();

		const normalizedUpdatedName = await updatedPatientName?.trim().replace(/\s+/g, ' ');
		const normalizedExpectedName = expectedName.trim().replace(/\s+/g, ' ');

		expect(normalizedUpdatedName).toBe(normalizedExpectedName);

		await page.route('**/fhir/patient/*', route => route.continue());
		await expect(patientInformationPage.guarantorFormUpdateBtn()).toBeVisible();

		await patientInformationPage.guarantorFormUpdateBtn().click();

		const accountResponse = await poManager.apiWaitUtils.waitForAPI('/fhir/Account', 'POST');

		const actualGuarantorName = await patientInformationPage.guarantorNameTxt().textContent();
		const actualGuarantorRelationship = await patientInformationPage.guarantorRelationshipTxt().textContent();

		const guarantorInfo = extractGuarantorInfo(accountResponse);
		const actualGuarantorData = {
			guarantorName: actualGuarantorName,
			guarantorRelationship: actualGuarantorRelationship,
		};

		expect(guarantorInfo).toEqual(actualGuarantorData);
	});
});

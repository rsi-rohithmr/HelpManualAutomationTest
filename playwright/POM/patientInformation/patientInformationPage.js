import { patientDO } from '../../dataObjects/patientDO';
const playwrightConfig = require('../../../playwright.config');
const { ApiWaitUtils } = require('../apiWaitUtils');
const { Common } = require('../common');
const { HomePage } = require('../homePage/homePage');
const { ClickWheel } = require('../clickWheel');
const { GlobalSearch } = require('../globalSearch');
const { PatientRegistration } = require('./patientRegistrationForm');

export function convertToISO(dateStr) {
	const [month, day, year] = dateStr.split('/');
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export class PatientInformationPage {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
		this.common = new Common(this.page);
		this.globalSearch = new GlobalSearch(this.page);
		this.clickWheel = new ClickWheel(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.patientRegistration = new PatientRegistration(this.page);
	}

	//sectionHeadings
	generalInfoHeading() {
		return this.page.getByRole('heading', { name: 'General' });
	}

	guarantorHeading() {
		return this.page.getByRole('heading', { name: 'Guarantor' });
	}

	contactInfoHeading() {
		return this.page
			.getByTestId('visit-section-Contact Information')
			.locator('div')
			.filter({ hasText: 'Contact Information' });
	}

	emergencyContactHeading() {
		return this.page
			.getByTestId('visit-section-Emergency Contacts')
			.locator('[data-testid="expand-visit-section-button"]');
	}

	patientNotesHeading() {
		return this.page
			.getByTestId('visit-section-Patient Notes')
			.locator('[data-testid="expand-visit-section-button"]');
	}

	// General Section
	familyNameTxt() {
		return this.page.locator('[data-testid="form-field-familyName"] span');
	}

	familyNameInput() {
		return this.page.locator('#form-field-Family\\ \\(Last\\)\\ Name');
	}

	givenNamesTxt() {
		return this.page.locator('[data-testid="form-field-givenNames"] span');
	}

	prefixTxt() {
		return this.page.locator('[data-testid="form-field-prefix"] span');
	}

	suffixTxt() {
		return this.page.locator('[data-testid="form-field-suffix"] span');
	}

	ssnTxt() {
		return this.page.locator('[data-testid="form-field-ssn"] span');
	}

	ssnInput() {
		return this.page.locator('#form-field-SSN');
	}

	patientIdTxt() {
		return this.page.locator('[data-testid="form-field-patientId"] span');
	}

	patientIdInput() {
		return this.page.getByLabel('Patient ID');
	}

	driversLicenseTxt() {
		return this.page.locator('[data-testid="form-field-driversLicense"] span');
	}

	birthDateTxt() {
		return this.page.locator('[data-testid="form-field-birthDate"] span');
	}

	birthDateInput() {
		return this.page.locator('input[name="birthDate"]');
	}

	genderTxt() {
		return this.page.locator('[data-testid="form-field-gender"] span');
	}

	birthSexTxt() {
		return this.page.locator('[data-testid="form-field-birthSex"] span');
	}

	managingOrganizationTxt() {
		return this.page.locator('[data-testid="form-field-managingOrganization"] span');
	}

	assigningAuthorityTxt() {
		return this.page.locator('[data-testid="form-field-assigningAuthority"] span');
	}

	mothersGivenNameTxt() {
		return this.page.locator('[data-testid="form-field-mothersGivenName"] span');
	}

	mothersFamilyNameTxt() {
		return this.page.locator('[data-testid="form-field-mothersMaidenName"] span');
	}

	fathersGivenNameTxt() {
		return this.page.locator('[data-testid="form-field-fathersGivenNames"] span');
	}

	fathersFamilyNameTxt() {
		return this.page.locator('[data-testid="form-field-fathersFamilyName"] span');
	}

	maritalStatusTxt() {
		return this.page.locator('[data-testid="form-field-maritalStatus"] span');
	}

	confidentialityTxt() {
		return this.page.locator('[data-testid="form-field-confidentiality"] span');
	}

	deceasedDateTxt() {
		return this.page.locator('[data-testid="form-field-deceasedDateTime"] span');
	}

	raceTxt() {
		return this.page.locator('[data-testid="form-field-race"] span');
	}

	ethnicityTxt() {
		return this.page.locator('[data-testid="form-field-ethnicity"] span');
	}

	languageTxt() {
		return this.page.locator('[data-testid="form-field-language"] span');
	}

	givenNamesField() {
		return this.page.locator('[data-testid="form-field-givenNames"] span');
	}

	// Contact & Address Information Section
	// Telecom on View page
	emailLbl() {
		return this.page.locator('[data-cy="form-section"]').eq(0).find('div').contains('Email');
	}

	emailTxt() {
		return this.page.locator('[id="form-field-Email-0"]');
	}

	phoneLbl() {
		return this.page.locator('[data-cy="form-section"]').eq(0).find('div').contains('Phone');
	}

	phoneTxt() {
		return this.page.locator('[id="form-field-Phone-1"]');
	}

	emailFieldParentDiv() {
		return this.page.locator('div.MuiInput-root').first();
	}

	emailFields() {
		return this.page.locator('[data-testid^="form-field-telecom-email"]');
	  }

	emailFieldTxt(index) {
		return this.page.getByTestId(`form-field-telecom-email-${index}`);
	}

	emailFieldInput() {
		return this.page.locator('#form-field-Email');
	}

	phoneFieldParentDiv() {
		return this.page.locator('div:nth-child(2) > .MuiBox-root > .MuiFormControl-root > .MuiInput-root');
	}

	phoneField() {
		return this.page.locator('#form-field-Phone');
	}

	phoneIcon() {
		return this.page.getByTestId('PhoneIcon');
	}

	// Emergency contacts
	emergencyNameTxt() {
		return this.page.locator('[data-cy="patient-emergency-contact-name"]').find('div').find('input');
	}

	emergencyEmailTxt() {
		return this.page.locator('[data-cy="patient-emergency-contact-email"]').find('div').find('input');
	}

	emergencyPhoneTxt() {
		return this.page.locator('[data-cy="patient-emergency-contact-phone"]').find('div').find('input');
	}

	emergencyRelationshipTxt() {
		return this.page.locator('[data-cy="patient-emergency-contact-relationship-select"]').find('div');
	}

	emergencyContactNameTxt() {
		return this.page.locator('[data-testid="emergency-contact-name"]');
	}

	emergencyContactEmailTxt() {
		return this.page.locator('[data-testid="emergency-contact-email"]');
	}

	emergencyContactPhoneTxt() {
		return this.page.locator('[data-testid="emergency-contact-phone"]');
	}

	addNewEmergencyContactButton() {
		return this.page.locator('[data-testid="share-button"]');
	}

	addEmergencyContactFormHeader() {
		return this.page.locator('[data-testid="form-header-section"]', {
			hasText: 'Add Emergency Contact',
		});
	}

	editEmergencyContactFormHeader() {
		return this.page.locator('[data-testid="form-header-section"]', {
			hasText: 'Edit Emergency Contact',
		});
	}

	emergencyContactFormFamilyName() {
		return this.page.getByRole('textbox', { name: 'Family (Last) Name' });
	}

	emergencyContactFormGivenNames() {
		return this.page.getByRole('textbox', { name: 'Given (First & Middle) Names' });
	}

	emergencyContactFormPhone() {
		return this.page.getByRole('textbox', { name: 'Phone Number' });
	}

	emergencyContactFormEmail() {
		return this.page.getByRole('textbox', { name: 'Email Address' });
	}

	emergencyContactFormSaveBtn() {
		return this.page.locator('[data-testid="SAVE_"]');
	}

	emergencyContactFormUpdateBtn() {
		return this.page.locator('[data-testid="UPDATE_"]');
	}

	emergencyContactLastCard() {
		return this.page.getByTestId('emergency-contacts-card').last();
	}

	emergencyContactEditbutton() {
		return this.page.getByRole('button', { name: 'Edit' });
	}

	emergencyContactDeletebutton() {
		return this.page.getByRole('button', { name: 'Hold to Delete' });
	}

	//Address Section
	countryLbl() {
		return this.page.locator('[id="form-field-Country-label"]');
	}

	stateProvinceLbl() {
		return this.page.locator('[id="form-field-State/Province-label"]');
	}

	zipPostalCodeLbl() {
		return this.page.locator('[id="form-field-ZIP/Postal Code-label"]');
	}

	cityLbl() {
		return this.page.locator('[id="form-field-City-label"]');
	}

	addressLine1Lbl() {
		return this.page.locator('[id="form-field-Address Line 1-label"]');
	}

	addressLine1Txt() {
		return this.page.locator('[id="form-field-Address Line 1"]');
	}

	addressLineTxt() {
		return this.page.locator('[data-testid="form-field-address.0.line.0"] span');
	}

	cityTxt() {
		return this.page.locator('[data-testid="form-field-address.0.city"] span');
	}

	stateProvinceTxt() {
		return this.page.locator('[data-testid="form-field-address.0.state"] span');
	}

	zipPostalCodeTxt() {
		return this.page.locator('[data-testid="form-field-address.0.postalCode"] span');
	}

	countryTxt() {
		return this.page.locator('[data-testid="form-field-address.0.country"] span');
	}

	addressLineInput() {
		return this.page.locator('#autocomplete-field-Address\\ Line');
	}

	firstSuggestedAddress() {
		return this.page.locator('#autocomplete-field-Address\\ Line-option-0');
	}

	addressSectionLabel() {
		return this.page.getByText('ADDRESS', { exact: true });
	}

	//guarantor section
	guarantorNameTxt() {
		return this.page.locator('[data-testid="guarantor-name-value"]');
	}

	guarantorRelationshipTxt() {
		return this.page.locator('[data-testid="guarantor-relationship-value"]');
	}

	guarantorEmailTxt() {
		return this.page.locator('[data-testid="guarantor-email-value"]');
	}

	guarantorPhoneTxt() {
		return this.page.locator('[data-testid="guarantor-phone-value"]');
	}

	guarantorAddressTxt() {
		return this.page.locator('[data-testid="guarantor-address-value"]');
	}

	guarantorEditButton() {
		return this.page.getByTestId('information-card').getByTestId('edit-icon-button');
	}

	editGuarantorFormHeader() {
		return this.page.locator('[data-testid="form-header-section"]', {
			hasText: 'Edit Guarantor',
		});
	}

	rleationshipDropdown() {
		return this.page.locator('#form-field-Relationship\\ to\\ Patient');
	}

	guarantorNameField() {
		return this.page.locator('#autocomplete-field-Guarantor\\ Name');
	}

	getDropdownList() {
		return this.page.locator('ul[role="listbox"]');
	}

	getDropdownItems() {
		return this.getDropdownList().locator('li[role="option"]');
	}

	getSecondDropdownItem() {
		return this.getDropdownItems().nth(1); // index is 0-based
	}

	detailedTablePopperContainer() {
		return this.page.getByTestId('table-popper-container');
	}

	addNewPatientButton() {
		return this.page.getByTestId('table-popper-container').getByLabel('Add new');
	}

	createNewGuarantorFormHeader() {
		return this.page.locator('[data-testid="form-header-section"]', {
			hasText: 'Create New Guarantor',
		});
	}

	guarantorFormUpdateBtn() {
		return this.page.locator('[data-testid="UPDATE_"]');
	}

	//saveButton for sections
	saveButton() {
		return this.page.locator('[data-testid="save-button"]');
	}

	//notes section
	emptyNotesCard() {
		return this.page.locator('[data-testid="empty_note"]');
	}

	addfirstNotesButton() {
		return this.page.locator('[data-testid="add-note-btn"]');
	}

	addNoteButton() {
		return this.page.getByLabel('Add a Note').locator('div');
	}

	notesTextArea() {
		return this.page.getByRole('textbox', { name: 'Add a Note' }).first();
	}

	notesLastCard() {
		return this.page.locator('[data-testid="NotesCard"]').last();
	}

	newNotesCard() {
		return this.page.locator('[data-testid="NotesCard"]').first();
	}

	saveNotesButton() {
		return this.page.locator('[data-testid="save-icon-button"]');
	}

	cancelNotesButton() {
		return this.page.locator('[data-testid="cancel-icon-button"]');
	}

	editFirstNotesButton() {
		return this.page.locator('div.accident-actions button[data-testid="edit-icon-button"]').first();
	}

	deleteFirstNotesButton() {
		return this.page.locator('div.accident-actions button[data-testid="hold-to-delete-tooltip"]').first();
	}

	async openPatientInformationPageByURL(patientId) {
		const url = `${playwrightConfig.logInOaiUrl}patient/${patientId}/info`;

		await this.page.route('**/fhir/Patient/*', route => route.continue());
		await this.page.route('**/fhir/Form?_count=50*', route => route.continue());

		const [, patientInfoJson, guarantorInfoJson, formApiResponse] = await Promise.all([
			this.page.goto(url),
			this.apiWaitUtils.waitForAPI('/fhir/Patient', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/Account', 'GET'),
			this.apiWaitUtils.waitForAPI('fhir/Form?_count=50', 'GET'),
		]);

		await this.generalInfoHeading().waitFor({ state: 'visible' });

		return { patientInfoJson, guarantorInfoJson, formApiResponse };
	}

	async extractGeneralInfo() {
		const generalInfo = {
			'Family Name': await this.familyNameTxt().textContent(),
			'Given Names': await this.givenNamesTxt().textContent(),
			Prefix: await this.prefixTxt().textContent(),
			Suffix: await this.suffixTxt().textContent(),
			SSN: (await this.ssnTxt().textContent()).replace(/\D/g, ''),
			'Patient ID': await this.patientIdTxt().textContent(),
			"Driver's License #": await this.driversLicenseTxt().textContent(),
			'Birth Date': convertToISO(await this.birthDateTxt().textContent()),
			Gender: await this.genderTxt().textContent(),
			'Birth Sex': await this.birthSexTxt().textContent(),
			'Managing Organization': await this.managingOrganizationTxt().textContent(),
			'Assigning Authority': await this.assigningAuthorityTxt().textContent(),
			"Mother's Given Name": await this.mothersGivenNameTxt().textContent(),
			"Mother's Family Name": await this.mothersFamilyNameTxt().textContent(),
			"Father's Given Name": await this.fathersGivenNameTxt().textContent(),
			"Father's Family Name": await this.fathersFamilyNameTxt().textContent(),
			'Marital Status': await this.maritalStatusTxt().textContent(),
			Confidentiality: await this.confidentialityTxt().textContent(),
			'Deceased Date': await this.deceasedDateTxt().textContent(),
			Race: await this.raceTxt().textContent(),
			Ethnicity: await this.ethnicityTxt().textContent(),
			Language: await this.languageTxt().textContent(),
		};

		Object.keys(generalInfo).forEach(field => {
			if (typeof generalInfo[field] === 'string' && generalInfo[field].trim() !== '') {
				generalInfo[field] = generalInfo[field].toUpperCase();
			}
		});

		return generalInfo;
	}

	async getPatientInformationDetailsFromPage(emailFieldIndex) {
		let generalInfo = { ...patientDO.generalInfo };
		let contactInfo = { ...patientDO.contactInfo };
		let emergencyContacts = { ...patientDO.emergencyContacts };
		let address = { ...patientDO.address };
		let guarantor = { ...patientDO.guarantor };

		// Click Guarantor Heading
		await this.guarantorHeading().waitFor({ state: 'visible' });
		await this.guarantorHeading().click();

		// Click Contact Information Heading
		await this.contactInfoHeading().waitFor({ state: 'visible' });
		await this.contactInfoHeading().click();

		// Click Emergency Contact Heading
		await this.emergencyContactHeading().waitFor({ state: 'visible' });
		await this.emergencyContactHeading().click();

		// Click Patient Notes Heading
		await this.patientNotesHeading().waitFor({ state: 'visible' });
		await this.patientNotesHeading().click();

		const generalInfoFromPage = await this.extractGeneralInfo();

		// Assign extracted values to generalInfo
		generalInfo = { ...generalInfo, ...generalInfoFromPage };

		contactInfo.Email = (await this.emailFields().first().textContent())?.trim();
		contactInfo.Phone = await this.phoneField().getAttribute('value');
		contactInfo.Phone = contactInfo.Phone.replace(/[^+\d]/g, '');

		address.Country = await this.countryTxt().textContent();
		address['State/Province'] = await this.stateProvinceTxt().textContent();
		address['ZIP/Postal Code'] = await this.zipPostalCodeTxt().textContent();
		address.City = await this.cityTxt().textContent();
		address['Address Line'] = await this.addressLineTxt().textContent();

		emergencyContacts.Name = await this.emergencyContactNameTxt().textContent();
		emergencyContacts.Email = await this.emergencyContactEmailTxt().textContent();
		emergencyContacts.Phone = await this.emergencyContactPhoneTxt().textContent();
		emergencyContacts.Phone = emergencyContacts.Phone.replace(/[^+\d]/g, '');

		return { generalInfo, contactInfo, emergencyContacts, address, guarantor };
	}
}

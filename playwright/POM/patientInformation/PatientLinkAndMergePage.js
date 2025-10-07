import { patientDO } from '../../dataObjects/patientDO';
import { convertToISO } from './patientInformationPage';

const { ApiWaitUtils } = require('../apiWaitUtils');

export class PatientLinkAndMergePage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Link & Merge section on the left sidebar
	linkAndMergeIcon() {
		return this.page.getByTestId('selected-resources-button');
	}

	unlinkIcon() {
		return this.page.getByTestId('unlink-patient-button');
	}

	linkAndMergeSearchTxt() {
		return this.page.getByTestId('find-patients-input');
	}

	linkedPatientCard() {
		return this.page.getByTestId('patient-card');
	}
	//#endregion Link & Merge section on the left sidebar

	//#region Patient search result screen
	linkPatientIcon() {
		return this.page.getByTestId('LinkIcon');
	}

	mergePatientIcon() {
		return this.page.getByTestId('CallMergeIcon');
	}
	//#endregion Patient search result screen

	//#region Link and Merge Patient form elements
	linkPatientFormHeader() {
		return this.page.getByRole('heading', { name: 'Link Patient' });
	}

	mergePatientFormHeader() {
		return this.page.getByRole('heading', { name: 'Merge Patient' });
	}

	formContentSection() {
		return this.page.locator('[data-testid="form-content-section"]');
	}

	currentPatientCheckbox() {
		return this.page
			.locator('div')
			.filter({ hasText: /^Current Patient$/ })
			.getByRole('checkbox');
	}

	currentPatientCard() {
		return this.formContentSection().locator('[data-testid="patientInfoDetailCard"]').nth(0);
	}

	selectedPatientCard() {
		return this.formContentSection().locator('[data-testid="patientInfoDetailCard"]').nth(1);
	}

	selectedPatientCheckbox() {
		return this.page
			.locator('div')
			.filter({ hasText: /^Selected Patient$/ })
			.getByRole('checkbox');
	}

	familyNameTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientLastName').locator('p').nth(1);
	}

	familyNameConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientLastName').getByTestId('conflict-pill-value');
	}

	givenNamesTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientFirstName').locator('p').nth(1);
	}

	givenNamesConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientFirstName').getByTestId('conflict-pill-value');
	}

	birthDateTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('birthDate').locator('p').nth(1);
	}

	birthDateConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('birthDate').getByTestId('conflict-pill-value');
	}

	motherNameTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('mothersMaidenName').locator('p').nth(1);
	}

	motherNameConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('mothersMaidenName').getByTestId('conflict-pill-value');
	}

	patientIdTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientID').locator('p').nth(1);
	}

	patientIdConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientID').getByTestId('conflict-pill-value');
	}

	issuerOfPatientIdTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('issuerOfPatientID').locator('p').nth(1);
	}

	addressTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientAddress').locator('p').nth(1);
	}

	addressConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('patientAddress').getByTestId('conflict-pill-value');
	}

	cityTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('city').locator('p').nth(1);
	}

	cityConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('city').getByTestId('conflict-pill-value');
	}

	stateProvinceTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('state').locator('p').nth(1);
	}

	stateProvinceConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('state').getByTestId('conflict-pill-value');
	}

	zipCodeTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('postalCode').locator('p').nth(1);
	}

	zipCodeConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('postalCode').getByTestId('conflict-pill-value');
	}

	countryTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('country').locator('p').nth(1);
	}

	countryConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('country').getByTestId('conflict-pill-value');
	}

	ssnTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('ssn').locator('p').nth(1);
	}

	ssnConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('ssn').getByTestId('conflict-pill-value');
	}

	genderTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('gender').locator('p').nth(1);
	}

	genderConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('gender').getByTestId('conflict-pill-value');
	}

	phoneNumberTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('cellPhone').locator('p').nth(1);
	}

	phoneNumberConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('cellPhone').getByTestId('conflict-pill-value');
	}

	emailAddressTxt(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('email').locator('p').nth(1);
	}

	emailAddressConflictedBtn(parentPatientCardElm) {
		return parentPatientCardElm?.getByTestId('email').getByTestId('conflict-pill-value');
	}

	submitBtn() {
		return this.page.getByTestId('SUBMIT_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Link and Merge Patient form elements

	//#region Functions
	async searchPatientForLinkAndMerge(searchKey) {
		this.linkAndMergeIcon().click();
		await this.linkAndMergeSearchTxt().waitFor({ state: 'visible' });
		this.linkAndMergeSearchTxt().click();
		this.linkAndMergeSearchTxt().pressSequentially(searchKey, { delay: 500 });
		await this.page.getByTestId(`patient-search-result-${searchKey}`).waitFor({ state: 'visible' });
	}

	async searchPatientAndOpenLinkPatientForm(searchKey) {
		await this.searchPatientForLinkAndMerge(searchKey);
		await this.linkPatientIcon().waitFor({ state: 'visible' });
		this.linkPatientIcon().click();
		await this.linkPatientFormHeader().waitFor({ state: 'visible' });
		await this.formContentSection().waitFor({ state: 'visible' });
	}

	async searchPatientAndOpenMergePatientForm(searchKey) {
		await this.searchPatientForLinkAndMerge(searchKey);
		await this.mergePatientIcon().waitFor({ state: 'visible' });
		this.mergePatientIcon().click();
		await this.mergePatientFormHeader().waitFor({ state: 'visible' });
		await this.formContentSection().waitFor({ state: 'visible' });
	}

	async #getPatientInfoFromPage(parentElm) {
		const ssn = await this.ssnTxt(parentElm).textContent();
		const patientInfo = {
			'Family Name': await this.familyNameTxt(parentElm).textContent(),
			'Given Names': await this.givenNamesTxt(parentElm).textContent(),
			'Birth Date': convertToISO(await this.birthDateTxt(parentElm).textContent()),
			"Mother's Name": await this.motherNameTxt(parentElm).textContent(),
			'Patient ID': await this.patientIdTxt(parentElm).textContent(),
			'Issuer of Patient ID': await this.issuerOfPatientIdTxt(parentElm).textContent(),
			Address: await this.addressTxt(parentElm).textContent(),
			city: await this.cityTxt(parentElm).textContent(),
			'State/Province': await this.stateProvinceTxt(parentElm).textContent(),
			'Zip Code': await this.zipCodeTxt(parentElm).textContent(),
			Country: await this.countryTxt(parentElm).textContent(),
			SSN: ssn?.replaceAll('-', ''),
			Gender: await this.genderTxt(parentElm).textContent(),
			'Phone Number': await this.phoneNumberTxt(parentElm).textContent(),
			'Email Address': await this.emailAddressTxt(parentElm).textContent(),
		};

		return patientInfo;
	}

	async getCurrentPatientInfoFromPage() {
		const currentPatientInfo = await this.#getPatientInfoFromPage(this.currentPatientCard());

		return currentPatientInfo;
	}

	async getSelectedPatientInfoFromPage() {
		let selectedPatientInfo = await this.#getPatientInfoFromPage(this.selectedPatientCard());

		return selectedPatientInfo;
	}

	async selectConflictFieldsOnPatientCard(parentPatientCardElm) {
		// excluded the fields that have dynamic values but there are still posibility to be duplicated,
		// so the conflict buttons are not enable for these fields - cityConflictedBtn, stateProvinceConflictedBtn, zipCodeConflictedBtn, countryConflictedBtn, genderConflictedBtn
		await this.familyNameConflictedBtn(parentPatientCardElm).click();
		await this.givenNamesConflictedBtn(parentPatientCardElm).click();
		await this.birthDateConflictedBtn(parentPatientCardElm).click();
		await this.motherNameConflictedBtn(parentPatientCardElm).click();
		await this.patientIdConflictedBtn(parentPatientCardElm).click();
		await this.addressConflictedBtn(parentPatientCardElm).click();
		await this.ssnConflictedBtn(parentPatientCardElm).click();
		await this.emailAddressConflictedBtn(parentPatientCardElm).click();
		await this.phoneNumberConflictedBtn(parentPatientCardElm).click();
	}

	/**
	 * Generate patientDO for Patient Detail cards on Link / Merge Patient form
	 * @patientInfo {object} the patientInfo object returned from patientGeneratetor.generatePatientBundlePayload()
	 * @returns patientDO object including all fields on a Patient Detail card
	 */
	generateExpectedPatientInfoForPatientCard = patientInfo => {
		if (!patientInfo) return;

		return {
			'Family Name': patientInfo?.generalInfo['Family Name']?.toUpperCase(),
			'Given Names': patientInfo?.generalInfo['Given Names']?.toUpperCase(),
			'Birth Date': patientInfo?.generalInfo['Birth Date'],
			"Mother's Name":
				`${patientInfo?.generalInfo["Mother's Family Name"]}, ${patientInfo?.generalInfo["Mother's Given Name"]}`.toUpperCase(),
			'Patient ID': patientInfo.generalInfo['Patient ID'],
			'Issuer of Patient ID': patientInfo?.generalInfo['Assigning Authority'],
			Address: patientInfo?.address['Address Line']?.toUpperCase(),
			city: patientInfo?.address?.City?.toUpperCase(),
			'State/Province': patientInfo?.address['State/Province']?.toUpperCase(),
			'Zip Code': patientInfo?.address['ZIP/Postal Code']?.toUpperCase(),
			Country: patientInfo?.address?.Country?.toUpperCase(),
			SSN: patientInfo?.generalInfo?.SSN?.toString(),
			Gender: patientInfo?.generalInfo?.Gender?.toUpperCase(),
			'Phone Number': patientInfo?.contactInfo?.Phone,
			'Email Address': patientInfo?.contactInfo?.Email?.toLowerCase(),
		};
	};

	/**
	 * Generate patientDO for General, Contact Information, and Address sections on PatientInfo page
	 * It uses the value from the merged patient (mergedPatientInfo) based on the selected fields defined in selectConflictFieldsOnPatientCard function
	 * @patientInfo {object} the patientInfo object returned from patientGeneratetor.generatePatientBundlePayload()
	 * @mergedPatientDO {object} the patientDO including all fields on the Patient Detail card that will be merged to the primary patient
	 * @mergedPatientInfo {object} the patientDO including General, Contact Information, and Address info of the merged patient
	 * @returns generalInfo object including all fields on PatientInfo page \ General section
	 * 			contactInfo object including all fields on PatientInfo page \ Contact Information section
	 * 			address object including all fields on PatientInfo page \ Address section
	 */
	generateExpectedMergePatientInfo = (patientInfo, mergedPatientDO, mergedPatientInfo) => {
		const generalInfo = { ...patientDO.generalInfo };
		const contactInfo = { ...patientDO.contactInfo };
		const address = { ...patientDO.address };

		generalInfo['Family Name'] = mergedPatientDO['Family Name'];
		generalInfo['Given Names'] = mergedPatientDO['Given Names'];
		generalInfo.Prefix = patientInfo?.generalInfo?.Prefix;
		generalInfo.Suffix = patientInfo?.generalInfo?.Suffix;
		generalInfo.SSN = mergedPatientDO.SSN;
		generalInfo['Patient ID'] = mergedPatientDO['Patient ID'];
		generalInfo["Driver's License #"] = patientInfo?.generalInfo["Driver's License #"];
		generalInfo['Birth Date'] = mergedPatientDO['Birth Date'];
		generalInfo.Gender = patientInfo?.generalInfo?.Gender;
		generalInfo['Birth Sex'] = patientInfo?.generalInfo['Birth Sex'];
		generalInfo['Managing Organization'] = patientInfo?.generalInfo['Managing Organization'];
		generalInfo['Assigning Authority'] = patientInfo?.generalInfo['Assigning Authority'];
		generalInfo["Mother's Family Name"] = mergedPatientInfo?.generalInfo["Mother's Family Name"];
		generalInfo["Mother's Given Name"] = mergedPatientInfo?.generalInfo["Mother's Given Name"];
		generalInfo["Father's Family Name"] = patientInfo?.generalInfo["Father's Family Name"];
		generalInfo["Father's Given Name"] = patientInfo?.generalInfo["Father's Given Name"];
		generalInfo['Marital Status'] = patientInfo?.generalInfo['Marital Status'];
		generalInfo.Confidentiality = patientInfo?.generalInfo?.Confidentiality;
		generalInfo['Deceased Date'] = 'N/A';
		generalInfo.Ethnicity = patientInfo?.generalInfo?.Ethnicity;
		generalInfo.Language = patientInfo?.generalInfo?.Language;
		generalInfo.Race = patientInfo?.generalInfo?.Race;

		contactInfo.Email = mergedPatientDO['Email Address'];
		contactInfo.Phone = mergedPatientDO['Phone Number'];

		address['Address Line'] = mergedPatientDO.Address;
		address.City = patientInfo?.address?.City?.toUpperCase();
		address['State/Province'] = patientInfo?.address['State/Province']?.toUpperCase();
		address['ZIP/Postal Code'] = patientInfo?.address['ZIP/Postal Code']?.toUpperCase();
		address.Country = patientInfo?.address?.Country?.toUpperCase();

		return { generalInfo, contactInfo, address };
	};
	//#endregion Functions
}

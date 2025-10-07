const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
import { ApiWaitUtils } from '../apiWaitUtils';

export class PatientAllergyPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Patient Allergy view
	addNewAllergyIcon() {
		return this.page.getByTestId('CardsViewHeaderV2-add');
	}

	allergyCardInfo(text) {
		return this.page.getByTestId('AllergiesCard').locator('div').filter({ hasText: text }).first();
	}

	deleteIcon() {
		return this.page.getByRole('button', { name: 'Hold to Delete' });
	}
	//#endregion Patient Allergy view

	//#region Patient Allergy form
	formHeader() {
		return this.page.getByTestId('form-header-section').locator('h6');
	}

	initialCard() {
		return this.page.getByTestId('initial-card');
	}

	offendingAgentOnInitialCard(offendingAgent) {
		return this.initialCard().locator('div').filter({ hasText: offendingAgent });
	}

	reactionDescriptionOnInitialCard(reactionDescription) {
		return this.initialCard().locator('div').filter({ hasText: reactionDescription });
	}

	offendingAgentCombo() {
		return this.page.getByTestId('autocomplete-field-Offending Agent').getByLabel('Offending Agent');
	}

	offendingAgentDrugCode() {
		return this.page.getByLabel('Offending Agent Drug Code');
	}

	reactionTypeCombo() {
		return this.page.locator('[id="form-field-Reaction\\ Type"]');
	}

	startDatePicker() {
		return this.page.locator('[name="startDate"]');
	}

	severityCombo() {
		return this.page.locator('[id="form-field-Severity"]');
	}

	reactionDescriptionTxt() {
		return this.page.getByLabel('Reaction Description');
	}

	recordedDatePicker() {
		return this.page.locator('[name="recordedDate"]');
	}

	noteTxt() {
		return this.page.getByTestId('edit-text-field').first().first();
	}

	selectOffendingAgentOption(optionName) {
		return this.page.getByRole('option', { name: optionName, exact: true });
	}

	selectDropdownOption(optionName) {
		return this.page.getByRole('option', { name: optionName });
	}

	datePickerYearSelect() {
		return this.page.getByLabel('calendar view is open, switch');
	}

	yearBtn(year) {
		return this.page.getByRole('button', { name: `${year}` });
	}

	successfulToastMsg() {
		return this.page.getByText('Successfully created allergy');
	}

	createBtn() {
		return this.page.getByTestId('SAVE_');
	}

	updateBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Patient Allergy form

	//#region Functions
	async openPatientAllergyPage(patientId) {
		const url = `${playwrightConfig.baseURL}patient/${patientId}/allergy`;

		await this.page.route('/fhir/AllergyIntolerance', route => route.continue());
		await Promise.all([this.page.goto(url), this.apiWaitUtils.waitForAPI('/fhir/AllergyIntolerance', 'GET')]);

		await this.addNewAllergyIcon().waitFor({ state: 'visible' });
	}

	async inputFormData(allergy, isUpdate) {
		await this.offendingAgentCombo().click();
		await this.offendingAgentCombo().pressSequentially(allergy?.offendingAgent, { delay: 500 });
		await this.selectOffendingAgentOption(allergy?.offendingAgent).click();

		await this.reactionTypeCombo().click();
		await this.selectDropdownOption(allergy?.reactionType).click();

		if (allergy?.startYear) {
			await this.startDatePicker().click();
			await this.datePickerYearSelect().click();
			await this.yearBtn(allergy?.startYear).click();
			if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
				await this.page.getByRole('button', { name: 'OK' }).click(); // visible in headless mode
			} else {
				await this.startDatePicker().click();
			}
		}

		await this.severityCombo().click();
		await this.selectDropdownOption(allergy?.severity).click();

		if (isUpdate) {
			await this.reactionDescriptionTxt().click();
			await this.reactionDescriptionTxt().press('ControlOrMeta+a');
			await this.reactionDescriptionTxt().press('Backspace');
		}
		await this.reactionDescriptionTxt().pressSequentially(allergy?.reactionDescription, { delay: 200 });

		if (allergy?.recordedYear) {
			await this.recordedDatePicker().click();
			await this.datePickerYearSelect().click();
			await this.yearBtn(allergy?.recordedYear).click();
			if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
				await this.page.getByRole('button', { name: 'OK' }).click(); // visible in headless mode
			} else {
				await this.recordedDatePicker().click();
			}
		}

		await this.noteTxt().click();
		if (isUpdate) {
			await this.noteTxt().press('ControlOrMeta+a');
			await this.noteTxt().press('Backspace');
		}
		await this.noteTxt().pressSequentially(allergy?.note, { delay: 200 });
	}

	async addPatientAllergy(allergy) {
		await this.addNewAllergyIcon().click();
		expect(this.formHeader()).toHaveText('Allergies & Adverse Reactions');

		// Input data
		await this.inputFormData(allergy);

		await this.page.route('/fhir/AllergyIntolerance', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/AllergyIntolerance', 'POST')]);
	}
	//#endregion Functions
}

const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
import { ApiWaitUtils } from '../apiWaitUtils';

export class PatientAlertPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Patient Alert view
	addNewAlertIcon() {
		return this.page.getByTestId('CardsViewHeaderV2-add');
	}

	deleteIcon() {
		return this.page.getByTestId('hold-to-delete-tooltip');
	}
	//#endregion Patient Alert view

	//#region Patient Alert form
	formHeader() {
		return this.page.getByTestId('form-header-section').locator('h6');
	}

	alertDescriptionAndNotePreview(content) {
		return this.page
			.getByTestId('form-content-section')
			.locator('div')
			.filter({ hasText: `${content}` })
			.first();
	}

	alertDescriptionTxt() {
		return this.page.getByLabel('Alert Description');
	}

	startDatePicker() {
		return this.page.locator('[name="startDate"]');
	}

	endDatePicker() {
		return this.page.locator('[name="endDate"]');
	}

	datePickerYearSelect() {
		return this.page.getByLabel('calendar view is open, switch');
	}

	yearBtn(year) {
		return this.page.getByRole('button', { name: `${year}`, exact: true });
	}

	noteTxt() {
		return this.page.getByTestId('edit-text-field').first().first();
	}

	createBtn() {
		return this.page.getByTestId('SAVE_');
	}

	updateBtn() {
		return this.page.getByTestId('SAVE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Patient Alert form

	//#region Functions
	async openPatientAlertPage(patientId) {
		const url = `${playwrightConfig.baseURL}patient/${patientId}/patient-needs`;

		await this.page.route('/fhir/PatientAlert', route => route.continue());
		await Promise.all([this.page.goto(url), this.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'GET')]);

		await this.addNewAlertIcon().waitFor({ state: 'visible' });
	}

	async inputFormData(data, isUpdate) {
		if (isUpdate) {
			await this.alertDescriptionTxt().click();
			await this.alertDescriptionTxt().press('ControlOrMeta+a');
			await this.alertDescriptionTxt().press('Backspace');
		}
		await this.alertDescriptionTxt().pressSequentially(data?.alertDescription, { delay: 200 });

		if (data?.startYear) {
			await this.startDatePicker().click();
			await this.datePickerYearSelect().click();
			await this.yearBtn(data.startYear).click();
			// select the current date of the selected year and close the date picker
			if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
				// When running the tests in headless mode on pipeline, the MUI date picker GUI looks different. It shows Clear, Cancel and OK buttons,
				// and the startDatePicker elelent is not visible. So the step closing the date picker needs to be different for headless and headed modes
				await this.page.getByRole('button', { name: 'OK' }).click();
			} else {
				await this.startDatePicker().click();
			}
		}

		if (data?.endYear) {
			await this.endDatePicker().click();
			await this.datePickerYearSelect().click();
			await this.yearBtn(data.endYear).click();
			if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
				await this.page.getByRole('button', { name: 'OK' }).click(); // visible in headless mode
			} else {
				await this.endDatePicker().click();
			}
		}

		await this.noteTxt().click();
		if (isUpdate) {
			await this.noteTxt().press('ControlOrMeta+a');
			await this.noteTxt().press('Backspace');
		}
		await this.noteTxt().pressSequentially(data?.note, { delay: 200 });
	}

	async addPatientAlert(alertData) {
		await this.addNewAlertIcon().click();
		expect(this.formHeader()).toHaveText('Alerts');

		// Input data
		await this.inputFormData(alertData);

		await this.page.route('/fhir/PatientAlert', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'POST')]);
	}
	//#endregion Functions
}

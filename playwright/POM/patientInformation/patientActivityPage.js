import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } from '../timeouts';
import { expect } from '@playwright/test';

import { patientDO } from '../patient/patientDO';

const { Common } = require('../common');
const { PatientInformationPage } = require('./patientInformationPage');

export class PatientActivityPage {
	constructor(page) {
		this.page = page;
		this.common = new Common(page);
		this.patientInformationPage = new PatientInformationPage(this.page);
	}

	activityHeaderLbl() {
		return this.page.locator('[data-cy="patientActivity"] p:has-text("Activity")');
	}

	cancelBtn() {
		return this.page.locator('[data-cy="main-header"] button:has-text("Cancel")');
	}

	saveBtn() {
		return this.page.locator('[data-cy="main-header"] button:has-text("Save")');
	}

	addNewBtn() {
		return this.page.locator('[data-cy="patientActivity"] button').first();
	}

	async addPhoneCallOption() {
		await this.common.selectOptionFromSingleSelection(this.addNewBtn(), 'Add Phone Call');
	}

	async addNoteOption() {
		await this.common.selectOptionFromSingleSelection(this.addNewBtn(), 'Add Note');
	}

	activityTable() {
		return this.page.locator('[data-cy="patientActivity"] table');
	}

	async openPatientActivity(patientId) {
		await this.patientInformationPage.openPatientInformationPageByURL(patientId);
		await this.page.route('**/fhir/PatientActivity?*', route => route.continue());
		// await this.page.locator('[data-cy="patientActivity"]').waitFor({ timeout: TIMEOUT_IN_MSEC2 });
		await this.patientInformationPage.activityNav().click();
		await this.page.waitForResponse(
			response => response.url().includes('fhir/PatientActivity') && response.status() === 200
		);
	}

	activityTableRows() {
		return this.page.locator('[data-cy="patientActivity"] tbody > tr');
	}

	callTypeComboOnEditMode() {
		return this.activityTableRows()
			.locator('[data-testid="ArrowDropDownIcon"]', { timeout: TIMEOUT_IN_MSEC1 })
			.first();
	}

	commentTxtOnEditMode() {
		return this.activityTableRows().nth(0).locator('td:nth-child(6) input');
	}

	getTextForPatientActivityColumns(rowIndex, colIndex) {
		return this.activityTableRows()
			.nth(rowIndex)
			.locator(`td:nth-child(${colIndex + 1})`)
			.textContent();
	}

	async getFirstRowActivityOnViewMode() {
		let activityDOFromPage = { ...patientDO.patientActivityDO };

		activityDOFromPage['Date/Time'] = await this.getTextForPatientActivityColumns(0, 0);
		activityDOFromPage['Activity Type'] = (await this.getTextForPatientActivityColumns(0, 1)).toUpperCase();
		activityDOFromPage['Call Type'] = (await this.getTextForPatientActivityColumns(0, 2)).toUpperCase();
		activityDOFromPage['Login Email'] = await this.getTextForPatientActivityColumns(0, 3);
		activityDOFromPage['User Name'] = await this.getTextForPatientActivityColumns(0, 4);
		activityDOFromPage['Comments'] = await this.getTextForPatientActivityColumns(0, 5);

		return activityDOFromPage;
	}

	async getFirstRowActivityOnEditMode(isPhoneCall, comment) {
		let activityDOFromPage = { ...patientDO.patientActivityDO };

		activityDOFromPage['Date/Time'] = await this.getTextForPatientActivityColumns(0, 0);
		activityDOFromPage['Activity Type'] = (await this.getTextForPatientActivityColumns(0, 1)).toUpperCase();

		if (isPhoneCall) {
			activityDOFromPage['Call Type'] = (await this.callTypeComboOnEditMode().textContent()).toUpperCase();
		} else {
			activityDOFromPage['Call Type'] = (await this.getTextForPatientActivityColumns(0, 2)).toUpperCase();
		}

		activityDOFromPage['Login Email'] = await this.getTextForPatientActivityColumns(0, 3);
		activityDOFromPage['User Name'] = await this.getTextForPatientActivityColumns(0, 4);
		activityDOFromPage['Comments'] = comment;

		return activityDOFromPage;
	}

	async addNewPatientActivityPhoneCall(callType, comment) {
		let row = {};

		await this.addPhoneCallOption();
		await this.common.selectOptionFromSingleSelection(this.callTypeComboOnEditMode(), callType);
		await this.commentTxtOnEditMode().fill(comment);
		row = await this.getFirstRowActivityOnEditMode(true, comment);
		await this.saveBtn().click();

		return row;
	}

	async addNewPatientActivityNote(comment) {
		let row = {};
		await this.addNoteOption();
		await this.commentTxtOnEditMode().fill(comment);
		row = await this.getFirstRowActivityOnEditMode(false, comment);
		await this.saveBtn().click();

		return row;
	}
}

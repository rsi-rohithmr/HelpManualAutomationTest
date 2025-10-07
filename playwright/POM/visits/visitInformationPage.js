import { cloneDeep } from 'lodash';
import { visitDO } from 'playwright/dataObjects/visitsDO';
import { TIMEOUT_IN_MSEC2 } from '../timeouts';

const { ApiWaitUtils } = require('../apiWaitUtils');
const { Common } = require('../common');
const { HomePage } = require('../homePage/homePage');
const { ClickWheel } = require('../clickWheel');
const { GlobalSearch } = require('../globalSearch');
const { expect } = require('@playwright/test');
export class VisitInformationPage {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
		this.common = new Common(this.page);
		this.globalSearch = new GlobalSearch(this.page);
		this.clickWheel = new ClickWheel(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	visitInfoBtn() {
		return this.page.getByTestId('form-field-visitNumber').first();
	}

	editBtn() {
		return this.page.locator('[data-cy="form-header-edit-button"]');
	}

	saveBtn() {
		return this.page.locator('[data-cy="form-header-save-button"]');
	}

	expandVisitSectionInfoBtn() {
		return this.page.getByTestId('expand-visit-button');
	}

	expandVisitDetailsSectionBtn() {
		return this.page.getByTestId('visit-section-Visit Details').getByTestId('expand-visit-section-button');
	}

	visitDetailsSection() {
		return this.page.getByTestId('visit-section-Visit Details');
	}

	expandVisitPatientVitalSectionBtn() {
		return this.page.getByTestId('visit-section-Patient Vitals').getByTestId('expand-visit-section-button');
	}

	visitPatientVitalSection() {
		return this.page.getByTestId('visit-section-Patient Vitals');
	}

	expandVisitClinicalSectionBtn() {
		return this.page.getByTestId('visit-section-Summary of Care').getByTestId('expand-visit-section-button');
	}

	visitClinicalSection() {
		return this.page.getByTestId('visit-section-Summary of Care');
	}

	expandVisitAccidentNotesSectionBtn() {
		return this.page.getByTestId('visit-section-Accident Notes').getByTestId('expand-visit-section-button');
	}

	visitAccidentNotesSection() {
		return this.page.getByTestId('visit-section-Accident Notes');
	}

	visitListCount() {
		const visitListElement = this.page.locator('[data-testid="visit-list"]');
		// Get the text content of the second <p> element inside the visit list element
		const visitCount = visitListElement.locator('p').nth(1).textContent();
		return visitCount;
	}

	// General Section
	visitIdLbl() {
		const visitNumberElement = this.page.locator('[data-testid="form-field-visitNumber"]');
		// Get the text content of the span element inside the div
		const visitNumber = visitNumberElement.locator('span').first().textContent();
		return visitNumber;
	}

	visitPatientClassLbl() {
		const patientClassElement = this.page.locator('[data-testid="form-field-class"]');
		// Get the text content of the span element inside the div
		const visitPatientClass = patientClassElement.locator('span').first().textContent();
		return visitPatientClass;
	}

	visitSpecialCourtesyLbl() {
		const specialCourtesyElement = this.page.locator('[data-testid="form-field-specialCourtesy"]');
		// Get the text content of the span element inside the div
		const visitSpecialCourtesy = specialCourtesyElement.locator('span').first().textContent();
		return visitSpecialCourtesy;
	}

	// Form Field Locators
	formFieldDateTime() {
		return this.page.locator('[data-testid="form-field-dateTime"]');
	}

	formFieldType() {
		return this.page.locator('[data-testid="form-field-type"]');
	}

	formFieldStatus() {
		return this.page.locator('[data-testid="form-field-status"]');
	}

	formFieldPhysician() {
		return this.page.locator('[data-testid="form-field-physician"]');
	}

	formFieldLocation() {
		return this.page.locator('[data-testid="form-field-location"]');
	}

	formFieldReason() {
		return this.page.locator('[data-testid="form-field-reason"]');
	}

	formFieldClass() {
		return this.page.locator('[data-testid="form-field-class"]');
	}

	formFieldSpecialCourtesy() {
		return this.page.locator('[data-testid="form-field-specialCourtesy"]');
	}

	formFieldPlanOfCare() {
		return this.page.getByPlaceholder('Enter plan of care for the patient');
	}

	formFieldFollowUpInstruction() {
		return this.page.getByPlaceholder('Enter follow-up instructions for the patient');
	}

	// Patient Vitals Form Field Locators
	formFieldHeight() {
		return this.page.getByPlaceholder('Enter Height');
	}

	formFieldWeight() {
		return this.page.getByPlaceholder('Enter Weight');
	}

	formFieldHeartRate() {
		return this.page.getByPlaceholder('Enter Heart Rate');
	}

	formFieldSystole() {
		return this.page.getByPlaceholder('Systole');
	}

	formFieldDiastole() {
		return this.page.getByPlaceholder('Diastole');
	}

	patientVitalsObservationsDropdown() {
		return this.page.getByTestId('patient-vitals-observations').getByRole('button', { name: '​' });
	}

	patientVitalsDatePicker() {
		return this.page.getByTestId('patient-vitals-observations').getByPlaceholder('mm/dd/yyyy');
	}

	selectObservationType(type) {
		return this.page.getByRole('option', { name: type });
	}

	//#region Accident Notes
	accidentNotesSectionExpandBtn() {
		return this.page.getByTestId('visit-section-Accident Notes').getByTestId('expand-visit-section-button');
	}

	noteCards() {
		return this.page.locator('[data-testid="NotesCard"]');
	}

	addEmptyAccidentNoteBtn() {
		return this.page.getByTestId('noNotes');
	}

	addAccidentNoteBtn() {
		return this.page.locator('[aria-label="Add an Accident Note"]');
	}

	editNoteBtn() {
		return this.page.getByTestId('edit-icon-button');
	}

	accidentNoteTxt(index) {
		const locator = this.page.getByRole('textbox', { name: 'Add an Accident Note' });
		return index !== undefined ? locator.nth(index) : locator;
	}

	saveNoteBtn() {
		return this.page.getByTestId('save-icon-button');
	}

	deleteNoteBtn() {
		return this.page.getByRole('button', { name: 'Hold to Delete' });
	}

	noteCreatedBy() {
		return this.page.locator('text=Created by').locator('b');
	}

	noteDateTime() {
		return this.page.locator('text=Created by').locator('xpath=../following-sibling::p');
	}

	//#endregion

	async getSectionName(sectionName) {
		return this.page.getByRole('heading', { name: sectionName }).textContent();
	}

	async saveNoteAndWaitForSavingComplete() {
		await this.page.route('/fhir/Encounter/', route => route.continue());
		await Promise.all([this.saveNoteBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/Encounter/', 'PATCH')]);
	}

	async addNote(note, index = 0) {
		await this.addAccidentNoteBtn().click();
		await this.accidentNoteTxt(index).fill(note);
		await this.saveNoteAndWaitForSavingComplete();
		await this.page
			.getByText('Accident notes successfully saved')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}
	async updateNote(newNote, index = 1) {
		// Make sure the note card is in view and hover over it
		await this.noteCards().nth(index).scrollIntoViewIfNeeded();
		await this.noteCards().nth(index).hover();

		// Wait for edit button with retry mechanism
		const editButton = this.editNoteBtn().nth(index);
		let maxAttempts = 3;
		let attempt = 0;

		while (attempt < maxAttempts) {
			try {
				await this.noteCards().nth(index).hover(); // Refresh hover state
				await expect(editButton).toBeVisible({ timeout: 2000 });
				break;
			} catch (error) {
				attempt++;
				if (attempt === maxAttempts) {
					throw new Error(`Edit button not visible after ${maxAttempts} attempts`);
				}
				await this.page.waitForTimeout(500);
			}
		}

		await editButton.click();
		await this.accidentNoteTxt(index).fill(newNote);
		await this.saveNoteAndWaitForSavingComplete();
	}

	async deleteNote(index = 0) {
		await this.noteCards().nth(index).hover();
		await this.deleteNoteBtn().nth(index).click(),
			await this.page.mouse.down(),
			await this.page.waitForTimeout(3000),
			await this.page.mouse.up(),
			await this.page
				.getByText('Accident note deleted successfully')
				.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async getAccidentNoteFormValues() {
		const formValues = cloneDeep(visitDO);

		formValues.accidentNotes.sectionHeader = await this.getSectionName('Accident Notes');
		formValues.accidentNotes.count = +(await this.page
			.getByTestId('visit-section-Accident Notes')
			.locator('p')
			.first()
			.textContent());

		const noteCardCount = +formValues.accidentNotes.count;
		console.log('noteCardCount', noteCardCount);
		for (let i = 0; i < noteCardCount; i++) {
			const noteCard = await this.noteCards().nth(i);
			formValues.accidentNotes[`note${i}Header`] = await noteCard.getByText('Accident Notes').textContent();
			formValues.accidentNotes[`note${i}Content`] = await noteCard
				.locator('textarea[placeholder="Add an Accident Note"]')
				.first()
				.inputValue();
			formValues.accidentNotes[`note${i}CreatedBy`] = await noteCard
				.locator('p')
				.filter({ hasText: 'Created by' })
				.locator('b')
				.textContent();
			formValues.accidentNotes[`note${i}CreatedDate`] = await noteCard
				.locator('p', { hasText: 'Created by' })
				.locator('xpath=following-sibling::p[1]')
				.textContent();
		}

		return formValues.accidentNotes;
	}

	async openVisitOrderDetailsPage(visitInfo, organizationName) {
		await this.homePage.filterStudiesBySingleColumn(
			'Patient Name',
			`${visitInfo.patientLastName} ${visitInfo.patientFirstName}`
		);
		await this.homePage.filterStudiesBySingleColumn('Imaging Organization', organizationName);
		await this.page.waitForTimeout(5000);

		await this.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${visitInfo?.patientName}$`, 'g'))
			.first()
			.click();
		await this.page.waitForTimeout(6000);
		await this.clickWheel.clickWheel().waitFor({ state: 'attached' });
		await this.clickWheel.orderIcon().click({ force: true });
		await this.visitInfoBtn().waitFor({ state: 'visible' });
	}

	async openVisitDetailsAndWaitForAPI(orderId, apiUrl) {
		//await this.page.route('**/fhir/order/*', route => route.continue());

		const currentUrl = this.page.url(); // Get the current URL
		const newUrl = new URL(currentUrl); // Parse the current URL
		newUrl.pathname = `/order/${orderId}`; // Append the desired path
		const response = await Promise.all([
			this.page.goto(newUrl.toString()), // Navigate to the new URL
			this.apiWaitUtils.waitForAPI(apiUrl, 'GET'), // Wait for the API response
		]);

		await this.visitInfoBtn().waitFor({ state: 'visible' });

		return response[1]; // Return the API response
	}

	async setVisitDetailsInformation() {
		await this.page.route('/fhir/ValueSet**', route => route.continue());

		// Hover over the display field to make the autocomplete field visible
		const displayField = await this.page.locator('[data-testid="form-field-type"]'); // Adjust selector if needed
		await displayField.hover();
		// Locate the Autocomplete input field and type a query
		const autoCompleteInput = await this.page.getByLabel('Encounter Type');
		await expect(autoCompleteInput).toBeVisible(); // Ensure it's now visible
		// Added this line to ensure that the autocomplete is selecting right option from dropdown ,there is another issue we captured in this jira https://ramsoftinc.atlassian.net/browse/PRO-6274
		await Promise.all([
			autoCompleteInput.pressSequentially('Alter', { delay: 500 }),
			this.apiWaitUtils.waitForAPI('/fhir/ValueSet', 'GET'),
		]);
		await this.page.getByRole('option').first().click();

		const fieldContainerForStatus = this.page.locator('[data-testid="form-field-status"]'); // Adjust selector if needed
		await fieldContainerForStatus.hover();
		const dropdownButton = this.page.locator('#form-field-Encounter\\ Status');
		await expect(dropdownButton).toBeVisible(); // Ensure it's now visible
		await dropdownButton.click();

		// Wait for the dropdown options to appear
		const dropdownOption = this.page.locator('li[role="option"]', { hasText: 'Arrived' }); // Change option text as needed
		await expect(dropdownOption).toBeVisible();
		// Select an option from the dropdown
		await dropdownOption.click();
		const fieldContainerForPhysician = this.page.locator('[data-testid="form-field-physician"]');
		await fieldContainerForPhysician.hover();

		await this.page.getByLabel('Attending Physician/Nurse').click();
		await this.page.getByLabel('Attending Physician/Nurse').fill('John Doe');
		const fieldContainerForLocation = this.page.locator('[data-testid="form-field-location"]');
		await fieldContainerForLocation.hover();
		await this.page.getByLabel('Location of Encounter').click();
		await this.page.getByLabel('Location of Encounter').fill('ER');
		const fieldContainerForReason = this.formFieldReason();
		await fieldContainerForReason.hover();
		await this.page.getByLabel('Visit Reason/History').pressSequentially('ra', { delay: 500 });
		await this.page.getByRole('option').first().click();
		await this.page.locator('body').click({ position: { x: 0, y: 0 } });

		const patchExpectedVisitInfoDO = await Promise.all([
			this.page.getByTestId('save-button').click(),
			this.apiWaitUtils.waitForAPI('/fhir/Encounter/', 'PATCH'),
		]);
		return patchExpectedVisitInfoDO[1]; // Return the API response
	}

	async getVisitInformationFromPage() {
		let visitInfo = {
			visitNumber: '',
			patientClass: '',
			specialCourtesy: '',
		};

		visitInfo.visitNumber = await this.visitIdLbl();
		visitInfo.patientClass = await this.visitPatientClassLbl();
		visitInfo.specialCourtesy = await this.visitSpecialCourtesyLbl();

		return visitInfo;
	}

	async getVisitDetailsInformationFromPage() {
		let visitInfo = {
			dateTime: '',
			type: '',
			status: '',
			physician: '',
			location: '',
			reason: '',
			accidentNotes: [],
		};

		visitInfo.dateTime = await this.formFieldDateTime().locator('span').first().textContent();
		visitInfo.type = await this.formFieldType().locator('span').textContent();
		visitInfo.status = await this.formFieldStatus().locator('span').textContent();
		visitInfo.physician = await this.formFieldPhysician().locator('span').textContent();
		visitInfo.location = await this.formFieldLocation().locator('span').textContent();
		try {
			const reasonElement = await this.formFieldReason().locator('span.MuiTypography-body1').first();
			if (await reasonElement.isVisible()) {
				visitInfo.reason = await reasonElement.textContent();
			} else {
				visitInfo.reason = await this.page
					.locator('[id="autocomplete-field-Visit Reason/History"]')
					.inputValue();
			}
		} catch {
			visitInfo.reason = await this.page.locator('[id="autocomplete-field-Visit Reason/History"]').inputValue();
		}

		visitInfo.accidentNotes = await this.getAccidentNoteFormValues();

		return visitInfo;
	}

	async setPatientVitals(height, weight, heartRate, systole, diastole) {
		await this.formFieldHeight().fill(height);
		await this.formFieldWeight().fill(weight);
		await this.formFieldHeartRate().fill(heartRate);
		await this.formFieldSystole().fill(systole);
		await this.formFieldDiastole().fill(diastole);

		// Set observation type to Light
		await this.patientVitalsObservationsDropdown().click();
		await this.selectObservationType('Light').click();

		// Set observation type to Social
		await this.patientVitalsObservationsDropdown().click();
		await this.selectObservationType('Social').click();

		// Set date
		await this.patientVitalsDatePicker().click();
		// Note: Date selection might need additional steps depending on the date picker implementation
	}
}

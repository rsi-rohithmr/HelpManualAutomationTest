const { Common } = require('../../common');
const { HomePage } = require('../../homePage/homePage');
const { ClickWheel } = require('../../clickWheel');
const { GlobalSearch } = require('../../globalSearch');
import { ApiWaitUtils } from '../../apiWaitUtils';
const { expect } = require('@playwright/test');
const { DetailedTablePopper } = require('../../patientInformation/detailedTablePopper');
const { ReferringPhysicianPage } = require('./addNewReferringPhysician');
import { TIMEOUT_IN_MSEC2 } from '../../timeouts';
import { cloneDeep } from 'lodash';
import { orderDO } from '../../../dataObjects/orderDO';
import { StudyInfoPage } from '../../study/studyInfoPage';
const playwrightConfig = require('../../../../playwright.config');
export class OrderInformationPage {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
		this.common = new Common(this.page);
		this.globalSearch = new GlobalSearch(this.page);
		this.clickWheel = new ClickWheel(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.detailedTablePopper = new DetailedTablePopper(this.page);
		this.referringPhysicianPage = new ReferringPhysicianPage(this.page);
	}

	getOrderLabel() {
		return this.page.getByTestId('order-details-container').getByTestId('order-study-label');
	}

	getAccessionNumber() {
		const element = this.page.getByTestId('order-field-value-accessionNumber');
		return element ? element.textContent() : '';
	}

	getPriority() {
		const element = this.page.getByTestId('order-field-value-orderPriority');
		return element ? element.textContent() : '';
	}

	getStatus() {
		const element = this.page.getByTestId('order-field-value-orderStatus');
		return element ? element.textContent() : '';
	}

	getFillerOrderNum() {
		const element = this.page.getByTestId('order-field-value-fillerOrderNumber');
		return element ? element.textContent() : '';
	}

	getReferringPhysician() {
		const element = this.page.getByTestId('order-field-value-referringPhysician');
		return element ? element.textContent() : '';
	}

	getReferringOrganization() {
		const element = this.page.getByTestId('order-field-value-referringOrganization');
		return element ? element.textContent() : '';
	}

	getConsultingPhysician() {
		const element = this.page.getByTestId('order-field-value-consultingPhysician');
		return element ? element.textContent() : '';
	}

	// Add new helper methods for order details card
	getOrderDetailsCard() {
		return this.page.getByTestId('order-details-card');
	}

	getOrderFieldsContainer() {
		return this.page.getByTestId('order-fields-container');
	}

	getStudyNumberDisplay() {
		return this.page.getByTestId('study-number-display');
	}

	getStudiesListContainer() {
		this.page.getByTestId('studies-list-container');
	}

	getPriorityIcon() {
		return this.page.getByTestId('priority-icon');
	}

	getConsultingPhysicianCount() {
		const element = this.page.getByTestId('consulting-physician-count');
		return element ? element.textContent() : '';
	}

	getOrderDateTime() {
		const element = this.page.getByTestId('order-field-value-orderDateTime');
		return element ? element.textContent() : '';
	}

	getRequestedAppointmentDateTime() {
		const element = this.page.getByTestId('order-field-value-requestedAppointmentDateTime');
		return element ? element.textContent() : '';
	}

	getPlacerOrderNumber() {
		const element = this.page.getByTestId('order-field-value-placerOrderNumber');
		return element ? element.textContent() : '';
	}

	isConsultingPhysicianPopperVisible() {
		const popper = this.page.getByTestId('consulting-physician-popper');
		return popper.isVisible();
	}

	getEditOrderIcon() {
		return this.page.getByTestId('edit-order-icon');
	}

	getOrderDrawerSaveBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	// Get Accession Number input
	getOrderDrawerAccessionNumberField() {
		return this.page.getByLabel('Accession Number');
	}

	// Get Order Date/Time input
	getOrderDrawerOrderDateTimeField() {
		return this.page.locator('input[name="authoredOn"]');
	}

	// Get Requested Appointment Date/Time input
	getOrderDrawerRequestedAppointmentDateTimeField() {
		return this.page.locator('input[name="occurrenceDateTime"]');
	}

	// Get Order Priority (autocomplete input)
	getOrderDrawerPriorityField() {
		return this.page.getByLabel('Order Priority');
	}

	getOrderDrawerAccessionNumberByName() {
		return this.page.locator('input[name="accessionNumber"]');
	}

	getOrderDrawerOrderDateTimeByPlaceholder() {
		return this.page.getByPlaceholder('MM/DD/YYYY hh:mm A').nth(0);
	}

	getOrderDrawerRequestedAppointmentDateTimeByPlaceholder() {
		return this.page.getByPlaceholder('MM/DD/YYYY hh:mm A').nth(1);
	}

	getOrderDrawerPriorityByPlaceholder() {
		return this.page.getByPlaceholder('Search Here');
	}

	// Get Referring Physician autocomplete field
	getReferringPhysicianField() {
		return this.page.getByTestId('form-content-section').getByTestId('autocomplete-field-Referring Physician');
	}

	// Get Referring Physician input field
	getReferringPhysicianInput() {
		return this.page.getByRole('combobox', { name: 'Search Here' });
	}

	// Get Referring Physician search icon
	getReferringPhysicianSearchIcon() {
		return this.page.getByTestId('SearchIcon');
	}

	// Get Referring Physician clear button
	getReferringPhysicianClearButton() {
		return this.page.getByTestId('CloseIcon');
	}

	// Get Referring Physician dropdown button
	getReferringPhysicianDropdownButton() {
		return this.page.getByTestId('ArrowDropDownIcon');
	}

	getAddStudyIcon() {
		return this.page.getByTestId('addStudyClick');
	}

	getStudySearchInput() {
		return this.page.getByRole('combobox', {
			placeholder: 'Search for studies',
		});
	}

	// Get Save button
	getStudySaveButton() {
		return this.page.getByTestId('save-button');
	}

	// Get Cancel button
	getStudyCancelButton() {
		return this.page.getByTestId('cancel-button');
	}

	getChangePatientButton() {
		return this.page.getByTestId('change-patient-icon');
	}

	getStudyCount() {
		return this.page
			.getByTestId('order-details-container')
			.getByTestId('order-study-number-display')
			.getByText(/^[0-9]+$/)
			.first();
	}

	// Get Reassign Order dialog elements
	getReassignOrderDialog() {
		return this.page.locator('#customized-dialog-title').filter({
			hasText: 'Reassign Order to a New Patient',
		});
	}

	getReassignOrderProceedButton() {
		return this.page.getByTestId('proceed-btn');
	}

	getReassignOrderCancelButton() {
		return this.page.getByTestId('secondary-btn');
	}

	getReassignOrderSaveButton() {
		return this.page.getByTestId('SAVE_');
	}

	getPatientNameField() {
		return this.page.getByLabel('Patient Name');
	}

	getPatientNameInput() {
		return this.page.getByRole('combobox', { name: 'Search Here' }); // note: escaped space
	}

	getDataGridPopper() {
		return this.page.locator('.MuiPopper-root');
	}

	getDataGridCell(text) {
		return this.page.getByRole('cell', {
			hasText: text,
		});
	}

	//#region Order Notes
	orderNotesSectionExpandBtn() {
		return this.page.getByTestId('visit-section-Order Notes').getByTestId('expand-visit-section-button');
	}

	noteCards() {
		return this.page.locator('[data-testid="NotesCard"]');
	}

	addEmptyOrderNoteBtn() {
		return this.page.getByTestId('noNotes');
	}

	addOrderNoteBtn() {
		return this.page.locator('[aria-label="Add a Note"]');
	}

	editNoteBtn() {
		return this.page.getByTestId('visit-section-Order Notes').getByRole('button', { name: 'Edit' });
	}

	orderNoteTxt(index) {
		const locator = this.page.getByRole('textbox', { name: 'Add a Note' });
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
		await this.page.route('/fhir/ServiceRequest/', route => route.continue());
		await Promise.all([this.saveNoteBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/ServiceRequest/', 'PATCH')]);
	}

	async addNote(note, index = 0) {
		await this.addOrderNoteBtn().click();
		await this.orderNoteTxt(index).fill(note);
		await this.saveNoteAndWaitForSavingComplete();
		await this.page
			.getByText('Order notes successfully saved')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async updateNote(newNote, index = 0) {
		await this.page
			.getByText('Order Notes')
			.nth(index + 1)
			.hover();
		await expect(this.editNoteBtn()).toBeVisible({ timeout: 5000 });
		await this.editNoteBtn().click();
		await this.orderNoteTxt(index).fill(newNote);
		await this.saveNoteAndWaitForSavingComplete();
	}

	async deleteNote(index = 0) {
		await this.page
			.getByText('Order Notes')
			.nth(index + 1)
			.hover();
		await this.deleteNoteBtn().nth(index).click();
		await this.page.mouse.down();
		await this.page.waitForTimeout(3000),
			await this.page.mouse.up(),
			await this.page
				.getByText('Note deleted successfully')
				.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async getOrderNoteFormValues() {
		const formValues = cloneDeep(orderDO);

		formValues.orderNotes.sectionHeader = await this.getSectionName('Order Notes');
		formValues.orderNotes.count = +(await this.page
			.getByTestId('visit-section-Order Notes')
			.locator('p')
			.first()
			.textContent());

		const noteCardCount = +formValues.orderNotes.count;
		console.log('noteCardCount', noteCardCount);
		for (let i = 0; i < noteCardCount; i++) {
			const noteCard = await this.noteCards().nth(i);
			formValues.orderNotes[`note${i}Header`] = await this.page
				.getByText('Order Notes')
				.nth(i + 1)
				.textContent();
			formValues.orderNotes[`note${i}Content`] = await this.page
				.locator('textarea[placeholder="Add a Note"]')
				.first()
				.inputValue();
			formValues.orderNotes[`note${i}CreatedBy`] = await noteCard
				.locator('p')
				.filter({ hasText: 'Created by' })
				.locator('b')
				.textContent();
			formValues.orderNotes[`note${i}CreatedDate`] = await noteCard
				.locator('p', { hasText: 'Created by' })
				.locator('xpath=following-sibling::p[1]')
				.textContent();
		}

		return formValues.orderNotes;
	}

	// Helper method to handle reassign order dialog
	async confirmReassignOrder() {
		await this.getReassignOrderProceedButton().click();
		// Wait for dialog to close
		await this.getReassignOrderDialog().waitFor({ state: 'hidden' });
	}

	async cancelReassignOrder() {
		await this.getReassignOrderCancelButton().click();
		// Wait for dialog to close
		await this.getReassignOrderDialog().waitFor({ state: 'hidden' });
	}

	async getStudyCountValue() {
		const countElement = this.getStudyCount();
		await countElement.waitFor({ state: 'visible' });
		const count = await countElement.textContent();
		return parseInt(count, 10);
	}

	async searchAndSelectStudy(studyCode = 'test') {
		const oldCount = await this.getStudyCountValue();
		await this.getAddStudyIcon().click();
		await this.page.route('**/StudyType?*', async route => {
			route.continue();
		});
		await this.page.route('**/ImagingStudy?*', async route => {
			route.continue();
		});
		const searchInput = this.getStudySearchInput();
		await searchInput.click();
		await Promise.all([
			searchInput.pressSequentially(studyCode, { delay: 300 }),
			this.apiWaitUtils.waitForAPI('/StudyType?', 'GET'),
		]);

		// Wait for autocomplete dropdown
		const dropdown = this.page.locator('.MuiAutocomplete-paper');
		await dropdown.waitFor({ state: 'visible' });
		// Wait for and click the first option
		await this.page.getByRole('option').first().click();

		const [, studyResponse] = await Promise.all([
			this.getStudySaveButton().click(),
			this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy?', 'POST'),
		]);
		const newCount = await this.getStudyCountValue();
		expect(newCount).toBe(oldCount + 1);
		return studyResponse;
	}

	async selectFirstDataGridRow() {
		// Wait for grid to be visible
		const grid = this.page.getByRole('grid');
		await grid.waitFor({ state: 'visible' });

		// Get first row
		const firstRow = this.page.getByRole('row').nth(1); // nth(1) because nth(0) is header
		await firstRow.click();
	}

	async searchAndChangePatient(patientName = 'test') {
		await this.getChangePatientButton().click();
		await this.page.route('**/Patient/elk?*', async route => {
			route.continue();
		});
		await this.page.route('**/ServiceRequest/changeServiceRequestPatient?*', async route => {
			route.continue();
		});
		//await this.getPatientNameField().click();
		const searchField = this.getPatientNameInput();
		await searchField.click();
		await Promise.all([
			searchField.pressSequentially(patientName, { delay: 300 }),
			this.apiWaitUtils.waitForAPI('/Patient/elk?', 'GET'),
		]);

		// Select first row instead of specific cell
		await this.detailedTablePopper.clickFirstRow();

		await this.getReassignOrderSaveButton().click();
		// Verify dialog is visible
		await expect(this.getReassignOrderDialog()).toBeVisible();
		const [, response] = await Promise.all([
			this.confirmReassignOrder(),
			this.apiWaitUtils.waitForAPI('/fhir/ServiceRequest/changeServiceRequestPatient?', 'PUT'),
		]);

		// Verify dialog is closed
		await expect(this.getReassignOrderDialog()).not.toBeVisible();
		return response;
	}

	// Helper method to add referring physician
	async searchAndSelectReferringPhysician() {
		// Click to open autocomplete
		const field = this.getReferringPhysicianField();
		await field.click();

		await this.detailedTablePopper.getAddNewButton().byLabel.click();
		await this.referringPhysicianPage.saveReferringPhysicianForm();
	}

	// Helper method to clear referring physician
	async clearReferringPhysician() {
		const clearButton = this.getReferringPhysicianClearButton();
		await clearButton.click();
	}

	// Helper method to open referring physician dropdown
	async openReferringPhysicianDropdown() {
		const dropdownButton = this.getReferringPhysicianDropdownButton();
		await dropdownButton.click();
	}

	async openOrderDetailsPageByURL(orderId) {
		await this.page.route('**/fhir/order/*', route => route.continue());

		const currentUrl = this.page.url();
		const newUrl = new URL(currentUrl);
		newUrl.pathname = `/order/${orderId}`;
		await Promise.all([this.page.goto(newUrl.toString())]);

		await this.getStudyCountValue().waitFor({ state: 'visible' });
	}

	async openOrderDetailsAndWaitForAPI(orderId, apiUrl) {
		await this.page.route('**/fhir/order/*', route => route.continue());

		const currentUrl = this.page.url();
		const newUrl = new URL(currentUrl);
		newUrl.pathname = `/order/${orderId}`;
		const response = await Promise.all([
			this.page.goto(newUrl.toString()),
			this.apiWaitUtils.waitForAPI(apiUrl, 'GET'),
		]);

		return response[1];
	}

	async getServiceRequestWithWaitForAPI(apiUrl, method = 'GET') {
		if (method === 'GET') {
			await this.page.route(`**/ServiceRequest?*`, async route => {
				route.continue();
			});
		}
		const response = await this.apiWaitUtils.waitForAPI(apiUrl, method);

		return response;
	}

	async saveOrderDetails() {
		await this.page.route('**/ServiceRequest**', async route => {
			route.continue();
		});
		const [, serviceRequestResponse] = await Promise.all([
			this.getOrderDrawerSaveBtn().click(),
			this.apiWaitUtils.waitForAPI('/fhir/ServiceRequest/', 'PUT'),
		]);
		return serviceRequestResponse;
	}

	async getOrderDetailsFromPage() {
		let orderDetails = {
			accessionNumber: '',
			orderedDate: '',
			requestedDate: '',
			priority: '',
			status: '',
			fillerOrderNum: '',
			placedOrderNum: '',
			referringPhysician: '',
			referringOrganization: '',
			consultingPhysician: '',
		};

		orderDetails.accessionNumber = await this.getAccessionNumber();
		orderDetails.orderedDate = await this.getOrderDateTime();
		orderDetails.requestedDate = await this.getRequestedAppointmentDateTime();
		orderDetails.priority = await this.getPriority();
		orderDetails.status = await this.getStatus();
		orderDetails.fillerOrderNum = await this.getFillerOrderNum();
		orderDetails.placedOrderNum = await this.getPlacerOrderNumber();
		orderDetails.referringPhysician = await this.getReferringPhysician();
		orderDetails.referringOrganization = await this.getReferringOrganization();
		orderDetails.consultingPhysician = await this.getConsultingPhysician();

		return orderDetails;
	}

	//#region Study section
	studyRow(studyDescription) {
		return this.page.getByTestId(`visit-section-${studyDescription}`);
	}
	//#endregion Study section

	async openOrderInfoPageByUrl(orderId) {
		const url = `${playwrightConfig.logInOaiUrl}order/${orderId}`;

		await this.page.route('**/fhir/ServiceRequest/*', route => route.continue());
		await this.page.route('**/fhir/Encounter/*', route => route.continue());
		await this.page.route('**/fhir/WorkflowStep/*', route => route.continue());
		await this.page.route('**/fhir/Patient/*', route => route.continue());
		await this.page.route('**/fhir/DocumentReference/*', route => route.continue());
		await this.page.route('**/fhir/Observation/*', route => route.continue());

		await Promise.all([
			this.page.goto(url),
			this.apiWaitUtils.waitForAPI('/fhir/ServiceRequest', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/Encounter', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/WorkflowStep', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/Patient', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/DocumentReference', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/Observation', 'GET'),
		]);
	}

	async openStudyInfoPage(studyId, studyDescription) {
		const studyInfoPage = new StudyInfoPage(this.page);

		await this.page.route('**/fhir/ImagingStudy/*', route => route.continue());

		await Promise.all([
			this.studyRow(studyDescription).click(),
			this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy', 'GET'),
		]);

		await studyInfoPage.waitForLoadingStudyInfoPageComplete(studyId);
	}
}

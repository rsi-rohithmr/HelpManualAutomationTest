const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
const { TIMEOUT_IN_MSEC1 } = require('../timeouts');

import { ApiWaitUtils } from '../apiWaitUtils';
import { PageHelper } from '../utils/pageHelper';

export class OrganizationOrderSet {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.pageHelper = new PageHelper(this.page);
	}

	//#region Order Set list view
	addOrderSetIcon() {
		return this.page.getByRole('button', { name: 'Add OrderSet Code' });
	}

	orderSetTitle() {
		return this.page.getByTestId('layout-main-content').getByText('Order Sets', { exact: true });
	}

	orderSetCodeColHeader() {
		return this.page.getByRole('columnheader', { name: 'Order Set Code' }).getByPlaceholder('Search');
	}

	orderSetDescriptionColHeader() {
		return this.page.getByRole('columnheader', { name: 'Description' }).getByPlaceholder('Search');
	}

	orderSetModalityColHeader() {
		return this.page.getByRole('columnheader', { name: 'Modality' }).getByPlaceholder('Search');
	}

	orderSetBodyPartsColHeader() {
		return this.page.getByRole('columnheader', { name: 'Body Part' }).getByPlaceholder('Search');
	}

	orderSetDurationColHeader() {
		return this.page.getByRole('columnheader', { name: 'Duration' }).getByPlaceholder('Search');
	}

	previewIcon() {
		return this.page.getByTestId('preview-tooltip');
	}

	orderSetCode0() {
		return this.page.getByTestId('study-status-cell-0_code');
	}

	orderSetDesc0() {
		return this.page.getByTestId('study-status-cell-0_description');
	}

	orderSetModality0() {
		return this.page.getByTestId('study-status-cell-0_modalityCode');
	}

	orderSetBodyParts0() {
		return this.page.getByTestId('study-status-cell-0_bodyPart');
	}

	orderSetDuration0() {
		return this.page.getByTestId('study-status-cell-0_duration');
	}

	editIcon() {
		return this.page.getByTestId('edit-tooltip');
	}

	deleteIcon() {
		return this.page.getByTestId('hold-to-delete-tooltip');
	}

	firstRowDeleteIcon() {
	return this.page.getByTestId('hold-to-delete-tooltip').first();
	}

	deletePopupHeaderText() {
		return this.page.getByText('Deletion of the Order Set');
	}

	deletePopUpProceedButton() {
		return this.page.getByRole('button', { name: 'Proceed' });
	}

	deletePopUpCancelButton() {
		return this.page.getByRole('button', { name: 'Cancel' });
	}

	row0() {
		return this.page.getByTestId('study-status-row-0');
	}

	deleteRow0() {
		return this.page.getByTestId('hold-to-delete-tooltip');
	}

	//#endregion Financial Type list view

	//#region Financial Type form
	activeBtn() {
		return this.page.getByRole('button', { name: 'ACTIVE' }).nth(1);
	}

	inactiveBtn() {
		return this.page.getByRole('button', { name: 'INACTIVE' }).nth(1);
	}

	//# Order set form fields

	procedureCodeCombobox() {
		return this.page.getByRole('combobox', { name: 'Enter procedure code' });
	}

	procedureCodeFormBox() {
		return this.page.getByTestId('procedure-code-form-box');
	}

	procedureCodeDuration() {
		return this.procedureCodeFormBox().getByRole('textbox', { name: 'Duration' });
	}

	quantityTextbox() {
		return this.page.getByRole('textbox', { name: 'Quantity' });
	}

	saveProcedureIconBtn() {
		return this.page.getByTestId('save-icon-button');
	}

	orderSetCodeField() {
		return this.page.getByTestId('form-field-orderSetCode').getByRole('textbox', { name: 'Order Set Code' });
	}

	descriptionField() {
		return this.page.getByTestId('form-field-description').getByRole('textbox', { name: 'Description' });
	}

	modalityField() {
		return this.page.getByTestId('form-field-modality').getByRole('button', { name: 'Modality' });
	}

	bodyPartField() {
		return this.page.locator('[id="form-field-Body Part"]');
	}

	backdrop() {
		return this.page.locator('.MuiBackdrop-root');
	}

	advancedToggle() {
		return this.page.getByTestId('toggle-advanced-section');
	}

	lateralityField() {
		return this.page.getByRole('button', { name: 'Laterality' });
	}

	typeOfViewField() {
		return this.page.locator('[id="form-field-Type of View"]');
	}

	anatomicField() {
		return this.page.getByRole('button', { name: 'Anatomic' });
	}

	techniqueField() {
		return this.page.getByRole('button', { name: 'Technique' });
	}

	preparationField() {
		return this.page.getByRole('textbox', { name: 'Preparation (Minutes)' });
	}

	recoveryField() {
		return this.page.getByRole('textbox', { name: 'Recovery (Minutes)' });
	}

	saveBtn() {
		return this.page.getByTestId('SAVE_');
	}

	updateBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}

	orderSetRow0() {
		return this.page.getByTestId('study-status-cell-0_code');
	}

	editIconRow0() {
		return this.page.getByTestId('study-status-cell-0_icons').getByTestId('edit-tooltip');
	}

	procedureCodeTxt() {
		// Locate span with label 'PROCEDURE CODE' then get the following span with the value
		return this.page.locator('span.MuiTypography-root:has-text("PROCEDURE CODE") + span.MuiTypography-root');
	}

	procedureDescriptionTxt() {
		return this.page.locator('span.MuiTypography-root:has-text("DESCRIPTION") + span.MuiTypography-root');
	}

	modifiersContainer() {
		// Modifiers are inside div following the label span "MODIFIERS"
		return this.page.locator('span.MuiTypography-root:has-text("MODIFIERS") + div > p.MuiTypography-root');
	}

	durationTxt() {
		return this.page.locator('span.MuiTypography-root:has-text("DURATION") + span.MuiTypography-root');
	}

	quantityTxt() {
		return this.page.locator('span.MuiTypography-root:has-text("QUANTITY") + span.MuiTypography-root');
	}

	durationInput() {
		return this.page.locator('[data-testid="form-field-duration"] input[name="duration"]');
	}

	orderSetCodeInput() {
		return this.page.locator('[data-testid="form-field-orderSetCode"] input[name="orderSetCode"]');
	}

	descriptionInput() {
		return this.page.locator('[data-testid="form-field-description"] input[name="description"]');
	}

	modalitySelect() {
		return this.page.locator('[data-testid="form-field-modality"] div[role="button"]');
	}

	bodyPartSelect() {
		return this.page.locator('[data-testid="form-field-bodyPart"] div[role="button"]');
	}

	lateralitySelect() {
		return this.page.locator('[data-testid="form-field-laterality"] div[role="button"]');
	}

	viewSelect() {
		return this.page.locator('[data-testid="form-field-view"] div[role="button"]');
	}

	anatomicFocusSelect() {
		return this.page.locator('[data-testid="form-field-anatomicFocus"] div[role="button"]');
	}

	techniqueSelect() {
		return this.page.locator('[data-testid="form-field-technique"] div[role="button"]');
	}

	preparationDurationInput() {
		return this.page.locator('[data-testid="form-field-preparationDuration"] input[name="preparationDuration"]');
	}

	recoveryDurationInput() {
		return this.page.locator('[data-testid="form-field-recoveryDuration"] input[name="recoveryDuration"]');
	}

	selectedStatusBtn() {
		return this.page.getByTestId('form-content-section').locator('button[aria-pressed="true"]');
	}

	async getPayerStatus() {
		const selectedButtonText = await this.selectedStatusBtn().innerText();
		let status = 'unknown';
		if (selectedButtonText === 'ACTIVE') {
			status = true;
		}
		if (selectedButtonText === 'INACTIVE') {
			status = false;
		}

		return status;
	}

	async selectMultipleDropdownOptions(label, options) {
		await this.page.getByLabel(label).click();

		await Promise.all(options.map(option => this.page.getByRole('option', { name: option }).click()));

		await this.closeDropdown();
	}

	async inputFormValues(formValues, isUpdate = false) {
		if (!isUpdate) {
			await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
				null,
				await this.procedureCodeCombobox(),
				`${formValues['Procedure Code']}`,
				formValues['Procedure Code'],
				false
			);

			await this.pageHelper.inputValueForTextField(null, await this.procedureCodeDuration(), formValues.Duration);
			await this.pageHelper.inputValueForTextField(null, await this.quantityTextbox(), formValues.Quantity);
			await this.saveProcedureIconBtn().click();
		}
		const existingStatus = await this.getPayerStatus();
		const selectedButtonText = await this.selectedStatusBtn().innerText();
		if (existingStatus !== formValues?.Active) {
			if (formValues?.Active && selectedButtonText === 'INACTIVE') {
				await this.activeBtn().click();
			} else if (!formValues?.Active && selectedButtonText === 'ACTIVE') {
				await this.inactiveBtn().click();
			}
		}

		await this.pageHelper.inputValueForTextField(
			null,
			await this.orderSetCodeField(),
			formValues['Order Set Code']
		);
		await this.pageHelper.inputValueForTextField(null, await this.descriptionField(), formValues.Description);
		await this.pageHelper.selectOptionFromCombo(null, await this.modalityField(), formValues.Modality);
		if (!isUpdate) {
			await this.pageHelper.selectOptionFromCombo(
				null,
				await this.bodyPartField(),
				formValues['Body Part'],
				true
			);
		}

		await this.advancedToggle().click();

		await this.pageHelper.selectOptionFromCombo(null, await this.lateralityField(), formValues.Laterality);
		if (!isUpdate) {
			await this.pageHelper.selectOptionFromCombo(
				null,
				await this.typeOfViewField(),
				formValues['Type Of View'],
				true
			);
			await this.pageHelper.selectOptionFromCombo(null, await this.anatomicField(), formValues.Anatomic, true);
		}
		await this.pageHelper.selectOptionFromCombo(null, await this.techniqueField(), formValues.Technique);

		await this.pageHelper.inputValueForTextField(
			null,
			await this.preparationField(),
			formValues['Preparation (Minutes)']
		);
		await this.pageHelper.inputValueForTextField(
			null,
			await this.recoveryField(),
			formValues['Recovery (Minutes)']
		);
	}

	async openEditOrderSetForm() {
		// Hover and click Edit
		await this.page.route('/fhir/ValueSet**', route => route.continue());
		await this.orderSetRow0().hover();
		await this.page.route('/fhir/orderset/', route => route.continue());
		await this.editIconRow0().click();
		expect(await this.updateBtn()).toBeEnabled({ timeout: TIMEOUT_IN_MSEC1 });
	}

	async updateOrderSet(newOrderSetDetails) {
		await this.inputFormValues(newOrderSetDetails, true);

		await this.page.route('/fhir/StudyType', route => route.continue());

		const [response] = await Promise.all([
			this.page.waitForResponse(res => res.url().includes('/fhir/StudyType') && res.request().method() === 'PUT'),
			this.updateBtn().click(),
		]);

		if (response.status() === 409) {
			await expect(
				this.page.getByText(
					'Order Set update failed because of duplicate value. Please try again with different value'
				)
			).toBeVisible();
			console.warn('Duplicate order set update detected.');
		} else {
			await expect(this.page.getByText('Order Set updated successfully')).toBeVisible();
		}
	}

	async addOrderSet(formValues) {
		await this.page.route('/fhir/ValueSet**', route => route.continue());
		await this.addOrderSetIcon().click();
		await this.inputFormValues(formValues);
		await this.page.route('/fhir/StudyType', route => route.continue());

		const [response] = await Promise.all([
			this.page.waitForResponse(
				res => res.url().includes('/fhir/StudyType') && res.request().method() === 'POST'
			),
			this.saveBtn().click(),
		]);

		if (response.status() === 409) {
			await expect(
				this.page.getByText(
					'New Order Set creation failed because of duplicate value. Please try again with different value'
				)
			).toBeVisible();
			console.warn('Duplicate order set detected.');
		} else {
			await expect(this.page.getByText('New Order Set created successfully')).toBeVisible();
		}
	}

	async addPayer(formValues, addNewBtnFromCoverageForm) {
		await this.openNewPayerForm(addNewBtnFromCoverageForm);
		await this.inputFormValues(formValues);
		await this.page.route('/fhir/organization', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/organization', 'POST')]);
		await expect(this.page.getByText('New Payer record created successfully')).toBeVisible();
	}

	//#end region Order Set form

	async selectFirstOption() {
		// Wait for dropdown and select first option
		await this.page.waitForSelector('[role="listbox"]');
		const firstOption = await this.page.locator('.MuiAutocomplete-option').first();
		await firstOption.click();
	}

	//#endregion Order sets
	//#region Functions
	async openOrganizationRisOrderSetPage(organizationId) {
		const url = `${playwrightConfig.logInOaiUrl}organization/${
			organizationId ?? playwrightConfig.managingOrg.organizationId
		}/ris/order-sets`;

		await this.page.route('/fhir/StudyType', route => route.continue());
		await Promise.all([this.page.goto(url), this.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET')]);

		await this.orderSetTitle().waitFor({ state: 'visible' });
	}

	async getRowValues(rowIndex) {
		// Wait for row to be visible
		const row = await this.page.waitForSelector(`[data-testid="study-status-row-${rowIndex}"]`);

		// Get all cells in the row
		const cells = await this.page.locator(`[data-testid^="study-status-cell-${rowIndex}_"]`).all();

		const rowData = {};

		// Get all cells except the last one (excluding actions column)
		const cellsToProcess = cells.slice(0, -1);

		for (const cell of cellsToProcess) {
			// Get the cell's test ID to extract the column name
			const testId = await cell.getAttribute('data-testid');
			const columnId = testId.split(`${rowIndex}_`)[1];

			// Get the text content, handling special cases
			let value;
			if (columnId === 'isActive') {
				// Check if active indicator exists
				const activeIndicator = await cell.locator('[data-testid="active-indicator"]').count();
				value = activeIndicator > 0;
			} else {
				// Get text content for regular cells
				value = await cell.locator('p').innerText();
			}

			rowData[columnId] = value;
		}

		return rowData;
	}

	async getSpecificRowValues(rowIndex, columnIds) {
		const allValues = await this.getRowValues(rowIndex);
		return Object.fromEntries(Object.entries(allValues).filter(([key]) => columnIds.includes(key)));
	}

	async getFormValues() {
		const formValues = {};

		formValues['Procedure Code'] = (await this.procedureCodeTxt().textContent())?.trim();
		formValues['Procedure Description'] = (await this.procedureDescriptionTxt().textContent())?.trim();

		// Modifiers: gather all modifier texts as array
		formValues.Modifiers = await this.modifiersContainer().allTextContents();

		formValues.Duration = (await this.durationTxt().textContent())?.trim();
		formValues.Quantity = (await this.quantityTxt().textContent())?.trim();
		formValues.Active = await this.getPayerStatus();
		formValues['Order Set Code'] = await this.orderSetCodeInput().inputValue();
		formValues.Description = await this.descriptionInput().inputValue();
		formValues['Duration (Minutes)'] = await this.durationInput().inputValue();

		// For selects, get the visible selected text inside the div role="button"
		formValues['Body Part'] = await this.bodyPartSelect().innerText();
		formValues.Modality = await this.modalitySelect().innerText();
		await this.advancedToggle().click();

		formValues.Laterality = await this.lateralitySelect().innerText();
		formValues['Type Of View'] = await this.viewSelect().innerText();
		formValues.Anatomic = await this.anatomicFocusSelect().innerText();
		formValues.Technique = await this.techniqueSelect().innerText();

		formValues['Preparation (Minutes)'] = await this.preparationDurationInput().inputValue();
		formValues['Recovery (Minutes)'] = await this.recoveryDurationInput().inputValue();

		return formValues;
	}

	//#endregion Functions
}

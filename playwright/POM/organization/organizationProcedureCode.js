const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
import { ApiWaitUtils } from '../apiWaitUtils';

export class OrganizationProcedureCode {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Procedure Code list view
	addProcedureCodeIcon() {
		return this.page.getByLabel('Add Procedure code');
	}

	activeColHeader() {
		return this.page.getByLabel('Active');
	}

	activeOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	procedureCodeColHeader() {
		return this.page.getByRole('columnheader', { name: 'Procedure Code' }).getByPlaceholder('Search');
	}

	descriptionColHeader() {
		return this.page.getByRole('columnheader', { name: 'Description' }).getByPlaceholder('Search');
	}

	rvuTechnicalColHeader() {
		return this.page.getByRole('columnheader', { name: 'RVU Technical' }).getByPlaceholder('Search');
	}

	rvuProfessionalColHeader() {
		return this.page.getByRole('columnheader', { name: 'RVU Professional' }).getByPlaceholder('Search');
	}

	billableCheckboxColHeader() {
		return this.page.getByLabel('Billable');
	}

	billableOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	priorAuthorizationColHeader() {
		return this.page.getByLabel('Prior Authorization');
	}

	priorAuthorizationOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	procedureCodeRow0() {
		return this.page.getByTestId('study-status-cell-0_code').locator('p');
	}

	editIcon() {
		return this.page.getByTestId('edit-tooltip');
	}

	deleteIcon(rowNum) {
		return this.page.getByTestId(`study-status-cell-${rowNum}_icons`).getByTestId('hold-to-delete-tooltip');
	}
	//#endregion Procedure Code list view

	//#region Procedure Code form
	activeBtn() {
		return this.page.getByRole('button', { name: 'ACTIVE' }).nth(1);
	}

	inactiveBtn() {
		return this.page.getByRole('button', { name: 'INACTIVE' }).nth(1);
	}

	procedureCodeCombo() {
		return this.page.getByTestId('autocomplete-field-Procedure Code').getByLabel('Procedure Code');
	}

	descriptionTxt() {
		return this.page.getByTestId('form-field-procedure-code-description');
	}

	rvuTechnicalTxt() {
		return this.page.getByTestId('form-field-rvuTechnical');
	}

	rvuProfessionalTxt() {
		return this.page.getByTestId('form-field-rvuProfessional');
	}

	billableCheckbox() {
		return this.page.getByTestId('form-field-billable').getByLabel('Billable');
	}

	priorAuthorizationCheckbox() {
		return this.page.getByTestId('form-field-priorAuthorization').getByLabel('Prior Authorization');
	}

	createBtn() {
		return this.page.getByTestId('save-btn').getByTestId('CREATE_');
	}

	updateBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Procedure Code form

	//#region Functions
	async openOrganizationRisProcedureCodePage() {
		const url = `${playwrightConfig.baseURL}organization/${playwrightConfig.managingOrg.organizationId}/ris/procedure`;

		await this.page.goto(url);

		await Promise.all([this.page.goto(url.toString()), this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'GET')]);
		await this.addProcedureCodeIcon().waitFor({ state: 'visible' });
	}

	async inputFormData(newData, oldData) {
		if (!newData?.active) {
			await this.activeBtn().click();
		}
		// In case of edit, select the value and type, so it delete the old value
		if (newData?.procedureCode && newData?.procedureCode) {
			await this.procedureCodeCombo().dblclick();
		}
		await this.procedureCodeCombo().pressSequentially(newData?.procedureCode, { delay: 500 });
		await this.page.waitForTimeout(5000); // Need this explicit to workaround the debounceDelayTime on FormAPIAutocompleteVariant component
		await this.descriptionTxt().fill(newData?.description);
		await this.rvuTechnicalTxt().fill(newData?.rvuTechnical);
		await this.rvuProfessionalTxt().fill(newData?.rvuProfessional);
		if (!newData?.billable && oldData?.billable) {
			await this.billableCheckbox().uncheck();
		} else if (newData?.billable && !oldData?.billable) {
			await this.billableCheckbox().check();
		}
		if (!newData?.priorAuthorization && oldData?.priorAuthorization) {
			await this.priorAuthorizationCheckbox().uncheck();
		} else if (newData?.priorAuthorization && !oldData?.priorAuthorization) {
			await this.priorAuthorizationCheckbox().check();
		}
	}

	async addProcedureCode(data) {
		await this.addProcedureCodeIcon().click();

		// Input form data
		await this.inputFormData(data);

		await this.createBtn().click();
		await this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'POST');
		await expect(this.page.getByText(data?.procedureCode)).toBeVisible();
	}

	async editProcedureCode(newData, oldData) {
		// Filter the existing procedure code
		await this.procedureCodeColHeader().pressSequentially(oldData?.procedureCode, { delay: 100 });
		await this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'GET');
		await expect(this.procedureCodeRow0()).toContainText(oldData?.procedureCode);

		// Hover on the row and click Edit icon
		await this.procedureCodeRow0().hover();
		await this.editIcon().click();
		expect(this.updateBtn()).toBeEnabled();

		// Input form data
		await this.inputFormData(newData, oldData);

		// Click Update button
		await this.updateBtn().click();
		await this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'PUT');
		await expect(this.page.getByText('Procedure Code updated')).toBeVisible();
	}

	async waitForApiComplete(urlPattern, methodName, waitTimeInMs) {
		await this.apiWaitUtils.waitForAPI(urlPattern, methodName, waitTimeInMs);
	}
	//#endregion Functions
}

const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
import { ApiWaitUtils } from '../apiWaitUtils';

export class OrganizationFinancialType {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	//#region Financial Type list view
	addFinancialTypeIcon() {
		return this.page.getByLabel('Add Financial Type');
	}

	codeColHeader() {
		return this.page.getByRole('columnheader', { name: 'Code' }).getByPlaceholder('Search');
	}

	financialTypeNameColHeader() {
		return this.page.getByRole('columnheader', { name: 'Financial Type Name' }).getByPlaceholder('Search');
	}

	financialTypeRow0() {
		return this.page.getByTestId('study-status-cell-0_code');
	}

	editIcon() {
		return this.page.getByTestId('edit-tooltip');
	}

	deleteIcon() {
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

	codeTxt() {
		return this.page.getByTestId('form-field-code');
	}

	financialTypeNameTxt() {
		return this.page.getByTestId('form-field-name');
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
	//#endregion Financial Type form

	//#region Functions
	async openOrganizationRisFinancialTypePage() {
		const url = `${playwrightConfig.baseURL}organization/${playwrightConfig.managingOrg.organizationId}/ris/financial-type`;

		await this.page.route('/fhir/financialType', route => route.continue());
		await Promise.all([this.page.goto(url), this.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET')]);

		await this.addFinancialTypeIcon().waitFor({ state: 'visible' });
	}

	async addFinancialType(data) {
		await this.addFinancialTypeIcon().click();

		await this.codeTxt().pressSequentially(data?.code, { delay: 200 });
		await this.financialTypeNameTxt().pressSequentially(data?.name, { delay: 200 });
		await this.page.route('/fhir/financialType', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/financialType', 'POST')]);
		await expect(this.page.getByText('New Financial Type record created successfully')).toBeVisible();
	}

	async updateFinancialType(newData, oldData) {
		// Filter the existing Financial Type
		await this.codeColHeader().pressSequentially(oldData?.code, { delay: 200 });
		await this.financialTypeNameColHeader().pressSequentially(oldData?.name, { delay: 200 });
		await expect(this.financialTypeRow0()).toContainText(oldData?.code);

		// Hover on the row and click Edit icon
		await this.financialTypeRow0().hover();
		await this.page.route('/fhir/financialType', route => route.continue());
		await Promise.all([this.editIcon().click(), this.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET')]);
		expect(this.updateBtn()).toBeEnabled();

		await this.codeTxt().click(); // add this step to make ctrl + A is stable
		await this.codeTxt().press('ControlOrMeta+a');
		await this.codeTxt().press('Backspace');
		await this.codeTxt().pressSequentially(newData?.code, { delay: 200 });
		await this.financialTypeNameTxt().press('ControlOrMeta+a');
		await this.financialTypeNameTxt().press('Backspace');
		await this.financialTypeNameTxt().pressSequentially(newData?.name, { delay: 200 });

		// Click Update button
		await this.page.route('/fhir/financialType', route => route.continue());
		await Promise.all([this.updateBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/financialType', 'PUT')]);
		await expect(this.page.getByText('Financial Type record updated successfully')).toBeVisible();
	}
	//#endregion Functions
}

import cloneDeep from 'lodash/cloneDeep';
const playwrightConfig = require('../../../playwright.config');
const { expect } = require('@playwright/test');
const { TIMEOUT_IN_MSEC1 } = require('../timeouts');
import { payerDO } from 'playwright/dataObjects/payerDO';
import { ApiWaitUtils } from '../apiWaitUtils';
import { PageHelper } from '../utils/pageHelper';

export class OrganizationPayer {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.pageHelper = new PageHelper(this.page);
	}

	//#region Payer list view
	addPayerIcon() {
		return this.page.getByLabel('Add Insurance Payer');
	}

	payerNameColHeader() {
		return this.page.locator('#columnheader-payerName input[placeholder="Search"]');
	}

	eligibilityPayerIdColHeader() {
		return this.page.getByRole('columnheader', { name: 'Eligibility Payer ID' }).getByPlaceholder('Search');
	}

	payerIdColHeader() {
		return this.page.locator('#columnheader-payerId input[placeholder="Search"]');
	}

	payerTypeColHeader() {
		return this.page.getByLabel('Payer Type');
	}

	dropdownOption(option) {
		return this.page.getByRole('option', { name: option });
	}

	financialTypeColHeader() {
		return this.page.getByLabel('Financial Type');
	}

	payerNameRow0() {
		return this.page.getByTestId('study-status-cell-0_payerName');
	}

	editIcon() {
		return this.page.getByTestId('edit-tooltip');
	}

	deleteIcon() {
		return this.page.getByTestId('hold-to-delete-tooltip');
	}
	//#endregion Payer list view

	//#region Payer form
	activeBtn() {
		return this.page.getByRole('button', { name: 'ACTIVE' }).nth(1);
	}

	inactiveBtn() {
		return this.page.getByRole('button', { name: 'INACTIVE' }).nth(1);
	}

	selectedStatusBtn() {
		return this.page.getByTestId('form-content-section').locator('button[aria-pressed="true"]');
	}

	payerNameCombo() {
		return this.page.getByTestId('autocomplete-field-Payer Name').getByLabel('Payer Name');
	}

	payerNameTxt() {
		return this.page.getByTestId('form-field-payer-name');
	}

	comboOption(option) {
		return this.page.getByRole('option', { name: option });
	}

	eligibilityPayerIdCombo() {
		return this.page.getByTestId('autocomplete-field-Eligibility Payer ID').getByLabel('Eligibility Payer ID');
	}

	payerIdTxt() {
		return this.page.getByTestId('form-field-payer-id');
	}

	payerTypeCombo() {
		return this.page.getByTestId('form-content-section').getByRole('button', { name: 'Payer Type' });
	}

	financialTypeCombo() {
		return this.page.getByTestId('form-content-section').getByRole('button', { name: 'Financial Type' });
	}

	addressSearchTxt() {
		return this.page.getByPlaceholder('Enter a location');
	}

	countryTxt() {
		return this.page.getByRole('textbox', { name: 'Country' });
	}

	stateProvinceTxt() {
		return this.page.getByRole('textbox', { name: 'State/Province' });
	}

	zipPostalCodeTxt() {
		return this.page.getByRole('textbox', { name: 'Zip/Postal Code' });
	}

	cityTxt() {
		return this.page.getByRole('textbox', { name: 'City' });
	}

	addressLine1Txt() {
		return this.page.getByRole('textbox', { name: 'Address Line 1' });
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
	//#endregion Payer form

	//#region Functions
	async openOrganizationRisPayerPage(organizationId) {
		const url = `${playwrightConfig.baseURL}organization/${
			organizationId ?? playwrightConfig.managingOrg.organizationId
		}/ris/insurance-payer`;

		await Promise.all([
			this.page.goto(url.toString()),
			this.apiWaitUtils.waitForAPI('/fhir/organization', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET'),
		]);
		await this.addPayerIcon().waitFor({ state: 'visible' });
	}

	async inputFormValues(formValues) {
		const existingStatus = await this.getPayerStatus();
		const selectedButtonText = await this.selectedStatusBtn().innerText();
		if (existingStatus !== formValues?.active) {
			if (formValues?.active && selectedButtonText === 'INACTIVE') {
				await this.activeBtn().click();
			} else if (!formValues?.active && selectedButtonText === 'ACTIVE') {
				await this.inactiveBtn().click();
			}
		}

		await this.pageHelper.inputValueForTextField(null, await this.payerNameTxt(), formValues['Payer Name']);
		await this.pageHelper.inputValueForTextField(null, await this.payerIdTxt(), formValues['Payer ID']);
		await this.pageHelper.selectOptionFromCombo(null, await this.payerTypeCombo(), formValues['Payer Type']);
		await this.pageHelper.selectOptionFromCombo(
			null,
			await this.financialTypeCombo(),
			formValues['Financial Type']
		);

		await this.pageHelper.inputValueForTextField(null, await this.countryTxt(), formValues?.Country);
		await this.pageHelper.inputValueForTextField(null, await this.stateProvinceTxt(), formValues['State/Province']);
		await this.pageHelper.inputValueForTextField(
			null,
			await this.zipPostalCodeTxt(),
			formValues['Zip/Postal Code']
		);
		await this.pageHelper.inputValueForTextField(null, await this.cityTxt(), formValues?.City);
		await this.pageHelper.inputValueForTextField(null, await this.addressLine1Txt(), formValues['Address Line 1']);
	}

	async addPayer(formValues, addNewBtnFromCoverageForm) {
		await this.openNewPayerForm(addNewBtnFromCoverageForm);
		await this.inputFormValues(formValues);
		await this.page.route('/fhir/organization', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/organization', 'POST')]);
		await expect(this.page.getByText('New Payer record created successfully')).toBeVisible();
	}

	async openNewPayerForm(addNewBtnFromCoverageForm) {
		const addNewElement = addNewBtnFromCoverageForm ?? this.addPayerIcon();
		await this.page.route('/fhir/financialType', route => route.continue());
		await Promise.all([addNewElement.click(), this.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET')]);
	}

	async openEditPayerForm(payerName, payerId, skipFilter = false) {
		if (!skipFilter) {
			// Filter the existing payer. Clear the existing filter and set the new payer name
			await this.payerNameColHeader().click();
			await this.payerNameColHeader().press('ControlOrMeta+a');
			await this.payerNameColHeader().fill('');
			await this.payerNameColHeader().pressSequentially(payerName, { delay: 300 });

			await this.payerIdColHeader().click();
			await this.payerIdColHeader().press('ControlOrMeta+a');
			await this.payerIdColHeader().fill('');
			await this.payerIdColHeader().pressSequentially(payerId, { delay: 300 });

			await this.apiWaitUtils.waitForAPI('/fhir/organization', 'GET');
			expect(await this.payerNameRow0()).toContainText(payerName, { timeout: TIMEOUT_IN_MSEC1 });
		}

		// Hover on the row and click Edit icon
		await this.payerNameRow0().hover();
		await this.page.route('/fhir/financialType/', route => route.continue());
		await this.page.route('/fhir/organization/', route => route.continue());
		await Promise.all([
			this.editIcon().click(),
			this.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET'),
			this.apiWaitUtils.waitForAPI('/fhir/organization/', 'GET'),
		]);
		expect(await this.updateBtn()).toBeEnabled({ timeout: TIMEOUT_IN_MSEC1 });
	}

	async updatePayer(newPayerInfo) {
		await this.inputFormValues(newPayerInfo);
		await this.page.route('/fhir/organization/', route => route.continue());
		await Promise.all([this.updateBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/organization/', 'PUT')]);
		await expect(this.page.getByText('Payer record updated successfully')).toBeVisible();
	}

	async waitForApiComplete(urlPattern, methodName, waitTimeInMs) {
		await this.apiWaitUtils.waitForAPI(urlPattern, methodName, waitTimeInMs);
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

	async getFormValues() {
		const formValues = cloneDeep(payerDO);
		formValues.active = await this.getPayerStatus();
		formValues['Payer Name'] = await this.payerNameTxt().inputValue();
		formValues['Payer ID'] = await this.payerIdTxt().inputValue();
		formValues['Payer Type'] = await this.payerTypeCombo().innerText();
		formValues['Financial Type'] = await this.financialTypeCombo().innerText();
		formValues.Country = await this.countryTxt().inputValue();
		formValues['State/Province'] = await this.stateProvinceTxt().inputValue();
		formValues['Zip/Postal Code'] = await this.zipPostalCodeTxt().inputValue();
		formValues.City = await this.cityTxt().inputValue();
		formValues['Address Line 1'] = await this.addressLine1Txt().inputValue();

		return formValues;
	}
	//#endregion Functions
}

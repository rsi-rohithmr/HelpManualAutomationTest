// import { expect } from '@playwright/test';
// import { orgDO } from './organizationDO';

import { OrganizationDirectoryPage } from './organizationDirectoryPage';
const { request, expect } = require('@playwright/test');
const { ApiWaitUtils } = require('./apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
export class OrganizationDetailPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	// #region Organization Details - Navigation bar
	goBackSection() {
		return this.page.locator('[data-cy="gobackSection"]');
	}

	organizationLogo() {
		return this.page.locator('[data-cy="organizationLogoSection"] img');
	}

	organizationNameHeader() {
		return this.page.locator('[data-cy="organizationLogoSection"] p');
	}

	navigationLinks() {
		return this.page.locator('[data-cy="list-item-link"] span');
	}

	generalNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("General")');
	}

	idpNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("IDP")');
	}

	usersNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Users")');
	}

	usersAndRolesNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Users & Roles")');
	}

	rolesNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Roles")');
	}

	healthcareServiceNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Healthcare Service")');
	}

	affiliationsNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Organization Affiliation")');
	}

	studyStatusNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Study Status")');
	}

	workflowAutomationNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Workflow Automation")');
	}

	workflowStepsNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Workflow Steps")');
	}

	workflowConfigNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Workflow Configuration")');
	}

	deviceNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Device")');
	}

	risNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("RIS")');
	}

	procedureNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Procedure")');
	}

	feeScheduleNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Fee Schedule")');
	}

	financialTypeNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Financial Type")');
	}

	insurancePayerNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Insurance Payer")');
	}

	orderSetsNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Order Sets")');
	}

	codeNav() {
		return this.page.locator('[data-cy="list-item-link"] span:text("Code")');
	}
	// #endregion Organization Details - Navigation bar

	// #region Organization Details - General page
	generalMainHeader() {
		return this.page.locator('[data-cy="main-header"] div:text("General")');
	}

	editBtn() {
		return this.page.locator('[data-cy="main-header"] button:text("Edit")');
	}

	organizationNameTxt() {
		return this.page.locator('[id="form-field-Organization Name"]');
	}

	parentOrganizationCombo() {
		return this.page.locator('[id="autocomplete-field-Parent Organization"]');
	}

	organizationTypeCombo() {
		return this.page.locator('[id="form-field-Organization Type"]');
	}

	npiOrganizationIdTxt() {
		return this.page.locator('[id="form-field-NPI/Organization ID"]');
	}

	timeZoneCombo() {
		return this.page.locator('[id="form-field-Time Zone"]');
	}

	corporateWebsiteTxt() {
		return this.page.locator('[id="form-field-Corporate Website"]');
	}

	countryTxt() {
		return this.page.locator('[id="form-field-Country"]');
	}

	stateProvinceTxt() {
		return this.page.locator('[id="form-field-State/Province"]');
	}

	zipPostalCodeTxt() {
		return this.page.locator('[id="form-field-Zip/Postal Code"]');
	}

	cityTxt() {
		return this.page.locator('[id="form-field-City"]');
	}

	addressLine1Txt() {
		return this.page.locator('[id="form-field-Address Line 1"]');
	}

	addressLine2Txt() {
		return this.page.locator('[id="form-field-Address Line 2"]');
	}

	emailTxt() {
		return this.page.locator('[id="form-field-Email"]');
	}

	phoneTxt() {
		return this.page.locator('[id="form-field-Phone"]');
	}

	faxTxt() {
		return this.page.locator('[id="form-field-Fax"]');
	}

	// Organization - Edit page
	saveBtn() {
		return this.page.locator('[data-cy="main-header"] button:text("Save")');
	}

	roleIcon() {
		return this.page.locator('[data-testid="dynamic-btn-Roles"]');
	}

	async setParentOrganization(value) {
		await this.parentOrganizationCombo().type(value);
		await this.page.locator(`#autocomplete-field-Parent Organization-listbox li:has-text("${value}")`).click();
	}

	async setOrganizationType(value) {
		await this.organizationTypeCombo().click();
		await this.page.locator(`li:has-text("${value}")`).click();
	}

	async setTimeZone(value) {
		await this.timeZoneCombo().click();
		await this.page.locator(`li:has-text("${value}")`).click();
	}

	async openOrganizationDetailPage(masterOrg, childOrgLevel1) {
		const orgDirPage = new OrganizationDirectoryPage(this.page);
		await orgDirPage.openOrganizationDirectoryPage();
		await orgDirPage.selectMasterOrganization(masterOrg);
		if (childOrgLevel1) {
			await orgDirPage.selectChildOrganization(childOrgLevel1, 1);
		}
		await orgDirPage.detailsBtn().click();
		await expect(this.organizationNameTxt()).toBeVisible();
	}

	async openOrganizationDetailPageWithoutWait(masterOrg, childOrgLevel1) {
		const orgDirPage = new OrganizationDirectoryPage(this.page);
		await orgDirPage.openOrganizationDirectoryPage();
		await orgDirPage.selectMasterOrganization(masterOrg, false);
		if (childOrgLevel1) {
			await orgDirPage.selectChildOrganization(childOrgLevel1, 1);
		}
		await orgDirPage.detailsBtn().click();
		await expect(this.organizationNameTxt()).toBeVisible();
	}
	async openPageByUrl(orgId) {
		await this.page.goto(`${playwrightConfig.baseURL}organization/${orgId}`);
		await this.apiWaitUtils.waitForAPI('organization', 'GET');
	}
	async AddingEmailAndFax(email, fax) {
		await this.page.getByRole('button', { name: 'Edit' }).click();
		await this.page.getByRole('textbox', { name: 'Address Search' }).fill('131 Continental Drive suite 301, Newark, Delaware 19713, USA');
		await this.apiWaitUtils.waitForAPI('googleapis', 'GET');
		await this.page.getByText('Continental Drive suite 301Newark, Delaware 19713, USA').click();

		if (await this.page.locator('#form-field-Email').count() === 0) {
			await this.page.getByRole('button', { name: 'Add Email' }).click();
			await this.page.locator('#form-field-Email').first().click();
			await this.page.locator('#form-field-Email').fill(email);
		}
		if( await this.page.locator('#form-field-Fax').count() === 0) {
			await this.page.getByRole('button', { name: 'Add Fax' }).click();
			await this.page.locator('#form-field-Fax').first().click();
			await this.page.locator('#form-field-Fax').fill(fax);
		}
		await this.page.getByRole('button', { name: 'Save' }).click();
		await this.apiWaitUtils.waitForAPI('organization', 'PUT');
	}
}

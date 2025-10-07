const { DetailedTablePopper } = require('../../patientInformation/detailedTablePopper');
const { ReferringOrganizationPage } = require('./addNewReferringOrg');
import { ApiWaitUtils } from '../../apiWaitUtils';
const faker = require('community-faker');
import { expect } from '@playwright/test';
import { generateTestEmail } from 'cypress/support/testUtils';
export class ReferringPhysicianPage {
	constructor(page) {
		this.page = page;
		this.referringOrganizationPage = new ReferringOrganizationPage(page);
		this.detailedTablePopper = new DetailedTablePopper(page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	// Field locators moved outside constructor
	getFamilyNameInput() {
		return this.page.locator('input[name="familyName"]');
	}

	getGivenNamesInput() {
		return this.page.locator('input[name="givenNames"]');
	}

	getNamePrefixInput() {
		return this.page.locator('#autocomplete-field-Name\\ Prefix');
	}

	getNameSuffixInput() {
		return this.page.locator('#autocomplete-field-Name\\ Suffix');
	}

	getReferringOrgInput() {
		return this.page.locator('#autocomplete-field-Referring\\ Organization');
	}

	getLoginEmailInput() {
		return this.page.getByLabel('Login Email');
	}

	async fillLoginEmail(email) {
		await this.getLoginEmailInput().fill(email);
	}

	async fillFamilyName(name) {
		await this.getFamilyNameInput().fill(name);
	}

	async fillGivenNames(name) {
		await this.getGivenNamesInput().fill(name);
	}

	async fillNamePrefix(prefix) {
		await this.getNamePrefixInput().fill(prefix);
		await this.page.keyboard.press('Enter');
	}

	async fillNameSuffix(suffix) {
		await this.getNameSuffixInput().fill(suffix);
		await this.page.keyboard.press('Enter');
	}

	async fillReferringOrganization(org) {
		await this.getReferringOrgInput().fill(org);
		await this.page.keyboard.press('Enter');
	}

	async saveReferringPhysicianForm() {
		const physicianData = {
			familyName: faker.name.lastName(),
			givenName: faker.name.firstName(),
			prefix: 'DR',
			suffix: 'MD',
			organization: 'TEST ORGANIZATION',
			loginEmail: generateTestEmail(),
		};
		await this.getReferringOrgInput().click();
		await this.detailedTablePopper.getAddNewButton().byLabel.click();
		const refOrgData = await this.referringOrganizationPage.fillAllFields();
		console.log(refOrgData);
		await this.page.route('**/PractitionerRole**', route => route.continue());

		await this.fillAllFields({
			familyName: physicianData.familyName,
			givenNames: physicianData.givenName,
			namePrefix: physicianData.prefix,
			nameSuffix: physicianData.suffix,
			loginEmail: physicianData.loginEmail,
		});

		// Wait for save operation
		await this.page.getByTestId('panel-wrapper-1').getByTestId('CREATE_').click();
		const successMessage = await this.page.locator('#notistack-snackbar');
		await expect(successMessage).toHaveText('Successfully created new user');
		await expect(successMessage).toBeVisible();
		await expect(successMessage).not.toBeVisible();
		return physicianData;
	}

	async fillAllFields({ familyName, givenNames, namePrefix, nameSuffix, loginEmail, referringOrganization }) {
		await this.fillFamilyName(familyName);
		await this.fillGivenNames(givenNames);
		await this.fillNamePrefix(namePrefix);
		await this.fillNameSuffix(nameSuffix);
		await this.fillLoginEmail(loginEmail);
	}
}

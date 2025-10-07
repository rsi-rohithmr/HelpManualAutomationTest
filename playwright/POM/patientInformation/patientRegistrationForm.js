// PersonForm.js
const { expect } = require('@playwright/test');
const faker = require('community-faker');
const { ApiWaitUtils } = require('../apiWaitUtils');
import { generateTestEmail } from 'cypress/support/testUtils';

export class PatientRegistration {
	constructor(page, coverageInformationPage) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.coverageInformationPage = coverageInformationPage;
	}

	async fillFamilyName(name) {
		await this.page.getByRole('textbox', { name: 'Family (Last) Name' }).fill(name);
	}

	async fillGivenNames(name) {
		await this.page.getByRole('textbox', { name: 'Given (First & Middle) Names' }).fill(name);
	}

	async selectPrefix(value) {
		await this.page.getByRole('combobox', { name: 'Prefix' }).pressSequentially(value, { delay: 500 });
		await this.page.getByRole('option').first().click();
	}

	async selectSuffix(value) {
		await this.page.getByRole('combobox', { name: 'Suffix' }).pressSequentially(value, { delay: 500 });
		await this.page.getByRole('option').first().click();
	}

	async fillEmail(email) {
		await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
	}

	async fillPhone(phone) {
		await this.page.getByRole('textbox', { name: 'Phone' }).fill(phone);
	}

	async fillSSN(ssn) {
		await this.page.getByRole('textbox', { name: 'SSN' }).fill(ssn);
	}

	coverageTabButton(tabIndex) {
		return this.page.locator(`#patient-tab-${tabIndex}`);
	}

	addCoverageButton() {
		return this.page.getByTestId('panel-wrapper-1').getByTestId('share-button');
	}

	async pickBirthDate() {
		// Open date picker
		await this.page.waitForSelector('input[name="birthDate"]', { state: 'visible' });
		await this.page.locator('input[name="birthDate"]').click();

		// Click the calendar year dropdown button to open year view
		await this.page.getByRole('button', { name: 'calendar view is open, switch to year view' }).click();

		// Find the year picker container
		const yearPickerContainer = this.page.locator('.MuiYearPicker-root');
		await yearPickerContainer.waitFor({ state: 'visible' });

		// Find and click Previous period until we find year 2000
		const targetYear = '2000';
		while (true) {
			// Check if target year is visible
			const yearExists = await this.page
				.locator('.PrivatePickersYear-yearButton')
				.filter({ hasText: targetYear })
				.isVisible();

			if (yearExists) {
				// Click the year 2000
				await this.page.locator('.PrivatePickersYear-yearButton').filter({ hasText: targetYear }).click();
				break;
			}

			// Click Previous period button to scroll up
			await this.page.locator('button[title="Previous period"]').click();
			// Small delay to allow transition
			await this.page.waitForTimeout(100);
		}

		// Select day 1
		await this.page.locator('.MuiPickersDay-root').filter({ hasText: '1' }).first().click();
		let isVisible = false;
		try {
			isVisible = await this.page.getByRole('button', { name: 'OK' }).isVisible();
		} catch (error) {
			console.log('OK button not found in the dialog');
			isVisible = false;
		}
		if (isVisible) {
			await this.page.getByRole('button', { name: 'OK' }).click();
		} else {
			// If no OK button, just continue
			await this.page.waitForTimeout(100);
		}
	}

	async expectFamilyNameToBe(value) {
		await expect(this.familyNameInput).toHaveValue(value);
	}

	async expectGivenNamesToBe(value) {
		await expect(this.givenNamesInput).toHaveValue(value);
	}

	// Helper method to generate SSN
	generateSSN() {
		// Generate SSN using faker
		const ssn = faker.helpers.replaceSymbolWithNumber('###-##-####');
		return ssn;
	}

	async savePatientForm(withCoverage) {
		const patientData = {
			familyName: faker.name.lastName(),
			givenName: faker.name.firstName(),
			prefix: 'MR',
			suffix: 'JR',
			email: generateTestEmail(),
			ssn: this.generateSSN(),
			birthDate: '01/01/2000',
		};

		await this.page.route('/fhir/', route => route.continue());
		// fill the form with random data
		await this.fillFamilyName(patientData.familyName);
		await this.fillGivenNames(patientData.givenName);
		await this.selectPrefix(patientData.prefix);
		await this.selectSuffix(patientData.suffix);
		await this.fillEmail(patientData.email);
		//await this.fillPhone(faker.phone.phoneNumber('+12125689742'));
		await this.fillSSN(patientData.ssn);
		await this.pickBirthDate();

		if (withCoverage) {
			await this.coverageTabButton(1).click();
			await this.addCoverageButton().click();
			await this.coverageInformationPage.setCoverageDetailsInformation({}, false);
		}

		// Wait for save operation
		await Promise.all([
			this.page.locator('[data-testid="SAVE_"]').click(),
			this.apiWaitUtils.waitForAPI('/fhir/', 'POST'),
		]);

		return patientData;
	}
}

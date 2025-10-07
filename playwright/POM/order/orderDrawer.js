import { HomePage } from '../homePage/homePage';
const faker = require('community-faker');

export class OrderDrawer {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
	}

	imagingOrganizationInput() {
		return this.page.locator('[id="autocomplete-field-Imaging Organization"]');
	}

	patientInput() {
		return this.page.locator('[id="autocomplete-field-Patient Name"]');
	}

	referringPhysicianInput() {
		return this.page.locator('[id="autocomplete-field-Referring Physician"]');
	}

	referringOrganizationInput() {
		return this.page.locator('[id="form-field-Referring Organization"]');
	}

	studySetsInput() {
		return this.page.locator('[id="autocomplete-field-Study Sets"]');
	}

	createOrderByCreateBtn() {
		return this.page.locator('[data-cy="CREATE_"]');
	}

	createOrderByContinueBtn() {
		return this.page.locator('[data-cy="CONTINUE_"]');
	}

	addNewPatientBtn() {
		return this.page.getByText('ADD NEW', { exact: true });
	}

	autoPopulatePatientName() {
		return this.page.locator('[id="autocomplete-field-Patient Name"]');
	}

	newPatientFirstName() {
		return this.page.locator('[id="form-field-Given\\ \\(First\\ \\&\\ Middle\\)\\ Names"]');
	}

	newPatientLastName() {
		return this.page.locator('[id="form-field-Family\\ \\(Last\\)\\ Name"]');
	}

	newPatientDOB() {
		return this.page.locator('[placeholder="mm/dd/yyyy"]');
	}

	newPatientSex() {
		return this.page.locator('[id="form-field-Sex"]');
	}

	createPatientBtn() {
		return this.page.locator('[data-cy="CREATE_"]').nth(1);
	}

	submitBtn() {
		return this.page.locator('[id="submitFormBtn"]');
	}

	async selectImagingOrganization(orgName) {
		// Clear the input field and type the new value
		await this.imagingOrganizationInput().fill('');
		await this.imagingOrganizationInput().fill(orgName);

		// Select the organization from the dropdown
		await this.page.locator('li', { hasText: orgName }).click();
	}

	async selectReferringPhysician(referringPhysicianName) {
		// Clear the input field and type the new value
		await this.referringPhysicianInput().fill('');
		await this.referringPhysicianInput().fill(referringPhysicianName);

		// Select the organization from the dropdown
		await this.page.locator('li', { hasText: referringPhysicianName }).click();
	}

	async selectReferringOrganization(orgName) {
		await this.referringOrganizationInput().click();

		// Select the organization from the dropdown
		await this.page.locator('li', { hasText: orgName }).click();
	}

	async addPatient() {
		let retries = 0;
		let retriesNewPatient = 0;
		const maxRetries = 5;
		const maxRetriesNewPatient = 5;
		let patientName = '';
		let firstName = '';
		let lastName = '';

		while (retries < maxRetries) {
			while (retriesNewPatient < maxRetriesNewPatient) {
				await this.autoPopulatePatientName().click();
				if (await this.addNewPatientBtn().isVisible()) {
					await this.addNewPatientBtn().click();
					console.log('Add New Patient button is visible');
					retriesNewPatient = maxRetriesNewPatient;
				} else {
					console.log('Add New Patient button is not visible');
					retriesNewPatient++;
				}
			}

			const randomNum = faker.datatype.number({ min: 111111, max: 999999 });
			firstName = 'FirstName' + randomNum;
			lastName = 'LastName' + randomNum;
			const randomDay = faker.datatype.number({ min: 10, max: 30 });
			const randomYear = faker.datatype.number({ min: 1960, max: 2025 });
			const dob = `05/${randomDay}/${randomYear}`;

			await this.newPatientFirstName().fill(firstName);
			await this.newPatientLastName().fill(lastName);
			await this.newPatientDOB().fill(dob);

			await this.createPatientBtn().click();

			await this.page.waitForTimeout(5000);

			patientName = await this.autoPopulatePatientName().inputValue();

			if (patientName !== '') {
				console.log('Patient added successfully: ' + patientName);
				return { firstName, lastName };
			}
			retries++;
			retriesNewPatient = 0;
		}

		throw new Error('Failed to add patient after multiple attempts');
	}

	async addOrderSetCode(studySetName) {
		// Clear the input field and type the new value
		await this.studySetsInput().fill(studySetName);

		// Select the organization from the dropdown
		await this.page.locator('li', { hasText: new RegExp(`^${studySetName}`) }).click();
	}
}

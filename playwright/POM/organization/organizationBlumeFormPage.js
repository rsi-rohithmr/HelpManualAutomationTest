const { expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

class OrganizationBlumeFormPage {
	constructor(page) {
		this.page = page;
	}

	async closeOrganizationBlumeFormPage() {
		await this.page.locator('[data-testid="CloseIcon"]').nth(1).click();
	}

	async unselectOrganization() {
        const orgInput = this.page
            .locator(
                '.MuiOutlinedInput-input.MuiInputBase-input.MuiInputBase-inputAdornedStart.MuiInputBase-inputAdornedEnd.MuiAutocomplete-input.MuiAutocomplete-inputFocused.css-1wxrwr4'
            )
            .nth(5);
        await orgInput.focus();
		const closeIcon = this.page.locator('[data-testid="CloseIcon"]').first();
		await expect(closeIcon).toBeVisible({ timeout: 20000 });
		await closeIcon.click();
	}
	async selectOrganization(orgName) {
		const orgInput = this.page
			.locator(
				'.MuiOutlinedInput-input.MuiInputBase-input.MuiInputBase-inputAdornedStart.MuiInputBase-inputAdornedEnd.MuiAutocomplete-input.MuiAutocomplete-inputFocused.css-1wxrwr4'
			)
			.nth(5);
		await orgInput.focus();
		await orgInput.click({ force: true });
		await orgInput.type(orgName, { delay: 100 });
		await this.page.waitForTimeout(10000);
		await orgInput.press('ArrowDown'); // Use 'ArrowDown' instead
		await orgInput.press('Enter');
	}

	async uploadFiles(filesPath) {
		const input = this.page.locator('[data-testid="upload-pdf-input"]');
		await input.setInputFiles(filesPath);
	}

	addBox() {
		return this.page.locator('[data-testid="add-box"]');
	}

	formTitle() {
		return this.page.locator('[data-cy="header-title"]');
	}

	editTitleBtn() {
		return this.page.locator('[data-testid="EditOutlinedIcon"]');
	}

	inputPdfTitle() {
		return this.page.locator('[data-cy="title-input"] input');
	}

	saveTitleBtn() {
		return this.page.locator('[data-testid="CheckCircleOutlineOutlinedIcon"]');
	}

	publishButton() {
		return this.page.locator('button:has-text("Publish")');
	}

	async selectFormType(formType) {
		await this.page.locator('#formType').click();
		await this.page.locator('li', { hasText: formType }).click();
	}

	async selectCodeType(codeType) {
		await this.page.locator('#codeType').click();
		await this.page.locator('#codeType-option-0').click();
	}

	async selectModality() {
		const codeInput = this.page.locator('#select-code');
		await codeInput.click();
		await codeInput.type('CT');
		await codeInput.press('Enter');
		await this.page.locator('text=CT-Computed Tomography').click();
	}

	async publishForm() {
		const btn = this.page.locator('[data-testid="publish-form"]');
		await expect(btn).not.toBeDisabled();
		await btn.click();
	}

	async openOrganizationBlumeForm(sidebar) {
		await sidebar.menuIcon('apps').click();
		const gearIcon = this.page.getByRole('tooltip', { name: 'Root Blume' }).getByRole('button').nth(2);
		await expect(gearIcon).toBeVisible({ timeout: 10000 });
		await gearIcon.click();
	}

	async createPDFBlumeForm(formType) {
		let randomNum = faker.number.int({ min: 1111111111, max: 9999999999 });
		let formName = `${formType} PDF Form ${randomNum}`;
		await this.addBox().hover();
		await this.uploadFiles('./cypress/fixtures/form/BlumeFormOrder.pdf');
		await this.formTitle().hover();
		await this.page.waitForTimeout(1000);
		await this.editTitleBtn().click({ force: true });
		await this.inputPdfTitle().fill(formName);
		await this.saveTitleBtn().click();
		await this.publishButton().click();
		await this.page.waitForTimeout(1000);
		if (formType.includes('Clinical')) {
			await this.page.locator('#formType').waitFor({ state: 'visible' });
			await this.selectFormType('Clinical Form');
			await this.page.locator('#codeType').waitFor({ state: 'visible' });
			await this.selectCodeType('Modality');
			await this.page.locator('#select-code').waitFor({ state: 'visible' });
			await this.selectModality();
		} else {
			await this.page.locator('#formType').waitFor({ state: 'visible' });
			await this.selectFormType('Registration Form');
		}
		await this.publishForm();
		await this.page.waitForSelector('text=The Form has been published', { timeout: 10000 });
		// Optionally, return some form info if needed
		return { name: formName };
	}
}

module.exports = { OrganizationBlumeFormPage };

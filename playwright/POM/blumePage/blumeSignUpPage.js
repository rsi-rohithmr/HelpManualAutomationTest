import { expect, Page } from '@playwright/test';

export class BlumeSignUpPage {
	/**
	 * @param {Page} page - Playwright page object
	 */
	constructor(page) {
		this.page = page;
		this.selectors = {
			patientGivenName: '#givenName',
			patientFamilyName: '#surname',
			patientDOB: '#datepicker',
			nationalDropdown: '#dropbtn',
			phoneNumberField: '#nationalNumber',
			verifyPhoneNumberBtn: '#phoneVerificationControlSignUp-Optional_but_send_code',
			emailField: '#optionalEmail',
			verifyEmailBtn: '#emailVerificationControlSignUp-Optional_but_send_code',
			newPassword: '#newPassword',
			reenterPassword: '#reenterPassword',
			newRegisterBtn: '#NewRegisterBtn',
			emailVerificationText: '#emailVerificationSuccessText',
			otpContainer: '#otpContainer, #email-mfaPopUp',
			resentOTPOption: '#emailpopUpResendOtpButton',
			emailPopUpVerificationBtn: '#emailpopUpVerifyButton',
			loginLink: '#loginLink',
		};
	}

	async fillGivenName(name) {
		await this.page.locator(this.selectors.patientGivenName).fill(name);
	}

	async fillFamilyName(name) {
		await this.page.locator(this.selectors.patientFamilyName).fill(name);
	}

	async fillDOB(dob) {
		const dobField = this.page.locator(this.selectors.patientDOB);

		// Click to focus and open calendar
		await dobField.click({ force: true });

		// Clear any existing value reliably
		await dobField.fill('');
		await dobField.press('Control+A');
		await dobField.press('Delete');

		// Type the date and press Enter to confirm
		await dobField.type(dob);
		await dobField.press('Enter');

		await this.page.waitForTimeout(2000);
	}

	async selectNationality() {
		await this.page.locator(this.selectors.nationalDropdown).click();
	}

	async fillPhoneNumber(number) {
		await this.page.locator(this.selectors.phoneNumberField).fill(number);
	}

	async verifyPhoneNumber() {
		await this.page.locator(this.selectors.verifyPhoneNumberBtn).click();
	}

	async fillEmail(email) {
		await this.page.locator(this.selectors.emailField).fill(email);
	}

	async verifyEmail() {
		await this.page.locator(this.selectors.verifyEmailBtn).click();
	}

	async fillNewPassword(password) {
		await this.page.locator(this.selectors.newPassword).fill(password);
	}

	async reenterPassword(password) {
		await this.page.locator(this.selectors.reenterPassword).fill(password);
	}

	async clickRegister() {
		await this.page.locator(this.selectors.newRegisterBtn).click();
	}

	async verifyEmailSuccessVisible() {
		await expect(this.page.locator(this.selectors.emailVerificationText)).toBeVisible();
	}

	async waitForOTPContainer() {
		await this.page.locator(this.selectors.otpContainer).waitFor({ state: 'visible' });
	}

	async clickResendOTP() {
		await this.page.locator(this.selectors.resentOTPOption).click();
	}

	async clickVerifyEmailPopup() {
		await this.page.locator(this.selectors.emailPopUpVerificationBtn).click();
	}

	async clickLoginLink() {
		await this.page.locator(this.selectors.loginLink).click();
	}
	
}

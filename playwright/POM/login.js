const playwrightConfig = require('../../playwright.config');
const fs = require('fs');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { expect } = require('@playwright/test');

exports.Login = class Login {
	constructor(page) {
		this.page = page;
	}

	async loginOmegaAI() {
		await this.page.context().clearCookies(); // Clear all cookies
		await this.page.goto(playwrightConfig.logInOaiUrl, { waitUntil: 'load' });

		// Optionally clear sessionStorage and localStorage too
		await this.page.evaluate(() => {
			sessionStorage.clear();
			localStorage.clear();
		});

		// Now login fresh
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async loginOmegaAiwithMicrosoftAccount() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName1);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByRole('textbox', { name: 'Enter the password for' }).fill(playwrightConfig.password1);
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.getByRole('button', { name: 'Yes' }).click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async getAccessTokenForBreezeAccount() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.breezeUser);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByRole('textbox', { name: 'Enter the password for' }).fill(playwrightConfig.breezePassword);
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.getByRole('button', { name: 'Yes' }).click();
		// Wait for the ValueSet API call that includes the Authorization token
		const tokenRequest = await this.page.waitForRequest(
			req => req.url().includes('/fhir/ValueSet') && req.headers()['authorization']
		);
		// Extract Bearer token from Authorization header
		const accessToken = tokenRequest.headers()['authorization'].replace(/^Bearer\s+/i, ''); // e.g., "Bearer eyJ..."
		return accessToken;
	}

	async loginBlume() {
		const featureFlagName = 'sprinter-blume-new-signup';
		let launchDarklyResponse = '';
		await this.page.goto(playwrightConfig.baseBlumeURL);
		// Click the Blume card
		// const blumeCard = await this.page.locatort('selector-for-blume-card'); // Replace with the actual selector
		//await this.page.locator('[data-testid="BlumeCard"]').click();

		// await this.page.locator('[data-testid="EmailOutlinedIcon"]').click();
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName);
		await this.page.locator('[id="loginButton"]').click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password);
		// Intercept API requests
		await this.page.route('**/blume-api/User/SignalRConnect*', route => route.continue());
		await this.page.route('**/blume-api/User/loggeduser*', route => route.continue());
		await this.page.locator('[type="submit"]').click();

		// Wait for API calls to be successful
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/loggeduser') && response.status() === 200
		);
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/SignalRConnect') && response.status() === 200
		);

		// Verify the AddIcon is visible
		const addIcon = await this.page.$('[data-testid="AddIcon"]');
		expect(await addIcon.isVisible()).toBeTruthy();

		// Wait for a while (not recommended in real tests, replace with a proper wait condition if possible)
		await this.page.waitForTimeout(6000);
	}

	async loginOmegaAIUser04() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName2);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password2);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async loginOmegaAIUserReferring01() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName3);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password3);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async logoutOmegaAI() {
		await this.page.locator('[data-cy="sidebar-profile"]').click();
		await this.page.getByRole('button', { name: 'LOGOUT' }).click();
	}
};

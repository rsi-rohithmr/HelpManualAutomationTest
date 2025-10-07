export class OAISignUpPage {
	constructor(page) {
		this.page = page;
	}

	userFirstName() {
		return this.page.locator('[id="givenName"]');
	}

	userLastName() {
		return this.page.locator('[id="surname"]');
	}

	newPassword() {
		return this.page.locator('[id="newPassword"]');
	}

	reenterPassword() {
		return this.page.locator('[id="reenterPassword"]');
	}

	newContinueBtn() {
		return this.page.locator('[id="continue"]');
	}
}

const playwrightConfig = require('../../../playwright.config');
const fs = require('fs');
const path = require('path');
const { postStudyNGetToken } = require('../../APIutils/postStudyNGetToken');
const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];
const { expect } = require('@playwright/test');

exports.Blume = class Blume {
	constructor(page) {
		this.page = page;
	}

	async getElementCount(selector) {
		const elements = await this.page.locator(selector).elementHandles();
		return elements.length;
	}

	homeIcon() {
		return this.page.locator('[name="home"]');
	}

	profileIcon() {
		return this.page.locator('[data-cy="sidebar-profile"]');
	}

	patientDetailsPage() {
		return this.page.locator('.css-fcn2sd');
	}

	generalDetailsEditIcon() {
		return this.page.locator('[data-cy="edit-personal-information-icon"]');
	}

	patientFirstName() {
		return this.page.locator('[name="firstName"]');
	}

	patientMiddleName() {
		return this.page.locator('#form-field-Middle\\ Name');
	}

	patientLastName() {
		return this.page.locator('#form-field-Last\\ Name');
	}

	patientDOB() {
		return this.page.locator('#form-field-Date\\ of\\ Birth');
	}

	gender() {
		return this.page.locator('#form-field-Gender');
	}

	races() {
		return this.page.locator('[id="multiple-checkbox"]').nth(0);
	}

	ethnicity() {
		return this.page.locator('[id="multiple-checkbox"]').nth(1);
	}

	birthsex() {
		return this.page.locator('#form-field-Birth\\ Sex');
	}

	languages() {
		return this.page.locator('[id="multiple-checkbox"]').nth(3);
	}

	ssn() {
		return this.page.locator('#form-field-SSN');
	}

	martialStatus() {
		return this.page.locator('#form-field-Marital\\ Status');
	}

	smokingStatus() {
		return this.page.locator('#form-field-Smoking\\ Status');
	}

	alcholuse() {
		return this.page.locator('#form-field-Alcohol\\ Use');
	}

	motherMaidenName() {
		return this.page.locator('#form-field-Mother’s\\ Maiden\\ Name');
	}

	saveBtn() {
		return this.page.locator('text=Save');
	}

	cancelBtn() {
		return this.page.locator('text=Cancel');
	}

	patientFirstNameGD() {
		return this.page.locator('[data-cy="general-info-firstName"]');
	}

	patientMiddleNameGD() {
		return this.page.locator('[data-cy="general-info-middleName"]');
	}

	patientLastNameGD() {
		return this.page.locator('[data-cy="general-info-lastName"]');
	}

	birthDateGD() {
		return this.page.locator('[data-cy="general-info-birthDate"]');
	}

	genderGD() {
		return this.page.locator('[data-cy="general-info-gender"]');
	}

	racesGD() {
		return this.page.locator('[data-cy="general-info-maritalStatus"]');
	}

	ethnicityGD() {
		return this.page.locator('[data-cy="general-info-ethnicity"]');
	}

	birthsexGD() {
		return this.page.locator('[data-cy="general-info-birthSex"]');
	}

	languagesGD() {
		return this.page.locator('[data-cy="general-info-language"]');
	}

	ssnGD() {
		return this.page.locator('[data-cy="general-info-ssn"]');
	}

	martialStatusGD() {
		return this.page.locator('[data-cy="general-info-maritalStatus"]');
	}

	smokingStatusGD() {
		return this.page.locator('[data-cy="general-info-smokingStatus"]');
	}

	alcholuseGD() {
		return this.page.locator('[data-cy="general-info-alcoholUse"]');
	}

	motherMaidenNameGD() {
		return this.page.locator('[data-cy="general-info-motherMaidenName"]');
	}

	profileBtn() {
		return this.page.locator('[data-cy="sidebar-profile"]');
	}

	documentSearchBtn() {
		return this.page.locator('.css-a7gcd2 [data-testid="SearchIcon"]');
	}

	documentSearchTxtArea() {
		return this.page.locator('[placeholder="Search document"]');
	}

	documentTitleTxt() {
		return this.page.locator('[data-cy="file-title"]');
	}

	documentDragAndDropableArea() {
		return this.page.locator('.css-13tti3p');
	}

	shareStudyBtn() {
		return this.page.locator('[data-testid="ShareIcon"]');
	}

	downloadDocumentBtn() {
		return this.page.locator('[aria-label="Download"]');
	}

	renameDocumentBtn() {
		return this.page.locator('[data-testid="rename-button-box"]');
	}

	renameDocumentInput() {
		return this.page.locator('[data-testid="rename-document-drawer-custom-input"]');
	}

	sharedHistoryDrawer() {
		return this.page.locator('[data-testid="ShareOutlinedIcon"]');
	}

	OpenAddContactOptBtn() {
		return this.page.locator('[data-testid="AddIcon"]').last();
	}

	contactNameTxtField() {
		return this.page.locator('[name="name"]');
	}

	contactEmailTxtField() {
		return this.page.locator('[name="email"]');
	}

	addContactBtn() {
		return this.page.locator('[data-cy="ADD"]');
	}

	contactCancelBtn() {
		return this.page.locator('[data-cy="CancelSave"]');
	}

	contactBtn(page, contactName) {
		return this.page.locator(`[aria-label="${contactName}"]`);
	}

	shareBtn() {
		return this.page.locator('text=Share');
	}

	sharedHistoryBtn() {
		return this.page.locator('[name="share"]');
	}

	userBMI() {
		return this.page.locator('[id="bmi-value"]');
	}

	userBMICategory() {
		return this.page.locator('[id="bmi-category"]');
	}

	userWeightInput() {
		return this.page.locator('[id="input-weight"]');
	}

	userWeight() {
		return this.page.locator('[id="user-weight"]');
	}

	userWeightSection() {
		return this.page.locator('#weight-section');
	}

	userHeight() {
		return this.page.locator('[id="user-height"]');
	}

	userHeightInput() {
		return this.page.locator('[id="input-height"]');
	}

	userHeightSection() {
		return this.page.locator('#height-section');
	}

	documentThumbnail() {
		return this.page.locator('[data-cy="document-card"]');
	}

	documentCheckBtn() {
		return this.page.locator('[data-cy="document-select"]');
	}

	completedAppointmentsTab() {
		return this.page.locator('[data-cy="completed-appointments-tab"]');
	}

	patientCheckbox() {
		return this.page.locator('[data-testid="CheckBoxIcon"]');
	}

	async downloadDocument() {
		await this.documentThumbnail().nth(0).hover();
		await this.page.waitForTimeout(2000);
		await this.documentCheckBtn().click();
		await this.downloadDocumentBtn().click();
	}

	async shareDocument(UploadName, contactName, contactMailId, size) {
		await this.deleteContactFromShare(contactName, contactMailId, size);
		await this.page.waitForTimeout(2000);
		await this.documentThumbnail().nth(0).hover();
		await this.documentCheckBtn().click();
		await this.shareStudyBtn().click();

		await this.addContact(contactName, contactMailId);
		await this.contactBtn(contactName).click();
		await this.shareBtn().click();
	}

	async addContact(contactName, contactMailId) {
		await this.OpenAddContactOptBtn().click();
		await this.contactNameTxtField().fill(contactName);
		await this.contactEmailTxtField().fill(contactMailId);
		await this.addContactBtn().click();
	}

	async shareVerification(contactName, UploadName, size) {
		await this.page.waitForTimeout(2000);
		await this.documentThumbnail().nth(0).hover();
		await this.documentCheckBtn().click();
		await this.shareStudyBtn().click();
		await expect(this.page.locator('[data-cy="share-contact-list-item-shared"]')).toContainText(contactName);
		if (Array.isArray(size)) {
			await this.page.locator('.headerSection [data-testid="CloseOutlinedIcon"]').click();
		} else {
			await page.keyboard.press('Escape');
		}
	}

	async documentUnshare(page, contactName, UploadName, size) {
		await this.page.waitForTimeout(2000);
		await this.documentThumbnail().nth(0).hover();
		await this.documentCheckBtn().click();
		await this.shareStudyBtn().click();
		await expect(this.page.locator('[data-cy="share-contact-list-item-shared"]')).toContainText(contactName);
		await this.page.locator('[data-testid="KeyboardArrowDownIcon"]').click();
		await this.page.route('**/blume-api/Document/*/unshare', route =>
			route.fulfill({ status: 200, body: 'mocked response' })
		);
		await this.page.locator('.css-r8u8y9 [role="menuitem"]').filter({ hasText: 'Unshare' }).click();
		await this.page.waitForResponse('**/blume-api/Document/*/unshare');
	}

	async deleteAllDocuments() {
		const count = await this.page.locator('.css-15yrglq').count();
		if (count > 0) {
			for (let i = 0; i < count; i++) {
				await this.documentThumbnail().nth(i).hover();
				await this.documentCheckBtn().nth(i).click({ force: true });
			}
			await this.page.route('**/blume-api/Document?*', route =>
				route.fulfill({ status: 200, body: 'mocked response' })
			);
			await this.page.locator('.MuiCircularProgress-circle').click({ force: true });
			await this.page.waitForResponse('**/blume-api/Document?*');
		}
	}

	async deleteAllContactsFromShare(page, size) {
		await this.page.waitForTimeout(3000);
		await this.documentThumbnail(page).nth(0).hover();
		await this.documentCheckBtn(page).click({ force: true });
		await this.shareStudyBtn(page).click();
		const count = await this.page.locator('.css-1unhxjo').count();
		for (let i = 0; i < count; i++) {
			await this.page.route('**/blume-api/User/contact/*', route =>
				route.fulfill({ status: 200, body: 'mocked response' })
			);
			await this.page.locator('.css-1unhxjo [data-testid="DeleteOutlineIcon"]').nth(i).click({ force: true });
			await this.page.waitForResponse('**/blume-api/User/contact/*');
		}
		if (Array.isArray(size)) {
			await this.page.locator('.headerSection [data-testid="CloseOutlinedIcon"]').click();
		} else {
			await this.page.keyboard.press('Escape');
		}
	}

	async deleteContactFromShare(page, contactName, contactEmailID, size) {
		await this.page.waitForTimeout(3000);
		await this.documentThumbnail(page).nth(0).hover();
		await this.documentCheckBtn(page).click({ force: true });
		await this.shareStudyBtn(page).click();
		const count = await this.page.locator('[data-cy="share-contact-list-item"]').count();
		for (let i = 0; i < count; i++) {
			const text = await this.page
				.locator('[data-cy="share-contact-list-item"] .MuiListItemText-primary')
				.nth(i)
				.innerText();
			if (
				text.toLowerCase().includes(contactName.toLowerCase()) ||
				text.toLowerCase().includes(contactEmailID.toLowerCase())
			) {
				await this.page.route('**/blume-api/User/contact/*', route =>
					route.fulfill({ status: 200, body: 'mocked response' })
				);
				await this.page
					.locator('[data-cy="share-contact-list-item"] [data-testid="DeleteOutlineIcon"]')
					.nth(i)
					.click({ force: true });
				await this.page.waitForResponse('**/blume-api/User/contact/*');
			}
		}
		if (Array.isArray(size)) {
			await this.page.locator('.headerSection [data-testid="CloseOutlinedIcon"]').click();
		} else {
			await page.keyboard.press('Escape');
		}
	}

	BMICalculator(weight, height) {
		const heightMeter = parseFloat(height / 100);
		const bmiNumber = (weight / (heightMeter * heightMeter)).toFixed(2);
		let bmiText;
		if (bmiNumber < 18.6) {
			bmiText = 'Underweight';
		} else if (bmiNumber < 24.9) {
			bmiText = 'Normal';
		} else if (bmiNumber < 29.9) {
			bmiText = 'Overweight';
		} else {
			bmiText = 'Obese';
		}
		return [bmiNumber, bmiText];
	}

	nvgSignUpScreen() {
		return this.page.locator('[id="BlumeSignup"]');
	}

	email() {
		return this.page.locator('[id="email"]');
	}

	firstName() {
		return this.page.locator('[id="givenName"]');
	}

	lastName() {
		return this.page.locator('[id="surname"]');
	}

	birthDate() {
		return this.page.locator('[id="datepicker"]');
	}

	newPassword() {
		return this.page.locator('[id="newPassword"]');
	}

	reenterPassword() {
		return this.page.locator('[id="reenterPassword"]');
	}

	continueBtn() {
		return this.page.locator('[id="continue"]');
	}

	verifyTitle() {
		return this.page.locator('[id="verifyTitle"]');
	}

	generateMailsacEmail(mytestemail) {
		const dateTime = new Date().toISOString().replace(/[^0-9]/g, '');
		const email = `${mytestemail}${dateTime}@mailsac.com`;
		return email;
	}

	generateBirthday() {
		const today = new Date();
		const minAge = 16;
		const maxAge = 100;
		const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
		const birthYear = today.getFullYear() - randomAge;
		const birthMonth = Math.floor(Math.random() * 12) + 1;
		const birthDay = Math.floor(Math.random() * 28) + 1;
		const formattedBirthday = `${birthMonth.toString().padStart(2, '0')}/${birthDay
			.toString()
			.padStart(2, '0')}/${birthYear}`;
		return formattedBirthday;
	}

	homePageNvg() {
		return this.page.locator('[data-cy="sidebar-home"]');
	}

	shareHistoryNvg() {
		return this.page.locator('[data-cy="sidebar-sharedHistory"]');
	}

	helpNvg() {
		return this.page.locator('[data-cy="sidebar-help"], svg[name="help"]');
	}

	appsNvg() {
		return this.page.locator('[data-cy="sidebar-apps"]');
	}

	searchApptBar() {
		return this.page.locator('[placeholder="Search for studies"]');
	}

	bookApptBtn() {
		return this.page.locator('[data-testid="book-button"]');
	}

	chatIcon() {
		return this.page.locator('[data-testid="chat-icon"]');
	}

	notificationBtn() {
		return this.page.locator('[data-testid="notifications-icon"]');
	}

	userIconTopbar() {
		return this.page.locator('[data-cy="sidebar-profile"]');
	}

	completedDetailMobile() {
		return this.page.locator('[data-testid="completedDetailMobile"]');
	}

	zoomOutBtn() {
		return this.page.locator('[data-testid="zoom-out"]');
	}

	zoominBtn() {
		return this.page.locator('[data-testid="zoom-in"]');
	}

	downloadBtn() {
		return this.page.locator('[data-testid="download"]');
	}

	printBtn() {
		return this.page.locator('[data-testid="print"]');
	}

	closeDocumentMobileView() {
		return this.page.locator('[data-testid="KeyboardArrowLeftIcon"]');
	}

	viewImageBtn() {
		return this.page.getByText('View images');
	}

	dataRenderEngine() {
		return this.page.locator('[data-rendering-engine-uid^="cornerstone3d"]');
	}

	imageThumbnail() {
		return this.page.locator('[data-testid="image-preview-thumb"]', { timeout: 20000 });
	}

	apptFilterBtn() {
		return this.page.locator('[data-cy="appointment-filters"]');
	}

	clearAllBtn() {
		return this.page.locator('[data-cy="clear-filters"]');
	}

	appointmentFilterIcon() {
		return this.page.locator('[data-cy="appointment-filters"]');
	}

	async selectNextMonthV2() {
		await this.page.locator('[data-testid="ArrowRightIcon"]').click({ force: true });
	}

	async selectDateV2(daysToAdd) {
		try {
			const currentDate = new Date();
			const targetDate = new Date(currentDate);
			targetDate.setDate(targetDate.getDate() + daysToAdd);

			const month = months[targetDate.getMonth()];
			const day = targetDate.getDate();
			const year = targetDate.getFullYear();
			const formattedDate = `${month} ${day}, ${year}`;
			const selector = `[aria-label="${formattedDate}"]`;

			// Wait for the date picker to be visible
			await this.page.waitForSelector('[role="presentation"] [aria-live="polite"]', { timeout: 5000 });

			let count = await this.getElementCount(selector);
			const monthDisplayed = await this.page.locator('[role="presentation"] [aria-live="polite"]').textContent();

			// Validate month and year display
			if (!monthDisplayed) {
				throw new Error('Date picker month/year display is not visible');
			}

			// Check if the date is available in current view
			if (count > 0 && monthDisplayed.includes(month) && monthDisplayed.includes(year.toString())) {
				await this.page.locator(selector).click({ force: true });
				await this.page.waitForTimeout(3000);
				return true;
			}

			// If date not found, try next month
			await this.selectNextMonthV2();
			await this.page.waitForTimeout(1000);

			// Check again after moving to next month
			count = await this.getElementCount(selector);
			const nextMonthDisplayed = await this.page
				.locator('[role="presentation"] [aria-live="polite"]')
				.textContent();
			if (count > 0 && nextMonthDisplayed.includes(month) && nextMonthDisplayed.includes(year.toString())) {
				await this.page.locator(selector).click({ force: true });
				await this.page.waitForTimeout(3000);
				return true;
			}

			throw new Error(`Date ${formattedDate} not found in current or next month view`);
		} catch (error) {
			console.error('Error in selectDateV2:', error.message);
			throw error;
		}
	}

	async createAnApptWithOrderSet(organizationName, daysToAdd, studyType) {
		const appointmentInfo = {}; // replace this with actual appointment object if needed
		let scheduleResponse;
		// Click "Book Appointment"
		await this.page.locator('[data-testid="book-button"]').first().click();

		if (studyType === 'PROCEDURE NOT LISTED/ NOT SURE?') {
			await expect(this.page.locator('[data-testid="upload-files"]')).toBeAttached();
			await this.page.locator('[data-testid="next"]').first().click({ force: true });
		}

		// Wait for the patient name field to be visible and populated, with a timeout
		await this.page.locator('#form-field-undefined').waitFor({ state: 'visible', timeout: 20000 });

		let patientName = '';
		const maxWaitMs = 20000; // 20 seconds
		const pollInterval = 500; // 0.5 second
		const start = Date.now();

		while (Date.now() - start < maxWaitMs) {
			const textContent = await this.page.locator('#form-field-undefined').textContent();
			patientName = textContent?.replace(/\u200B/g, '').trim();
			if (patientName) break;
			await this.page.waitForTimeout(pollInterval);
		}

		if (!patientName) {
			console.log('Patient Name Field is visually blank — reloading page...');
			await this.page.reload();
			// Launch book appointment again
			await this.page.locator('[data-testid="book-button"]').first().click();
		} else {
			console.log(`Patient Name has been populated: ${patientName}`);
		}

		// Handle notification wrapper if exists
		const notification = this.page.locator('[data-testid="oai-notification-wrapper"]');
		if (await notification.count()) {
			const acceptBtn = notification.locator('button', { hasText: 'Accept' });
			if (await acceptBtn.isVisible()) {
				await acceptBtn.click({ force: true });
			}
		}

		const viewportSize = await this.page.evaluate(() => {
			return {
				width: window.innerWidth,
				height: window.innerHeight,
			};
		});

		// Fill in location with proper waits
		await this.page.waitForTimeout(10000);
		const locationInput = this.page.locator('[data-testid="location-select"] input');
		if (viewportSize.width <= 1024) {
			await locationInput.fill('Jersey City,');
		} else {
			await locationInput.clear(); // Clear any existing value
			await this.page.waitForTimeout(1000); // Short wait after clearing
			await locationInput.type('Jersey City, NJ, USA', { delay: 100 });
			await this.page.waitForTimeout(5000);
		}

		// Wait for the suggestion list to appear and click the correct option
		await this.page.getByText('Jersey City, NJ, USA', { exact: true }).click();

		// Wait for org and select
		await this.page.waitForResponse(
			resp => resp.url().includes('findOrganizationsByServiceModalitiesAndPreference') && resp.status() === 200
		);

		// for mobile and tablet only
		if (viewportSize.width <= 1024) {
			await this.page.locator('[data-testid="order-set"]').click();
			await this.page.waitForTimeout(2000);
		}

		await this.page.locator('p', { hasText: organizationName }).click({ force: true });
		await this.page.waitForTimeout(3000); // Wait for organization selection to process
		if (viewportSize.width <= 1024) {
			await this.page.locator('[data-testid="select-facility-button"]').click();
		}

		// Select procedure with improved handling
		try {
			// Wait for the order set selector with increased timeout
			await this.page.waitForSelector('[data-testid="order-set-select"]', {
				state: 'visible',
				timeout: 20000,
			});

			// Ensure the element is actually clickable
			await this.page.waitForSelector('[data-testid="order-set-select"]', {
				state: 'attached',
				timeout: 5000,
			});

			await this.page.locator('[data-testid="order-set-select"]').click();
			if (viewportSize.width <= 1024) {
				await this.page.locator('[data-testid="order-set-option-1"]').click();
			} else {
				await this.page.waitForTimeout(6000);

				if (studyType) {
					// If studyType is provided, find and fill the input within the autocomplete
					const input = this.page.locator('[data-testid="order-set-select"] input');
					await input.waitFor({ state: 'visible', timeout: 10000 });
					await input.fill(studyType.toLowerCase());
					await this.page.waitForTimeout(1000);

					// Wait for dropdown and select matching option
					await this.page.waitForSelector('li[role="option"]', { state: 'visible', timeout: 10000 });
					await this.page.locator(`li[role="option"]:has-text("${studyType}")`).first().click();
				} else {
					// If no studyType, just select first option
					await this.page.keyboard.press('ArrowDown');
					await this.page.keyboard.press('Enter');
				}
			}
			if (viewportSize.width <= 1024) {
				await this.page.locator('[data-testid="select-order-set-button"]').click();
			}

			await this.page.waitForTimeout(2000);
			// Click Next
			await this.page.locator('[data-testid="next"]').first().click({ force: true });

			if (studyType === 'PROCEDURE NOT LISTED/ NOT SURE?') {
				const confirmButton = this.page.getByTestId('confirm-appointment');
				await expect(confirmButton).toBeVisible({ timeout: 10000 });
				await expect(confirmButton).toBeEnabled({ timeout: 10000 });

				[scheduleResponse] = await Promise.all([
					this.page.waitForResponse(
						resp => resp.url().includes('/blume-api/Appointment/schedule') && resp.status() === 200
					),
					confirmButton.click({ force: true }),
				]);
			} else {
				// Wait for available time and select date
				await this.page.waitForResponse(
					resp => resp.url().includes('findavailabletime') && resp.status() === 200
				);

				await this.selectDateV2(daysToAdd);
				await this.page.waitForTimeout(6000);

				// Pick a slot
				if (viewportSize.width <= 599) {
					await this.page.locator('[data-cy="slot0"]').click();
				} else if (viewportSize.width > 599 && viewportSize.width <= 1024) {
					await this.page.locator('[data-cy="slot1"]').click({ force: true });
				} else {
					await this.page.locator('[data-cy="slot2"]').click({ force: true });
				}
				await this.page.waitForTimeout(6000);
				const nextButton = this.page.locator('[data-testid="next"]').first();
				// Make sure it exists and is visible before clicking
				await expect(nextButton).toBeVisible({ timeout: 10000 });
				await expect(nextButton).toBeEnabled({ timeout: 10000 });

				// Now do the click + wait for response
				[scheduleResponse] = await Promise.all([
					this.page.waitForResponse(
						resp => resp.url().includes('/blume-api/Appointment/schedule') && resp.status() === 200
					),
					nextButton.click({ force: true }),
				]);
			}

			const responseJson = await scheduleResponse.json();
			console.log('Appointment Scheduled:', responseJson);
			return responseJson;
		} catch (error) {
			console.error('Error in createAnApptWithOrderSet:', error.message);
			throw error;
		}
	}

	async uploadAttachmentToAppointment() {
		const filePath = path.join(__dirname, '../../TestData/test-upload.png');
		await this.page.getByText('Upload Files', { exact: true }).first().click();
		await this.page.waitForSelector('[data-testid="upload-button"]', { state: 'visible', timeout: 10000 });
		const fileChooserPromise = this.page.waitForEvent('filechooser');
		await this.page.getByTestId('upload-button').click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(filePath);
	}
};

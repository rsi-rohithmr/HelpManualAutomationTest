import faker from 'community-faker';
import { PatientRegistration } from './patientRegistrationForm';

const { expect } = require('@playwright/test');
const { ApiWaitUtils } = require('../apiWaitUtils');
const { HomePage } = require('../homePage/homePage');
const { GlobalSearch } = require('../globalSearch');
const { DetailedTablePopper } = require('./detailedTablePopper');
const { OrganizationPayer } = require('../organization/organizationPayer');

export class CoverageInformationPage {
	constructor(page) {
		this.page = page;
		this.homePage = new HomePage(this.page);
		this.globalSearch = new GlobalSearch(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.detailedTablePopper = new DetailedTablePopper(this.page);
		this.organizationPayer = new OrganizationPayer(this.page);
		this.patientRegistration = new PatientRegistration(this.page);
	}
	//sectionHeadings
	generalInfoHeading() {
		return this.page.getByTestId('CardsViewHeaderV2').getByText('Coverage');
	}

	contactInfoHeading() {
		return this.page
			.getByTestId('visit-section-Contact Information')
			.locator('div')
			.filter({ hasText: 'Contact Information' });
	}

	coverageIcon() {
		return this.page.locator('[data-testid="HealthAndSafetyOutlinedIcon"]');
	}

	// Locator for the "Payer" field
	getPayerField() {
		return this.page.getByRole('combobox', { name: 'Payer' });
	}

	addNewPayerLink() {
		return this.page.getByRole('button', { name: 'ADD NEW', exact: true });
	}

	// Locator for the "Effective Range" field
	getEffectiveRangeField() {
		return this.page.locator('[data-cy="Effective Range_filter"]');
	}
	// Locator for the "Member Relationship to Patient" field
	getMemberRelationshipToPatientField() {
		return this.page.getByRole('button', {
			name: 'Member Relationship to Patient',
		});
	}
	// Locator for the "Member Name" field
	getMemberNameField() {
		return this.page.getByRole('combobox', { name: 'Member Name' });
	}
	// Locator for the "Member ID" field
	getMemberIdField() {
		return this.page.getByRole('textbox', { name: 'Member ID' });
	}
	// Locator for the "Group Number" field
	getGroupNumberField() {
		return this.page.getByRole('textbox', { name: 'Group Number' });
	}
	// Locator for the "Employer Name" field
	getEmployerNameField() {
		return this.page.getByRole('combobox', { name: 'Employer Name' });
	}
	// Locator for the "Employer Phone Number" field
	getEmployerPhoneNumberField() {
		return this.page.locator('input[name="employerPhoneNumber"]');
	}
	getCancelButton() {
		return this.page.locator('[data-testid="cancel-btn"]');
	}

	getSaveButton() {
		return this.page.locator('[data-testid="save-btn"]');
	}

	getAddNewCoverageButton() {
		return this.page.locator('[data-testid="CardsViewHeaderV2-add"]');
	}

	getSpecificCoverage(coverageIndex = 0) {
		return this.page.locator('[data-testid="coverage-card-box-container"]').nth(coverageIndex);
	}

	getEditButton(coverageIndex = 0) {
		return this.page.locator('[data-testid="edit-icon-button"]').nth(coverageIndex);
	}

	getDeleteButton(coverageIndex = 0) {
		return this.page.locator('[data-testid="hold-to-delete-tooltip"]').nth(coverageIndex);
	}

	getEmployerNameField() {
		return {
			// Main container
			container: this.page.getByTestId('form-field'),

			// Input field - multiple strategies
			input: {
				byId: this.page.locator('#form-field-Employer Name'),
				byTestId: this.page.getByTestId('form-field').locator('input'),
				byRole: this.page.getByRole('textbox', { name: 'Employer Name' }),
			},

			// Label
			label: this.page.getByLabel('Employer Name'),

			// Helper text
			helperText: this.page.locator('#form-field-Employer Name-helper-text'),

			// Interaction methods
			async fill(value) {
				const input = this.input.byRole;
				await input.click();
				await input.fill(value);
			},

			async getValue() {
				return await this.input.byRole.inputValue();
			},

			async isRequired() {
				const helperText = await this.helperText.textContent();
				return helperText === 'Required';
			},
		};
	}

	async getVisibleCoverageCardsCount() {
		try {
			// Wait for any coverage cards to be present
			await this.page
				.locator('[data-testid="coverage-card-box-container"]')
				.first()
				.waitFor({ state: 'visible', timeout: 5000 });

			// Get all cards and check visibility
			const cards = await this.page.locator('[data-testid="coverage-card-box-container"]').all();

			let visibleCount = 0;
			for (const card of cards) {
				if (await card.isVisible()) {
					visibleCount++;
				}
			}

			return visibleCount;
		} catch (error) {
			console.error('Error counting visible coverage cards:', error);
			return 0;
		}
	}

	async holdToDeleteCoverage(coverageIndex = 0) {
		// Get the delete button for the specific coverage card
		try {
			// Set up route handlers before navigation
			await this.page.route(`**/Coverage**`, route => route.continue());
			await this.getSpecificCoverage(coverageIndex).hover();
			await this.page.waitForTimeout(1000);
			// Wait for the button to be visible
			await this.getDeleteButton(coverageIndex).waitFor({ state: 'visible' });
			await this.getDeleteButton(coverageIndex).click({ force: true });
			// Press and hold the button for 5 seconds
			await this.page.mouse.down();
			await this.page.waitForTimeout(3000);
			await this.page.mouse.up();
			return true;
		} catch (error) {
			console.error(`Error deleting coverage at index ${coverageIndex}:`, error);
			throw error;
		}
	}

	async openCoverageInformationPageByURL(patientId) {
		// Set up route handlers before navigation
		await this.page.route(`**/Coverage**`, route => route.continue());
		// Build and navigate to new URL
		const currentUrl = this.page.url();
		const newUrl = new URL(currentUrl);
		newUrl.pathname = `/patient/${patientId}/coverage`;
		await this.page.goto(newUrl.toString());

		// Wait for coverage response
		const coverageResponse = await this.apiWaitUtils.waitForAPI('/fhir/Coverage', 'GET');
		console.log('coverageResponse', coverageResponse);

		// Wait for heading to be visible
		await this.generalInfoHeading().waitFor({ state: 'visible' });
		return { coverageResponse };
	}

	async openCoverageDetailsPage(patientName, managingOrgName) {
		await this.homePage.filterStudiesBySingleColumn('Patient Name', patientName);
		await this.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await this.page.waitForTimeout(5000);
		await this.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientName}$`, 'g'))
			.first()
			.click({ force: true });
		await this.page.waitForTimeout(6000);
		await this.clickWheel.clickWheel().waitFor({ state: 'attached' });
		await this.clickWheel.patientIcon().click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.coverageIcon().click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.generalInfoHeading().waitFor({ state: 'visible' });
	}

	async coverageDetailsLeftCard() {
		const container = this.page.getByTestId('coverage-details-left-card');

		return {
			// Main container
			container,

			// Payer information
			payer: {
				container: container.getByTestId('payer'),
				label: container.getByTestId('payer').getByText('Payer'),
				value: container.getByTestId('payer').locator('h6'),
			},

			// Employer Name
			employerName: {
				container: container.getByTestId('employer-name'),
				label: container.getByTestId('employer-name').getByText('Employer Name'),
				value: container.getByTestId('employer-name').locator('h6'),
			},

			// Payer Type
			payerType: {
				container: container.getByTestId('payer-type'),
				label: container.getByTestId('payer-type').getByText('Payer Type'),
				value: container.getByTestId('payer-type').locator('h6'),
			},

			// Employer Phone Number
			employerPhoneNumber: {
				container: container.getByTestId('employer-phone-number'),
				label: container.getByTestId('employer-phone-number').getByText('Employer Phone Number'),
				value: container.getByTestId('employer-phone-number').locator('h6'),
			},

			// Member Relationship to Patient
			memberRelationship: {
				container: container.getByTestId('member-relationship-to-patient'),
				label: container
					.getByTestId('member-relationship-to-patient')
					.getByText('Member Relationship to Patient'),
				value: container.getByTestId('member-relationship-to-patient').locator('h6'),
			},

			// Coverage Status
			coverageStatus: {
				container: container.getByTestId('coverage-status'),
				label: container.getByTestId('coverage-status').getByText('Coverage Status'),
				statusIcon: container.getByTestId('active-coverage'),
			},

			// Member Name
			memberName: {
				container: container.getByTestId('member-name'),
				label: container.getByTestId('member-name').getByText('Member Name'),
				value: container.getByTestId('member-name').locator('h6'),
			},

			// Member ID
			memberId: {
				container: container.getByTestId('member-id'),
				label: container.getByTestId('member-id').getByText('Member ID'),
				value: container.getByTestId('member-id').locator('h6'),
			},

			// Group Number
			groupNumber: {
				container: container.getByTestId('group-number'),
				label: container.getByTestId('group-number').getByText('Group Number'),
				value: container.getByTestId('group-number').locator('h6'),
			},
		};
	}

	async coverageDetailsTopCard() {
		const container = this.page.getByTestId('coverage-details-top-card');

		return {
			// Main container
			container,

			// Payer ID
			payerId: {
				container: container.getByTestId('payer-id'),
				label: container.getByTestId('payer-id').getByText('Payer ID'),
				value: container.getByTestId('payer-id').locator('h6'),
			},

			// Effective Date Range
			effectiveFrom: {
				container: container.getByTestId('effective-date-range'),
				icon: container.getByTestId('effective-from-icon'),
				label: container.getByTestId('effective-date-range').getByText('Effective from'),
				value: container.getByTestId('effective-date-range').locator('h6'),
			},
		};
	}

	async coverageDetailsRightCard() {
		const container = this.page.getByTestId('coverage-details-right-card');

		return {
			// Main container
			container,

			// Insurance Card section
			insuranceTitle: {
				container: container.getByTestId('insurance-title-box'),
				label: container.getByTestId('insurance-title-box').getByText('Insurance Card'),
			},

			// Details Box
			detailsBox: {
				container: container.getByTestId('details-box'),
				emptyIcon: container.getByTestId('empty-insurance-card'),
				emptyText: container.locator('.MuiTypography-body1').getByText('No picture uploaded'),
			},

			// Helper methods to get text content
			async insuranceCard() {
				try {
					const hasEmptyIcon = await container.getByTestId('empty-insurance-card').isVisible();
					return hasEmptyIcon ? 'No picture uploaded' : await this.detailsBox.container.textContent();
				} catch (error) {
					return 'No picture uploaded';
				}
			},

			async coverageCard() {
				try {
					const hasEmptyIcon = await container.getByTestId('empty-insurance-card').isVisible();
					return hasEmptyIcon ? 'No picture uploaded' : await this.detailsBox.container.textContent();
				} catch (error) {
					return 'No picture uploaded';
				}
			},
		};
	}

	async getCoverageCardStatus(cardIndex = 0) {
		// Get the specific coverage card container
		const container = await this.getSpecificCoverage(cardIndex);

		// Define status locators for this specific card
		const statusLocators = {
			active: container.locator('[data-testid="status-active-coverage"]'),
			inactive: container.locator('[data-testid="status-inactive-coverage"]'),
			unknown: container.locator('[data-testid="status-unknown-coverage"]'),
		};

		// Check which status is visible on this specific card
		try {
			if (await statusLocators.active.isVisible()) {
				return 'ACTIVE';
			}
			if (await statusLocators.inactive.isVisible()) {
				return 'INACTIVE';
			}
			if (await statusLocators.unknown.isVisible()) {
				return 'UNKNOWN';
			}
			return 'N/A';
		} catch (error) {
			console.error(`Error getting status for card ${cardIndex}:`, error);
			return 'N/A';
		}
	}

	async extractCoverageInfo(coverageNumber = 0) {
		// Get all card containers
		const coverageContainer = await this.coverageCardBoxContainer(coverageNumber);
		const coverageDetailsLeftCard = await this.coverageDetailsLeftCard();
		const coverageDetailsTopCard = await this.coverageDetailsTopCard();
		const coverageDetailsRightCard = await this.coverageDetailsRightCard();

		// Extract coverage card info
		const coverageInfo = {
			'Payer Name': await coverageContainer.payerName.textContent(),
			'Payer ID': await coverageContainer.payerId.textContent(),
			'Group Number': await coverageContainer.groupNumber.textContent(),
			'Member ID': await coverageContainer.memberId.textContent(),
			'Eligibility Payer ID': await coverageContainer.eligibilityPayerId.textContent(),
			'Phone Number': await coverageContainer.phoneNumber.textContent(),
		};
		// Extract left card info
		const leftCardInfo = {
			'Payer Name': await coverageDetailsLeftCard.payer.value.textContent(),
			'Employer Name': await coverageDetailsLeftCard.employerName.value.textContent(),
			'Payer Type': await coverageDetailsLeftCard.payerType.value.textContent(),
			'Group Number': await coverageDetailsLeftCard.groupNumber.value.textContent(),
			'Coverage Status': await this.getCoverageCardStatus(coverageNumber),
			'Employer Phone Number': await coverageDetailsLeftCard.employerPhoneNumber.value.textContent(),
			'Member Relationship to Patient': await coverageDetailsLeftCard.memberRelationship.value.textContent(),
			'Member Name': await coverageDetailsLeftCard.memberName.value.textContent(),
			'Member ID': await coverageDetailsLeftCard.memberId.value.textContent(),
		};

		// Extract top card info
		const topCardInfo = {
			'Payer ID': await coverageDetailsTopCard.payerId.value.textContent(),
			'Effective from': await coverageDetailsTopCard.effectiveFrom.value.textContent(),
		};

		// Extract right card info
		const rightCardInfo = {
			'Insurance Card': await coverageDetailsRightCard.insuranceCard(),
			'Coverage Card': await coverageDetailsRightCard.coverageCard(),
		};

		// Normalize and format all extracted data
		const normalizeData = data => {
			Object.keys(data).forEach(field => {
				if (typeof data[field] === 'string' && data[field].trim() !== '') {
					data[field] = data[field].toUpperCase();
				} else if (!data[field]) {
					data[field] = 'N/A';
				}
			});
			return data;
		};

		// Populate the coverageDO object with normalized data
		const coverageDO = {
			coverageCardInfo: normalizeData(coverageInfo),
			coverageDetailsLeftCardInfo: normalizeData(leftCardInfo),
			coverageDetailsTopCardInfo: normalizeData(topCardInfo),
			coverageDetailsRightCardInfo: normalizeData(rightCardInfo),
		};

		return coverageDO;
	}

	async openPatientDetailsPageFromGlobalSearch(patientName, patientId) {
		await this.globalSearch.globalSearchCombo(globalSearch.searchOptions.All).click();
		await this.globalSearch.globalSearchSelect(globalSearch.searchOptions.Patient).click();
		await this.globalSearch.searchExecution(`${patientName} - ${patientId}`, 'GET');
		await this.globalSearch.autosuggestList().locator(`text=${patientName} - ${patientId}`).click({ force: true });
		await this.generalInformationNav().waitFor({ state: 'visible' });
	}

	async coverageCardBoxContainer(coverageNumber = 0) {
		const container = this.getSpecificCoverage(coverageNumber);

		return {
			// Main container
			container,

			// Gradient box container
			gradientBoxContainer: container.locator('[data-testid="gradient-box-container"]'),

			// Coverage card box
			coverageCardBox: container.locator('[data-testid="coverage-card-box"]'),

			// Status icon
			statusIcon: container.locator('[data-testid="status-active-coverage"]'),

			// Insurance type chip
			insuranceTypeChip: container.locator('[data-testid="insurance-type-chip"]'),
			insuranceTypeChipAvatar: container.locator('[data-testid="insurance-type-chip"] .MuiAvatar-root'),
			insuranceTypeChipLabel: container.locator('[data-testid="insurance-type-chip"] .MuiChip-label'),

			// Edit button
			editButton: container.locator('[data-testid="edit-icon-button"]'),

			// Delete button
			deleteButton: container.locator('[data-testid="hold-to-delete-tooltip"]'),

			// Payer Name
			payerName: container.locator('[data-testid="Payer Name"] h6'),

			// Payer ID
			payerId: container.locator('[data-testid="Payer ID"] h6'),

			// Group Number
			groupNumber: container.locator('[data-testid="Group Number"] h6'),

			// Member ID
			memberId: container.locator('[data-testid="Member ID"] h6'),

			// Eligibility Payer ID
			eligibilityPayerId: container.locator('[data-testid="Eligibility Payer ID"] h6'),

			// Phone Number
			phoneNumber: container.locator('[data-testid="Phone Number"] h6'),

			// Bottom-right icons container
			bottomRightIconsContainer: container.locator('[data-testid="bottom-right-icons-container"]'),
		};
	}

	// Method to select an effective date range
	async selectEffectiveDateRange() {
		// Click to open the date picker
		const effectiveRangeField = this.getEffectiveRangeField();
		await effectiveRangeField.click();

		// Wait for the date picker to appear
		const datePicker = this.page.locator('.MuiPickerStaticWrapper-root');
		await expect(datePicker).toBeVisible();

		// Get today's date and end date
		const today = new Date();
		const endDate = new Date(today);
		endDate.setDate(today.getDate() + 6);

		// Find and click start date first
		const startDateButton = this.page
			.locator('.MuiPickersDay-root')
			.filter({ hasText: today.getDate().toString() })
			.first();
		await startDateButton.click();

		// If end date is in next month, navigate
		if (endDate.getMonth() !== today.getMonth()) {
			await this.page.getByRole('button', { name: 'Next month' }).click();
			await this.page.waitForTimeout(500); // Wait for animation
		}

		// Find and click end date to complete the range selection
		const endDateButton = this.page
			.locator('.MuiPickersDay-root')
			.filter({ hasText: endDate.getDate().toString() })
			.first();
		await endDateButton.click();

		// close the picker
		await this.page.getByTestId('cancelDateTime').click({ force: true });

		// Wait for the date picker to close
		await expect(datePicker).toBeHidden();
	}

	async setCoverageDetailsInformation({ payer } = {}, shouldSave = true) {
		await this.getPayerField().click();
		if (payer !== null && payer !== undefined) {
			await this.organizationPayer.addPayer(payer, await this.addNewPayerLink());
		} else {
			await Promise.all([
				this.getPayerField().pressSequentially('PA', { delay: 500 }),
				this.page.getByRole('option').first().click(),
			]);
		}

		// Wait for the effective date range to be selected
		await this.selectEffectiveDateRange();

		const memberIdField = this.getMemberIdField();
		await expect(memberIdField).toBeVisible(); // Ensure it's now visible
		await memberIdField.fill('12345678');

		const groupeNumberField = this.getGroupNumberField();
		await expect(groupeNumberField).toBeVisible(); // Ensure it's now visible
		await groupeNumberField.fill('2223333');
		// Wait for save to complete
		// Save the changes
		await this.page.route(`**/Coverage**`, route => route.continue());
		const saveButton = this.page.locator('[data-testid="SAVE_"]');

		// Wait for save to complete
		if (shouldSave) {
			const [, coverageResponse] = await Promise.all([
				saveButton.click(),
				this.apiWaitUtils.waitForAPI('/fhir/Coverage', 'POST'),
			]);
			await this.page.waitForTimeout(1000);

			return coverageResponse;
		}
	}

	async editCoverageDetailsInformation() {
		await this.page.route(`**/fhir/organization*`, route => {
			route.continue();
		});

		const memberIdField = this.getMemberIdField();
		await expect(memberIdField).toBeVisible(); // Ensure it's now visible
		await memberIdField.fill('223344');

		const groupeNumberField = this.getGroupNumberField();
		await expect(groupeNumberField).toBeVisible(); // Ensure it's now visible
		await groupeNumberField.fill('1234');

		await this.page.getByRole('combobox', { name: 'Employer Name' }).click();
		await this.detailedTablePopper.getAddNewButton().byText.click();
		const employerField = this.getEmployerNameField();
		await employerField.fill(faker.company.companyName());
		const saveButton = this.page.locator('[data-testid="SAVE_"]');
		await saveButton.click();
		await this.page.locator('#form-field-Member\\ Relationship\\ to\\ Patient').click();
		await this.page.getByRole('option', { name: 'CHILD' }).click();
		await this.getMemberNameField().click();
		await this.detailedTablePopper.getAddNewButton().byText.click();
		await this.patientRegistration.savePatientForm();
		// Wait for save to complete
		// Save the changes
		await this.page.route(`**/Coverage**`, route => route.continue());
		const updateButton = this.page.locator('[data-testid="UPDATE_"]');

		// Wait for save to complete

		const [, coverageResponse] = await Promise.all([
			updateButton.click(),
			this.apiWaitUtils.waitForAPI('/fhir/Coverage', 'PUT'),
		]);
		return coverageResponse;
	}
}

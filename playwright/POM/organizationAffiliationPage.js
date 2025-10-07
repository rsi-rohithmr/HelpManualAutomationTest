import { OrganizationDetailPage } from './organizationDetailPage';
const { Sidebar } = require('./sidebar');
const { ApiWaitUtils } = require('./apiWaitUtils');

export class OrganizationAffiliationPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.organizationDetailPage = new OrganizationDetailPage(this.page);
		this.sidebar = new Sidebar(this.page);
	}

	createOrEditAffiliationFormHeader() {
		return this.page.locator('[data-testid="create-new-affiliation-header"]');
	}

	addAffiliationButton() {
		return this.page.locator('[data-testid="add-affiliation"]');
	}

	removeAffiliationButton() {
		return this.page.locator('[data-testid="remove-affiliation"]');
	}

	IsCreateNewAffiliationButton() {
		return this.page.locator('[data-testid="create-new-affiliation-header-btn"]');
	}

	affiliateOrganizationNameInput() {
		return this.page.locator('[data-testid="autocomplete-field-Affiliate Organization"]');
	}

	applySingleRoleCheckbox() {
		return this.page.locator('[data-testid="defaultPrimaryRoleCheckbox"] input');
	}

	createNewAffiliationButton() {
		return this.page.locator('[data-testid="popup-create-btn"]');
	}

	confirmCreateAffiliationButton() {
		return this.page.locator('[data-testid="proceed-btn"]');
	}

	confirmRemoveAffiliationButton() {
		return this.page.locator('[data-testid="proceed-btn"]');
	}

	affiliationDataGrid() {
		return this.page.locator('[data-testid="organization-affiliation-data-grid"]');
	}

	affiliationStatus() {
		return this.page.locator('[data-testid="affiliated-chip"]');
	}

	affiliationRemovedStatus() {
		return this.page.locator('[data-testid="not-affiliated-chip"]');
	}

	async getAffiliatedTable() {
		const table = await this.page.locator('table[data-cy="study-status-table"]');
		const tableRow = await table.locator('tbody tr');
		return tableRow;
	}

	async getUserListButton() {
		return this.page.locator('[data-testid="view-affiliated-users"]');
	}

	async selectSingleRole(roleName) {
		await this.page.locator('[data-testid="selectDefaultPrimaryRole"]').hover();
		await this.page.locator('[data-testid="selectDefaultPrimaryRole"]').click();

		const singleRoleInput = this.page.locator('[data-testid="selectDefaultPrimaryRole"] input');

		await singleRoleInput.type(roleName);
		await this.page.waitForTimeout(2000);
		// Click the selected option from the dropdown
		const selectRoleOption = this.page.locator('[role="option"]').first();
		await selectRoleOption.click();
	}

	// Function to calculate the number of rows in the affiliationDataGrid
	async getAffiliationsCount() {
		const affiliation = this.page.locator('[data-testid="affiliated-chip"]');
		const count = await affiliation.count();
		const visible = await affiliation.first().isVisible();
		console.log('Affiliation count:', count, 'First visible:', visible);
		if (count > 0 && visible) {
			return count;
		}
		console.error('No Active Affiliations found');
		return 0;
	}
}

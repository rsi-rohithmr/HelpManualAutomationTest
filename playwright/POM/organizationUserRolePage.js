import { OrganizationDetailPage } from './organizationDetailPage';
const { Sidebar } = require('./sidebar');
const { ApiWaitUtils } = require('./apiWaitUtils');

export class OrganizationUserRolePage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.organizationDetailPage = new OrganizationDetailPage(this.page);
		this.sidebar = new Sidebar(this.page);
	}

	RoleIcon() {
		return this.page.locator('[data-testid="dynamic-btn-Roles"]');
	}

	UserIcon() {
		return this.page.locator('[data-testid="dynamic-btn-Users"]');
	}

	async GoToRolePage() {
		await this.RoleIcon().hover();
		await this.RoleIcon().click();
	}

	async GoToUserPage() {
		await this.UserIcon().hover();
		await this.UserIcon().click();
	}

	async AddNewRole(name = null) {
		await this.GoToRolePage();
		await this.page.getByLabel('Add Role').hover();
		await this.page.getByLabel('Add Role').click();
		if (name) {
			await this.AddRoleName(name);
		}
	}

	async AddRoleName(name) {
		await this.page.waitForTimeout(2000);
		await this.page.locator('input[placeholder="Add Role Name"]').fill(name);
	}

	async SaveRole() {
		await this.page.locator('[data-testid="save-button"]').hover();
		await this.page.locator('[data-testid="save-button"]').click();
	}

	async IsRoleVisible(roleName) {
		const dataGrid = this.page.locator('[data-testid="data-grid-table-container"]');
		const userTd = dataGrid.locator('td', { hasText: roleName });
		return !!userTd;
	}

	SearchFilter() {
		const roleNameFilter = this.page.getByTestId('Role Name_filter');
		if (roleNameFilter) {
			return roleNameFilter.getByPlaceholder('Search');
		} else {
			return null;
		}
	}

	async GoToRole(roleName) {
		const searchFilter = this.SearchFilter();
		await searchFilter.click();
		await searchFilter.fill(roleName);
		await this.page.waitForTimeout(1000);
		const roleCheckbox = this.page.getByRole('option', { name: roleName, exact: true }).getByRole('checkbox');
		await roleCheckbox.waitFor({ state: 'visible' });
		roleCheckbox.check();
		await this.page.waitForTimeout(2000);

		await this.GoToRolePage();
		const dataGrid = this.page.locator('[data-testid="data-grid-table-container"]');
		const adminRow = dataGrid.locator('td', { hasText: roleName });
		await adminRow.hover();
		await this.page.waitForTimeout(300);
		const editIcon = this.page.locator('[data-testid="EditOutlinedIcon"]').first();
		await editIcon.hover();
		await editIcon.click();
	}
}

const { test, expect } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { Sidebar } = require('../POM/sidebar');
const { DeleteRole } = require('../DBUtils/RoleQuery');
test.describe('Organization Affiliate Role setting Tests', () => {
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	let poManager = null;
	let sidebar = null;

	let customRoleName = null;

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
		sidebar = new Sidebar(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Organization Affiliate should visible/ON for Administrator role', async ({ page }) => {
		const roleName = 'ADMINISTRATOR';
		const url = `${playwrightConfig.baseURL}organization/${managingOrgId}`;
		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.usersAndRolesNav().click();
		await poManager.organizationUserRolePage.GoToRolePage();

		const roleVisible = await poManager.organizationUserRolePage.IsRoleVisible(roleName);
		expect(roleVisible).toBe(true);

		await poManager.organizationUserRolePage.GoToRole(roleName);

		await page.locator('[data-testid="expand-button-Organizations"]').click();
		await expect(page.getByText('Organization Affiliation')).toBeVisible();

		const affSwitch = page.locator('[data-testid="switch-button-Organization Affiliation"] input');
		const isChecked = await affSwitch.isChecked();

		expect(isChecked).toBe(true);
	});

	test('Organization Affiliate should visible/OFF for non-Administrator role', async ({ page }) => {
		const roleName = 'FRONTDESK';
		const url = `${playwrightConfig.baseURL}organization/${managingOrgId}`;
		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.usersAndRolesNav().click();
		await poManager.organizationUserRolePage.GoToRolePage();

		// Find role
		const roleVisible = await poManager.organizationUserRolePage.IsRoleVisible(roleName);
		expect(roleVisible).toBe(true);

		await poManager.organizationUserRolePage.GoToRole(roleName);

		await page.locator('[data-testid="expand-button-Organizations"]').click();
		await expect(page.getByText('Organization Affiliation')).toBeVisible();

		const affSwitch = page.locator('[data-testid="switch-button-Organization Affiliation"] input');
		const isChecked = await affSwitch.isChecked();

		expect(isChecked).toBe(false);
	});

	test('Organization Affiliate should visible/OFF for new role', async ({ page }) => {
		customRoleName = 'CUSTOM_ROLE_' + Date.now();
		const url = `${playwrightConfig.baseURL}organization/${managingOrgId}`;
		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.usersAndRolesNav().click();
		await poManager.organizationUserRolePage.GoToRolePage();
		await poManager.organizationUserRolePage.AddNewRole(customRoleName);

		await page.locator('[data-testid="expand-button-Organizations"]').click();
		await expect(page.getByText('Organization Affiliation')).toBeVisible();

		let affSwitch = page.locator('[data-testid="switch-button-Organization Affiliation"] input');
		let isChecked = await affSwitch.isChecked();
		expect(isChecked).toBe(false);

		await page.locator('[data-testid="edit-button-Organization Affiliation"]').click();

		affSwitch = page.locator('[data-testid="switch-button-Organization Affiliation"] input');
		isChecked = await affSwitch.isChecked();
		expect(isChecked).toBe(true);

		await poManager.organizationUserRolePage.SaveRole();

		// Wait for the role to be saved and page to refresh
		await page.waitForTimeout(5000);

		await sidebar.menuIcon('home').click();

		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.usersAndRolesNav().click();
		await poManager.organizationUserRolePage.GoToRolePage();

		// Verify the role is created and visible
		const roleVisible = await poManager.organizationUserRolePage.IsRoleVisible(customRoleName);
		expect(roleVisible).toBe(true);

		await poManager.organizationUserRolePage.GoToRole(customRoleName);

		await page.locator('[data-testid="expand-button-Organizations"]').click();
		await expect(page.getByText('Organization Affiliation')).toBeVisible();

		affSwitch = page.locator('[data-testid="switch-button-Organization Affiliation"] input');
		isChecked = await affSwitch.isChecked();

		expect(isChecked).toBe(true);
	});

	test.afterEach(async ({ page }) => {
		if (customRoleName) {
			try {
				await DeleteRole(managingOrgId, customRoleName);
				console.log(`Role ${customRoleName} deleted successfully.`);
			} catch (error) {
				console.warn(`Failed to delete role ${customRoleName}:`, error);
			} finally {
				customRoleName = null;
			}
		}
	});
});

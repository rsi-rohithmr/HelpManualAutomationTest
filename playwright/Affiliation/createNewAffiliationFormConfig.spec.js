const { test, expect } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { Sidebar } = require('../POM/sidebar');
const { orgGenerator } = require('../generators/organizationGenerator');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

test.describe.serial('Organization Affiliate config Tests', () => {
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;

	let poManager = null;
	let sidebar = null;
	let childName = null;

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
		sidebar = new Sidebar(page);
		await poManager.loginPage.loginOmegaAI();
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate9DigitRandNum();

		const organizationPayload = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			'AffiliationE2E ' + randNum,
			managingOrgId
		);
		const child = await orgGenerator.postOrganization(organizationPayload); // Assert that child is not null
		expect(child).not.toBeNull();
		expect(child.total).toBe(1);
		expect(child.entry[0].resource.id).not.toBeNull();
		// let childId = child.entry[0].resource.id;
		childName = child.entry[0].resource.name;

		const url = `${playwrightConfig.baseURL}organization/${managingOrgId}`;
		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.affiliationsNav().click();

		await poManager.organizationAffiliationPage.page.waitForTimeout(5000);

		// Remove all affiliations if multiple remove buttons are present
		let removeButtons = await poManager.organizationAffiliationPage.removeAffiliationButton().count();
		while (removeButtons > 0) {
			// Click the first visible remove button
			await poManager.organizationAffiliationPage.removeAffiliationButton().first().click();
			await poManager.page.waitForTimeout(1000);
			await poManager.organizationAffiliationPage.confirmRemoveAffiliationButton().click();
			await poManager.page.waitForTimeout(5000);
			// Re-evaluate the count after removal
			removeButtons = await poManager.organizationAffiliationPage.removeAffiliationButton().count();
		}
	});

	test('Create new affiliation - Button to be Visible', async ({ page }) => {
		const isVisible = await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().isVisible();
		expect(isVisible).toBe(true);
	});

	test('Create new affiliation - Affiliation Form Config', async ({ page }) => {
		const potentialAffiliateOrgName = childName; // Use the generated child organization name
		const isVisible = await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().isVisible();
		expect(isVisible).toBe(true);
		const currentAffiliationCount = await poManager.organizationAffiliationPage.getAffiliationsCount();

		await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.affiliateOrganizationNameInput().click();
		await poManager.organizationAffiliationPage.affiliateOrganizationNameInput().type(potentialAffiliateOrgName);
		await poManager.organizationAffiliationPage.page.waitForTimeout(2000);

		// Click the first option from the dropdown
		const firstDropdownOption = poManager.organizationAffiliationPage.page.locator('[role="option"]').first();
		await firstDropdownOption.click();
		await poManager.page.waitForTimeout(5000);

		await poManager.organizationAffiliationPage.applySingleRoleCheckbox().click();

		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.selectSingleRole('FRONTDESK');
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.createNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.confirmCreateAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(5000);

		const newAffiliationCount = await poManager.organizationAffiliationPage.getAffiliationsCount();
		expect(newAffiliationCount).toBe(currentAffiliationCount + 1);
	});

	test('Create new affiliation - Load Create Affiliation Form', async ({ page }) => {
		const isVisible = await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().isVisible();
		expect(isVisible).toBe(true);
		await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);
		await poManager.organizationAffiliationPage.createOrEditAffiliationFormHeader().isVisible();
		const headerText = await poManager.organizationAffiliationPage
			.createOrEditAffiliationFormHeader()
			.textContent();
		expect(headerText).toBe('Create New Affiliation');
	});

	test('Create new affiliation - Load Create Affiliation Form after Add Affiliation', async ({ page }) => {
		const isVisible = await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().isVisible();
		expect(isVisible).toBe(true);

		const addAffiliationButton = await poManager.organizationAffiliationPage.addAffiliationButton().first();
		addAffiliationButton.click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.confirmCreateAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(5000);

		await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.createOrEditAffiliationFormHeader().isVisible();
		const headerText = await poManager.organizationAffiliationPage
			.createOrEditAffiliationFormHeader()
			.textContent();
		expect(headerText).toBe('Create New Affiliation');
	});
});

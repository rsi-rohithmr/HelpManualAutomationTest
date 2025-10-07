const { test, request, expect } = require('@playwright/test');
const playwrightConfig = require('../../playwright.config');

const { POManager } = require('../POM/POManager');
const { orgGenerator } = require('../generators/organizationGenerator');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { DeleteOrganization } = require('../DBUtils/OrganizationQuery');

test.describe.serial('Organization Affiliate Access Tests', () => {
	const roleName = 'USER';
	const testPrefix = 'Organization Affiliate UAC ';

	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let child1Id = null,
		child1Name = null,
		studyApi = null;

	const uacManagingOrgId = playwrightConfig.uacManagingOrg.organizationId;
	const uacManagingOrgName = playwrightConfig.uacManagingOrg.organizationName;
	let uacChild1Id = null,
		uacChild1Name = null,
		uacChild2Id = null,
		uacChild2Name = null;

	let poManager = null;

	let studyInfo1 = null,
		studyInfo2 = null,
		studyInfo3 = null,
		studyInfo4 = null;

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		studyApi = new postStudyNGetToken(apiContext);

		let organizationPayload = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			testPrefix + managingOrgName,
			{ id: managingOrgId, name: managingOrgName }
		);
		const child1 = await orgGenerator.postOrganization(organizationPayload); // Assert that child1 is not null
		expect(child1).not.toBeNull();
		expect(child1.total).toBe(1);
		expect(child1.entry[0].resource.id).not.toBeNull();
		child1Id = child1.entry[0].resource.id;
		child1Name = child1.entry[0].resource.name;

		let uacOrganizationPayload = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			testPrefix + uacManagingOrgName,
			{ id: uacManagingOrgId, name: uacManagingOrgName }
		);
		const uacChild1 = await orgGenerator.postOrganization(uacOrganizationPayload); // Assert that child1 is not null
		expect(uacChild1).not.toBeNull();
		expect(uacChild1.total).toBe(1);
		expect(uacChild1.entry[0].resource.id).not.toBeNull();
		uacChild1Id = uacChild1.entry[0].resource.id;
		uacChild1Name = uacChild1.entry[0].resource.name;

		uacOrganizationPayload = await orgGenerator.generateOrganizationPayload(
			true,
			true,
			true,
			true,
			testPrefix + uacChild1Name,
			{
				id: uacChild1Id,
				name: uacChild1Name,
			}
		);
		const uacChild2 = await orgGenerator.postOrganization(uacOrganizationPayload); // Assert that child1 is not null
		expect(uacChild2).not.toBeNull();
		expect(uacChild2.total).toBe(1);
		expect(uacChild2.entry[0].resource.id).not.toBeNull();
		uacChild2Id = uacChild2.entry[0].resource.id;
		uacChild2Name = uacChild2.entry[0].resource.name;

		// Generate a study in the managing organization

		await studyApi
			.postStudy(
				null,
				null,
				null,
				false,
				{
					id: uacChild1Id,
					name: uacChild1Name,
				},
				{
					id: uacChild1Id,
					name: uacChild1Name,
				}
			)
			.then(result => {
				console.log('The Study Info ', result);
				studyInfo1 = result;
			});

		await studyApi
			.postStudy(
				null,
				null,
				null,
				false,
				{
					id: uacManagingOrgId,
					name: uacManagingOrgName,
				},
				{
					id: uacManagingOrgId,
					name: uacManagingOrgName,
				}
			)
			.then(result => {
				console.log('The Study Info ', result);
				studyInfo2 = result;
			});

		await studyApi
			.postStudy(
				null,
				null,
				null,
				false,
				{
					id: uacChild1Id,
					name: uacChild1Name,
				},
				{
					id: uacChild1Id,
					name: uacChild1Name,
				}
			)
			.then(result => {
				console.log('The Study Info ', result);
				studyInfo3 = result;
			});

		await studyApi
			.postStudy(
				null,
				null,
				null,
				false,
				{
					id: uacChild2Id,
					name: uacChild2Name,
				},
				{
					id: uacChild2Id,
					name: uacChild2Name,
				}
			)
			.then(result => {
				console.log('The Study Info ', result);
				studyInfo4 = result;
			});
	});

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
	});

	// test('Organization Affiliate - Generate Childs for Main organization', async ({ page }) => {});

	test('Organization Affiliate - Login to second Master and create aff connection to main Org', async ({ page }) => {
		// Login to OmegaAI and setup the organization affiliation
		await poManager.loginPage.loginOmegaAI();

		const url = `${playwrightConfig.baseURL}organization/${uacChild1Id}`;
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
			await poManager.page.waitForTimeout(1000);
			// Re-evaluate the count after removal
			removeButtons = await poManager.organizationAffiliationPage.removeAffiliationButton().count();
		}

		// Check if the "Create New Affiliation" button is visible
		const isVisible = await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().isVisible();
		expect(isVisible).toBe(true);

		const currentAffiliationCount = await poManager.organizationAffiliationPage.getAffiliationsCount();

		// Click the button to create a new affiliation
		await poManager.organizationAffiliationPage.IsCreateNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.affiliateOrganizationNameInput().click();
		await poManager.organizationAffiliationPage.affiliateOrganizationNameInput().type(child1Name);
		await poManager.organizationAffiliationPage.page.waitForTimeout(2000);

		// Click the first option from the dropdown
		const firstDropdownOption = poManager.organizationAffiliationPage.page.locator('[role="option"]').first();
		await firstDropdownOption.click();
		await poManager.page.waitForTimeout(5000);

		await poManager.organizationAffiliationPage.applySingleRoleCheckbox().click();

		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.selectSingleRole(roleName);
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.createNewAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(1000);

		await poManager.organizationAffiliationPage.confirmCreateAffiliationButton().click();
		await poManager.organizationAffiliationPage.page.waitForTimeout(5000);

		const newAffiliationCount = await poManager.organizationAffiliationPage.getAffiliationsCount();
		expect(newAffiliationCount).toBe(currentAffiliationCount + 1);
	});

	test('Organization Affiliate - Main organization"s user should be able to see studies created in Main organization', async ({
		page,
	}) => {
		expect(studyInfo1).not.toBeNull();

		// Login to OmegaAI as a user from the affiliated organization
		await poManager.loginPage.loginOmegaAI();
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo1?.patientName);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo1?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Organization Affiliate - Affiliate organization"s user unable to see studies created in parent of Main organization', async ({
		page,
	}) => {
		expect(studyInfo2).not.toBeNull();

		// Login to OmegaAI as a user from the affiliated organization
		await poManager.loginPage.loginOmegaAIUser04();
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo2?.patientName);
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo2?.patientName}$`, 'g'))
		).toHaveCount(0);
	});

	test('Organization Affiliate - Affiliate organization"s user should be able to see studies created in Main organization', async ({
		page,
	}) => {
		expect(studyInfo3).not.toBeNull();

		// Login to OmegaAI as a user from the affiliated organization
		await poManager.loginPage.loginOmegaAIUser04();
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo3?.patientName);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo3?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Organization Affiliate - Affiliate organization"s user should be able to see studies created in child of Main organization', async ({
		page,
	}) => {
		expect(studyInfo4).not.toBeNull();

		// Login to OmegaAI as a user from the affiliated organization
		await poManager.loginPage.loginOmegaAIUser04();
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo4?.patientName);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo4?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Organization Affiliate - User list should be count', async ({ page }) => {
		await poManager.loginPage.loginOmegaAI();

		const url = `${playwrightConfig.baseURL}organization/${uacChild1Id}`;
		await page.goto(url, { waitUntil: 'load' });
		await poManager.organizationDetailPage.affiliationsNav().click();

		await poManager.organizationAffiliationPage.page.waitForTimeout(5000);

		const userButton = await poManager.organizationAffiliationPage.getUserListButton();
		expect(userButton).not.toBeNull();
		await userButton.first().click();

		await poManager.page.waitForTimeout(5000);

		const affiliatedTable = await poManager.organizationAffiliationPage.getAffiliatedTable();
		expect(affiliatedTable).not.toBeNull();
	});

	test('Organization Affiliate - Affiliate organization"s user unable to see studies after un-link', async ({
		page,
	}) => {
		await poManager.loginPage.loginOmegaAI();

		const url = `${playwrightConfig.baseURL}organization/${uacChild1Id}`;
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
			await poManager.page.waitForTimeout(1000);
			// Re-evaluate the count after removal
			removeButtons = await poManager.organizationAffiliationPage.removeAffiliationButton().count();
		}

		await poManager.page.waitForTimeout(5000);
		await poManager.loginPage.logoutOmegaAI();
		await poManager.page.waitForTimeout(30000);

		// Login to OmegaAI as a user from the affiliated organization
		await poManager.loginPage.loginOmegaAIUser04();
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo4?.patientName);
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo4?.patientName}$`, 'g'))
		).toHaveCount(0);
	});

	test.afterEach(async () => {
		await poManager.loginPage.logoutOmegaAI();
	});

	test.afterAll(async () => {
		// Delete the created organizations and studies
		if (child1Id) await DeleteOrganization(child1Id);
		if (uacChild1Id) await DeleteOrganization(uacChild1Id);
		if (uacChild2Id) await DeleteOrganization(uacChild2Id);
	});
});

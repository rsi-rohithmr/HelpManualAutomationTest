const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
test.describe.serial('Worklist Study Status List Test', () => {
	let studyInfo = {};
	let browser;
	let page;
	
	test.beforeAll(async () => {
		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);

		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		console.log(studyInfo.studyId);
	});

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		const url = `${playwrightConfig.baseURL}organization/${playwrightConfig.managingOrg.organizationId}/users`;
		await page.goto(url, { waitUntil: 'load' });
	});

	test('Worklist Study Status - Should list all study status when Override Study Status transition is enabled', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.worklistStudyStatus.UserAndRolesLink().click();
		var rolesButton = poManager.worklistStudyStatus.RolesBtn();
		await rolesButton.hover();  
		await page.waitForTimeout(2000); 
		await rolesButton.click();
		await poManager.worklistStudyStatus.SearchFilter().click();
		await poManager.worklistStudyStatus.SearchFilter().fill('Administrator');
		await poManager.worklistStudyStatus.AdministratorRoleCheckbox().check();
		await poManager.worklistStudyStatus.RoleText().nth(1).click();
		await poManager.worklistStudyStatus.AdministratorRoleRow().hover();
		await poManager.worklistStudyStatus.AdministratorRoleEditBtn().click();
		await poManager.worklistStudyStatus.MainLevelOrganization().nth(1).click();
		await poManager.worklistStudyStatus.SecondaryLevelStudyStatus().nth(1).click();
		var checkbox = poManager.worklistStudyStatus.OverrideStudyStatusTransitionCheckBox();
		
		var isChecked = await checkbox.isChecked();
		if (!isChecked)
		{
			await checkbox.check(); 
			await poManager.worklistStudyStatus.PrivilegeSaveBtn().click();
		}
		await poManager.worklistStudyStatus.WorklistMenuLink().click();
		await page.waitForTimeout(5000); 
		var worklistSearch = poManager.worklistStudyStatus.WorklistSearch();
		await worklistSearch.click();
		await worklistSearch.fill(studyInfo.studyId);
		await worklistSearch.press('Enter');
		await page.waitForTimeout(2000); 
		await poManager.worklistStudyStatus.StudyStatusLink().waitFor({ state: 'visible'});
		await poManager.worklistStudyStatus.StudyStatusLink().hover();
		await poManager.worklistStudyStatus.StudyStatusLink().click();
		await page.waitForTimeout(2000); 
		//Check whether the study stataus which does not fall under the Transition min and max are also visible.
		await expect(poManager.worklistStudyStatus.RequestedStudyStatus()).toBeVisible();
		await expect(poManager.worklistStudyStatus.OrderedStudyStatus()).toBeVisible();
		await expect(poManager.worklistStudyStatus.ToBeAmendedStudyStatus()).toBeVisible();
		await expect(poManager.worklistStudyStatus.SignedStudyStatus()).toBeVisible();
		//Check whether the allowed study statuses are visible.
		await expect(poManager.worklistStudyStatus.ArrivedStudyStatus()).toBeVisible();
		await expect(poManager.worklistStudyStatus.ConfirmedStudyStatus()).toBeVisible();
		await poManager.worklistStudyStatus.RequestedStudyStatus().click();
		await page.waitForTimeout(4000);
		await expect(poManager.worklistStudyStatus.SuccessfullyUpdatedStudyStatusText()).toBeVisible();
	});
	test('Worklist Study Status - Should List Study Status based on Override Study Status Transition Switch', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.worklistStudyStatus.UserAndRolesLink().click();
		var rolesButton = poManager.worklistStudyStatus.RolesBtn();
		await rolesButton.hover();  
		await page.waitForTimeout(2000); 
		await rolesButton.click();
		await poManager.worklistStudyStatus.SearchFilter().click();
		await poManager.worklistStudyStatus.SearchFilter().fill('Administrator');
		await poManager.worklistStudyStatus.AdministratorRoleCheckbox().check();
		await poManager.worklistStudyStatus.RoleText().nth(1).click();
		await poManager.worklistStudyStatus.AdministratorRoleRow().hover();
		await poManager.worklistStudyStatus.AdministratorRoleEditBtn().click();
		await poManager.worklistStudyStatus.MainLevelOrganization().nth(1).click();
		await poManager.worklistStudyStatus.SecondaryLevelStudyStatus().nth(1).click();
		var checkbox = poManager.worklistStudyStatus.OverrideStudyStatusTransitionCheckBox();
		
		await checkbox.uncheck();
		await poManager.worklistStudyStatus.PrivilegeSaveBtn().click();
		await poManager.worklistStudyStatus.WorklistMenuLink().click();
		await page.waitForTimeout(5000); 
		var worklistSearch = poManager.worklistStudyStatus.WorklistSearch();
		await worklistSearch.click();
		await worklistSearch.fill(studyInfo.studyId);
		await worklistSearch.press('Enter');
		await page.waitForTimeout(2000); 
		await poManager.worklistStudyStatus.StudyStatusLink().waitFor({ state: 'visible'});
		await poManager.worklistStudyStatus.StudyStatusLink().hover();
		await poManager.worklistStudyStatus.StudyStatusLink().click();
		await page.waitForTimeout(2000); 
		//Check whether the study stataus which does not fall under the Transition min and max are not visible.
		await expect(poManager.worklistStudyStatus.RequestedStudyStatus()).not.toBeVisible();
		await expect(poManager.worklistStudyStatus.OrderedStudyStatus()).not.toBeVisible();
		await expect(poManager.worklistStudyStatus.ToBeAmendedStudyStatus()).not.toBeVisible();
		await expect(poManager.worklistStudyStatus.SignedStudyStatus()).not.toBeVisible();
		//Check whether the allowed study statuses are visible or not.
		await expect(poManager.worklistStudyStatus.ArrivedStudyStatus()).toBeVisible();
		await expect(poManager.worklistStudyStatus.ConfirmedStudyStatus()).toBeVisible();
		await poManager.worklistStudyStatus.ArrivedStudyStatus().click();
		await page.waitForTimeout(4000);
		await expect(poManager.worklistStudyStatus.SuccessfullyUpdatedStudyStatusText()).toBeVisible();
	});
});

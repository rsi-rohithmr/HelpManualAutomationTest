const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');
// test.describe.serial('Lock Study Worklist  Test', () => {
// 	let studyInfo = {};
// 	let api;
// 	const filePath = path.relative(
// 		process.cwd(),
// 		path.join(__dirname, '../TestData/dicomImport/prior/PRIOR_STUDY1-1.DCM')
// 	);
// 	test.beforeAll(async () => {
// 		const apiContext = await request.newContext();
// 		api = new postStudyNGetToken(apiContext);
// 		await api.postStudy().then(result => {
// 			console.log('Posted study', result);
// 			studyInfo = result;
// 		});
// 		await api.importDICOM(filePath, studyInfo.studyId);
// 	});

// 	test.beforeEach(async ({ page }) => {
// 		const poManager = new POManager(page);
// 		await poManager.loginPage.loginOmegaAI();
// 		const url = `${playwrightConfig.baseURL}organization/${playwrightConfig.managingOrg.organizationId}/users`;
// 		await page.goto(url, { waitUntil: 'load' });
// 	});

// 	test('Lock Study Worklist Test- Should not allow change study status when Modification Prevent Study lock is disable', async ({ page }) => {
// 		const poManager = new POManager(page);
// 		await poManager.worklistStudyStatus.UserAndRolesLink().click();
// 		var rolesButton = poManager.worklistStudyStatus.RolesBtn();
// 		await rolesButton.hover();  
// 		await page.waitForTimeout(2000); 
// 		await rolesButton.click();
// 		await poManager.worklistStudyStatus.SearchFilter().click();
// 		await poManager.worklistStudyStatus.SearchFilter().fill('Administrator');
// 		await poManager.worklistStudyStatus.AdministratorRoleCheckbox().check();
// 		await poManager.worklistStudyStatus.RoleText().nth(1).click();
// 		await poManager.worklistStudyStatus.AdministratorRoleRow().hover();
// 		await poManager.worklistStudyStatus.AdministratorRoleEditBtn().click();
// 		await poManager.worklistStudyStatus.MainLevelOrganization().nth(1).click();
// 		await poManager.worklistStudyStatus.SecondaryLevelStudyStatus().nth(1).click();
// 		var checkbox = poManager.worklistStudyStatus.ModifyLockedStudyCheckBox();
// 		var isChecked = await checkbox.isChecked();
// 		if (isChecked)
// 		{
// 			await checkbox.uncheck();
// 			await poManager.worklistStudyStatus.PrivilegeSaveBtn().click();
// 		}
// 		// Importing DICOM to prior study is expected to throw an error
// 		let didCatch = false;
// 		try {
// 			await api.importDICOM(filePath, studyInfo.studyId);
// 		} catch (err) {
//  			didCatch = true;
// 		}
// 		// Check if the study is locked from worklist
// 		await poManager.worklistStudyStatus.WorklistMenuLink().click();
// 		await page.waitForTimeout(5000); 
// 		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', playwrightConfig.managingOrg.organizationName);
// 		var worklistSearch = poManager.worklistStudyStatus.WorklistStatusSearch();
// 		await worklistSearch.click();
// 		await worklistSearch.fill('PRIOR');
// 		await page.getByRole('option', { name: 'PRIOR' }).click();
// 		await page.waitForTimeout(2000); 
// 		await poManager.worklistStudyStatus.StudyStatusLink().waitFor({ state: 'visible'});
// 		await poManager.worklistStudyStatus.StudyStatusLink().hover();
// 		await poManager.worklistStudyStatus.StudyStatusLink().click();
// 		await page.waitForTimeout(1000);
// 		expect(didCatch).toBe(true);
// 		await expect(page.getByText('The study is currently locked')).toBeVisible();
// 	});
// 	test('Lock Study Worklist Test - Should allow change study status when Modification Prevent Study lock is enabled', async ({ page }) => {
// 		const poManager = new POManager(page);
// 		await poManager.worklistStudyStatus.UserAndRolesLink().click();
// 		var rolesButton = poManager.worklistStudyStatus.RolesBtn();
// 		await rolesButton.hover();  
// 		await page.waitForTimeout(2000); 
// 		await rolesButton.click();
// 		await poManager.worklistStudyStatus.SearchFilter().click();
// 		await poManager.worklistStudyStatus.SearchFilter().fill('Administrator');
// 		await poManager.worklistStudyStatus.AdministratorRoleCheckbox().check();
// 		await poManager.worklistStudyStatus.RoleText().nth(1).click();
// 		await poManager.worklistStudyStatus.AdministratorRoleRow().hover();
// 		await poManager.worklistStudyStatus.AdministratorRoleEditBtn().click();
// 		await poManager.worklistStudyStatus.MainLevelOrganization().nth(1).click();
// 		await poManager.worklistStudyStatus.SecondaryLevelStudyStatus().nth(1).click();
// 		var checkbox = poManager.worklistStudyStatus.ModifyLockedStudyCheckBox();
		
// 		var isChecked = await checkbox.isChecked();
// 		if (!isChecked)
// 		{
// 			await checkbox.check(); 
// 			await poManager.worklistStudyStatus.PrivilegeSaveBtn().click();
// 		}

// 		await poManager.worklistStudyStatus.WorklistMenuLink().click();
// 		await page.waitForTimeout(5000); 
// 		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', playwrightConfig.managingOrg.organizationName);
// 		var worklistSearch = poManager.worklistStudyStatus.WorklistStatusSearch();
// 		await worklistSearch.click();
// 		await worklistSearch.fill('PRIOR');
// 		await page.getByRole('option', { name: 'PRIOR' }).click();
// 		await page.waitForTimeout(2000); 
// 		await poManager.worklistStudyStatus.StudyStatusLink().waitFor({ state: 'visible'});
// 		await poManager.worklistStudyStatus.StudyStatusLink().hover();
// 		await poManager.worklistStudyStatus.StudyStatusLink().click();
// 		await page.waitForTimeout(1000);
// 		await expect(page.getByText('The study is currently locked')).not.toBeVisible();
// 	});
// });

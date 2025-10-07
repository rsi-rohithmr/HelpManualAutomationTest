const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');

test.describe('Worklist Selector - Role', () => {
	let worklistArray = [];
	let globalResponse;
	let page;
	let browser;
	const managingOrgName = 'RAMSOFT';
	test.beforeEach(async ({ }) => {
        // Turn off FF before testing for selector
		browser = await chromium.launch();
		page = await browser.newPage();
        await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
            const response = await route.fetch();
            const bodyJson = await response.json(); // Parse response JSON
            if (bodyJson.features && bodyJson.features['maven-2686-new-worklist-toggle']) {
                bodyJson.features['maven-2686-new-worklist-toggle'].variationName = 'Variation On';
                bodyJson.features['maven-2686-new-worklist-toggle'].variationKey = 'variation-on';
            }
 
            if (bodyJson.variables && bodyJson.variables['maven-2686-new-worklist-toggle']) {
                bodyJson.variables['maven-2686-new-worklist-toggle'].value = true;
            }
 
            // Fulfill request with modified data
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                body: JSON.stringify(bodyJson),
            });
        });
 
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAIUserReferring01();
        // wait for 1 min before doing anything because there could be api slowness
        await page.waitForTimeout(30000);
 
        await expect(page.getByText('Try New Worklist')).toBeVisible();
 
        await page.getByText('Try New Worklist').click();
 
        expect(page.getByText('Try New Worklist')).toBeChecked();
    });

	test.afterAll(async ({}) => {
		if (worklistArray.length > 0) {
			const apiContext = await request.newContext();
			const poManager = new POManager(page, apiContext);
			for (const wl of worklistArray) {
				console.log('Deleting worklist with ID:', wl.id);
				await poManager.apiRequests.deleteRoleWorklistWithID(wl.id);
			}
		}
	});

	test('Should be able to create/search/filter role worklist - worklist selector', async ({ }) => {
		const poManager = new POManager(page);

		//============ START - Create Role WL =================
		// Generate a random number between 1111 and 9999
		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		const newRoleWlName = 'TEST WL SELECTOR - ' + randomNum;
		let roleName = 'ADMINISTRATOR';
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();
		await worklistSelectorDropdown.click();

		// // Click button add user worklist
		await page.waitForTimeout(3000);
		await expect(page.getByText('Create Role Worklist')).toBeVisible();
		page.getByText('Create Role Worklist').click();

		await page.waitForTimeout(5000); // Waiting for background requests to complete
		await poManager.worklistSettings.roleWorklistHeader(true).waitFor({ state: 'visible' });
		await Promise.all([
			await poManager.worklistSettings.organizationCombo().clear(),
			await poManager.worklistSettings.organizationCombo().fill(managingOrgName),
			poManager.apiWaitUtils.waitForAPI('organization?_count=50&_sort=name&_summary=true', 'GET'),
		]);

		await Promise.all([
			await page.locator('#autocomplete-field-Organization-option-0').click(),
			poManager.apiWaitUtils.waitForAPI('Role?_count=50&_sort=name&active=true&organization=', 'GET'),
		]);

		roleName = await page.locator('#form-field-Role').innerText();
		await poManager.worklistSettings.roleWorklistNameTxt().fill(newRoleWlName);

		// Add required columns
		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Accession #'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Managing Organization'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Patient Name'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Study Status'
		);

		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.common.selectOptionFromSingleSelectionSuggestion(
			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
			'Priority'
		);

		await page.route('**/fhir/WorklistLayout?*', route => route.continue());

		const waitForResponsePromise = poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'POST');
		await Promise.all([
			poManager.worklistSettings.saveNewWorklistBtn().click(),
			waitForResponsePromise,
		]);
		globalResponse = await waitForResponsePromise;
		console.log('created worklistID is', globalResponse.id);
		worklistArray.push({id : globalResponse.id, name : newRoleWlName});
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
		//============ END - Create Role WL =================

		await page.waitForTimeout(5000); // Waiting for background requests to complete

		//============ START - Search by worklist name =================
		await worklistSelectorDropdown.click();
		await page.getByTestId('worklist-selector-role-worklist').click();

		const inputWlNameText = page.locator('input#input-with-icon-textfield');
		await inputWlNameText.fill(newRoleWlName);
		await poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'GET');
		const findWl = page.locator('li', { hasText: newRoleWlName });
		await expect(findWl).toBeVisible();
		//============ END - Search by worklist name =================

		//============ START - Search by role  =================
		inputWlNameText.fill(roleName);
		await poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'GET');
		const findByRoleWl = page.locator('li', { hasText: newRoleWlName });
		await expect(findByRoleWl).toBeVisible();
		//============ END - Search Role WL =================

		// Comment out to improve test since testing account has not assigned to any organization
		// // Edit Worklist
		// await findByRoleWl.hover();
		// const editButton = findByRoleWl.locator('[data-testid="EditOutlinedIcon"]');
		// await expect(editButton).toBeVisible();

		// let waitForRoleResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/Role', 'GET');
		// await editButton.click();
		// await waitForRoleResponsePromise;
		// await page.waitForTimeout(3000);

		// const saveButton = poManager.worklistSettings.saveExistingWorklistArrowIcon();
		// await expect(saveButton).toBeVisible();
		// await saveButton.click();

		// const saveAsNewWorklistBtn = page.locator('li', { hasText : 'DUPLICATE FOR A NEW WORKLIST'});
		// await expect(saveAsNewWorklistBtn).toBeVisible();
		// waitForRoleResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/Role', 'GET');
		// saveAsNewWorklistBtn.click();
		// await waitForRoleResponsePromise;
		// await page.waitForTimeout(3000);
	
		// // Select Role
		// const rolesDropdown = page.locator('[data-testid="form-field"]', {
		// 	has: page.locator('label', { hasText : 'Roles' })
		// });
		// await expect(rolesDropdown).toBeVisible();
		// await rolesDropdown.click();
		// await page.locator('li[role="option"]', { hasText: roleName }).click();

		// // Close dropdown
		// await page.locator('#menu-roles').click();

		// // Duplicate worklist
		// const duplicateWlName = newRoleWlName + '- Duplicated';
		// // Fill duplicate name wl
		// const roleWorklistNameInput = page.getByPlaceholder('Worklist Name');
		// await expect(roleWorklistNameInput).toBeVisible();
		// await roleWorklistNameInput.fill(duplicateWlName);

		// // Save
		// const saveDuplicateBtn = page.getByTestId('Save_');
		// await expect(saveDuplicateBtn).toBeVisible();
		// const waitForDuplicateResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/', 'POST');
		// await Promise.all([
		// 	saveDuplicateBtn.click(),
		// 	waitForDuplicateResponsePromise,
		// ]);
		// globalResponse = await waitForDuplicateResponsePromise;
		// console.log('posted duplicate worklist', globalResponse);
		// if(globalResponse?.entry?.[0]?.resource?.id) {
		// 	worklistArray.push({id : globalResponse?.entry?.[0]?.resource?.id, name : duplicateWlName});
		// }
		// await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
	});
});
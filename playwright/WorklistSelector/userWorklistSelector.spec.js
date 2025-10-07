const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe('Worklist Selector - User', () => {
	let worklistIDArray = [];
	let globalResponse;
	let page;
	let browser;
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
		if (worklistIDArray.length > 0) {
			const apiContext = await request.newContext();
			const poManager = new POManager(page, apiContext);
			for (const id of worklistIDArray) {
				console.log('Deleting worklist with ID:', id);
				await poManager.apiRequests.deleteRoleWorklistWithID(id);
			}
		}
	});

	test('Should be able to create/search/filter/duplicate user worklist - worklist selector', async ({ }) => {
		const poManager = new POManager(page);

		//============ START - Create User WL =================
		// Generate a random number between 1111 and 9999
		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		const newUserWlName = 'TEST WL SELECTOR - ' + randomNum;
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();
		await worklistSelectorDropdown.click();

		// Click button add user worklist
		await page.waitForTimeout(3000);
		await expect(page.getByText('Create User Worklist')).toBeVisible();
		page.getByText('Create User Worklist').click();

		// Input new worklist name
		await poManager.worklistSettings.userWorklistNameTxt().fill(newUserWlName);
		await page.waitForTimeout(3000);

		// Add column into new worklist
		const columns = ['Accession #', 'Managing Organization', 'Patient Name', 'Study Status', 'Priority'];

		for (const column of columns) {
			await poManager.worklistSettings.addColumnBtn().click();
			await poManager.common.selectOptionFromSingleSelectionSuggestion(
				poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(0),
				column
			);
		}
		
		await page.route('**/fhir/WorklistLayout?*', async route => {
			await route.continue();
		});

		const waitForResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'POST');
		await Promise.all([
			poManager.worklistSettings.saveNewWorklistBtn().click(),
			waitForResponsePromise,
		]);
		globalResponse = await waitForResponsePromise;
		console.log('posted worklist', globalResponse);
		worklistIDArray.push(globalResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
		//============ END - Create User WL =================

		await page.waitForTimeout(5000); // Waiting for background requests to complete

		//============ START - Select other worklist =================
		await worklistSelectorDropdown.click();
		const firstMenuItem = page.locator('.worklist-selector-menu-item').first();
		await firstMenuItem.click();
		await page.waitForTimeout(5000);
		//============ END - Select other worklist =================

		//============ START - Search by worklist name =================
		await worklistSelectorDropdown.click();
		await page.getByTestId('worklist-selector-user-worklist').click();

		const inputWlNameText = page.locator('input#input-with-icon-textfield');
		await inputWlNameText.fill(newUserWlName);
		await poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'GET');
		const findWl = page.locator('li', { hasText: newUserWlName });
		await expect(findWl).toBeVisible();
		//============ END - Search by worklist name =================

		// Edit Worklist
		await findWl.hover();
		const editButton = findWl.locator('[data-testid="EditOutlinedIcon"]');
		await expect(editButton).toBeVisible();
		await editButton.click();

		// Duplicate worklist
		await page.waitForTimeout(3000);
		const duplicateWlName = newUserWlName + '- Duplicated';
		const saveButton = poManager.worklistSettings.saveExistingWorklistArrowIcon();
		await expect(saveButton).toBeVisible();
		await saveButton.click();

		const saveAsNewWorklistBtn = page.locator('li', { hasText : 'SAVE AS NEW WORKLIST'});
		await expect(saveAsNewWorklistBtn).toBeVisible();
		await expect(saveAsNewWorklistBtn).toBeEnabled();
		saveAsNewWorklistBtn.click({ force: true });

		// Fill duplicate name wl
		const duplicateInputNameElement = page.getByLabel('Type Worklist Name');
		await expect(duplicateInputNameElement).toBeVisible();
		await duplicateInputNameElement.fill(duplicateWlName);

		// Save
		const saveDuplicateBtn = page.getByTestId('Save_');
		await expect(saveDuplicateBtn).toBeVisible();
		const waitForDuplicateResponsePromise = poManager.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'POST');
		await Promise.all([
			saveDuplicateBtn.click(),
			waitForDuplicateResponsePromise,
		]);
		globalResponse = await waitForDuplicateResponsePromise;
		console.log('posted duplicate worklist', globalResponse);
		worklistIDArray.push(globalResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
		await page.waitForTimeout(5000);
		await expect(page.getByText(duplicateWlName)).toBeVisible();
	});

	test('Should be able to create worklist with filters and sorting', async ({ }) => {
		const poManager = new POManager(page);

		// Generate a random number between 1111 and 9999
		const randomNum = poManager.apiRequests.generateRandomNumber(1111, 9999);
		const newUserWlName = 'TEST WL SELECTOR - ' + randomNum;
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();
		await worklistSelectorDropdown.click();

		// Click button add user worklist
		await expect(page.getByText('Create User Worklist')).toBeVisible();
		page.getByText('Create User Worklist').click();

		// Input new worklist name
		await poManager.worklistSettings.userWorklistNameTxt().fill(newUserWlName);
		await page.waitForTimeout(3000);

		// Add column into new worklist
		const columns = ['Managing Organization', 'Patient Name', 'Study Status', 'Priority'];
		const wlResponse = await poManager.worklistSettings.createNewWorklist(newUserWlName, columns);
		worklistIDArray.push(wlResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();

		await page.waitForTimeout(5000);

		await worklistSelectorDropdown.click();
		await page.getByTestId('worklist-selector-user-worklist').click();

		const inputWlNameText = page.locator('input#input-with-icon-textfield');
		await inputWlNameText.fill(newUserWlName);
		await poManager.apiWaitUtils.waitForAPI('/WorklistLayout?', 'GET');
		const findWl = page.locator('li', { hasText: newUserWlName });
		await expect(findWl).toBeVisible();

		// Edit Worklist
		await findWl.hover();
		const editButton = findWl.locator('[data-testid="EditOutlinedIcon"]');
		await expect(editButton).toBeVisible();
		await editButton.click();

		await poManager.worklistSettings.filtersTab().click();
		// Add Filters
		await poManager.worklistSettings.addColumnTextFilter('patientName', 'TEST PATIENT');
		// Add Sorting
		await poManager.worklistSpeedDial.sortTab().click();
		const sortButton = page.getByTestId('SORT_WorklistSpeedDial');
		await expect(sortButton).toBeVisible();
		await sortButton.click();
		await poManager.worklistSettings.addColumnBtn().click();
		await poManager.worklistSettings.addColumnSort('Patient Name');
		// Save Worklist
		await poManager.worklistSettings.saveExistingWorklistBtn().click();
		await page.waitForTimeout(10000);
		// Check if the worklist is filtered
		await expect(page.getByText('TEST PATIENT')).toBeVisible({ timeout: 10000 });
	});

	test('Should be able to resize or reorder columns worklist', async ({ }) => {
		const poManager = new POManager(page);

		// Generate a random number between 1111 and 9999
		const randomNum = poManager.apiRequests.generateRandomNumber(1111, 9999);
		const newUserWlName = 'TEST WL SELECTOR - ' + randomNum;
		const worklistSelectorDropdown = await page.getByTestId('grid-toolbar').getByTestId('KeyboardArrowDownIcon');
		await expect(worklistSelectorDropdown).toBeVisible();
		await worklistSelectorDropdown.click();

		// Click button add user worklist
		await page.waitForTimeout(3000);
		await expect(page.getByText('Create User Worklist')).toBeVisible();
		page.getByText('Create User Worklist').click();

		// Input new worklist name
		await poManager.worklistSettings.userWorklistNameTxt().fill(newUserWlName);
		await page.waitForTimeout(3000);

		// Add column into new worklist
		const columns = ['Managing Organization', 'Patient Name', 'Study Status', 'Accession #'];
		const wlResponse = await poManager.worklistSettings.createNewWorklist(newUserWlName, columns);
		worklistIDArray.push(wlResponse.id);
		await expect(poManager.worklistSettings.closeUserWorklistDrawerBtn(true)).not.toBeVisible();
		await page.waitForTimeout(5000);

		const sourceColumn = page.locator('[data-cy="Patient Name_filter"]');
		const targetColumn = page.locator('[data-cy="Accession #_filter"]');
		await expect(sourceColumn).toBeVisible();
		await expect(targetColumn).toBeVisible();
		const sourceBox = await sourceColumn.boundingBox();
		const targetBox = await targetColumn.boundingBox();
		if (sourceBox && targetBox) {
			// Start drag from center of source
			const sourceX = sourceBox.x + sourceBox.width / 2;
			const sourceY = sourceBox.y + sourceBox.height / 2;

			// Target left side (slightly inside the left edge)
			const targetX = targetBox.x + 5; // 5px inside from the left edge
			const targetY = targetBox.y + targetBox.height / 2;

			// Drag simulation
			await page.mouse.move(sourceX, sourceY);
			await page.mouse.down();
			await page.mouse.move(targetX, targetY, { steps: 15 });
			await page.mouse.up();
			
			await page.waitForTimeout(3000);
			const expectColumnHeader = poManager.homePage.worklistTableHeader().nth(1);
			await expect(expectColumnHeader).toHaveAttribute('id', 'columnheader-patientName');
		}

		// Resize
		const resizeColumn = poManager.homePage.worklistTableHeader().nth(1);
		const resizeColumnBox = await resizeColumn.boundingBox();
		const originalWidth = resizeColumnBox?.width ?? 0;
		await resizeColumn.hover();
		const resizeElement = page.getByTestId('patientName-resizer');
		expect(resizeElement).toBeVisible({ timeout : 5000 });
		const handleResizeBox = await resizeElement.boundingBox();
		const startResizeX = handleResizeBox.x + handleResizeBox.width / 2;
		const startResizeY = handleResizeBox.y + handleResizeBox.height / 2;
		const endtResizeX = startResizeX + 20; // drag 20px to the right
		const endtResizeY = startResizeY;
		await page.mouse.move(startResizeX, startResizeY);
		await page.mouse.down();
		await page.mouse.move(endtResizeX, endtResizeY, { steps: 10 }); // drag right by 20px
		await page.mouse.up();
		await page.waitForTimeout(1000);

		// Get new width
		const newBox = await resizeColumn.boundingBox();
		const newWidth = newBox?.width ?? 0;
		expect(newWidth).toBeGreaterThan(originalWidth);
	});
});
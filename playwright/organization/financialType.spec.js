const { test, expect, request } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { OrganizationFinancialType } from '../POM/organization/organizationFinancialType';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';

let utilFuncs;

test.describe.serial('OrganizationRisFinancialType', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
	});

	test.beforeEach('login and open Financial Type listview', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		const financialTypePage = new OrganizationFinancialType(page);
		await financialTypePage.openOrganizationRisFinancialTypePage();
	});

	test('Create a Financial Type successfully and filter should work correctly', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const data = {
			code: `E2E-FT${randomNum}`,
			name: `FT ${randomNum}`,
		};

		const financialTypePage = new OrganizationFinancialType(page);

		await financialTypePage.addFinancialType(data);

		// Verify filter
		await financialTypePage.codeColHeader().pressSequentially(data.code, { delay: 100 });
		await page.route('/fhir/financialType', route => route.continue());
		await Promise.all([
			financialTypePage.financialTypeNameColHeader().pressSequentially(data.name, { delay: 100 }),
			financialTypePage.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET'),
		]);
		await expect(financialTypePage.financialTypeRow0()).toContainText(data.code);
	});

	test('Update a Financial Type successfully', async ({ page }) => {
		const randomNum1 = utilFuncs.generateRandomNumber(111111, 999911);
		const randomNum2 = utilFuncs.generateRandomNumber(111111, 999911);
		const oldData = {
			code: `E2E-FT${randomNum1}`,
			name: `FT ${randomNum1}`,
		};
		const newData = {
			code: `E2E-FT${randomNum2}`,
			name: `FT ${randomNum2}`,
		};

		const financialTypePage = new OrganizationFinancialType(page);

		// Add a Financial Type
		await financialTypePage.addFinancialType(oldData);

		// Update the Financial Type
		await financialTypePage.updateFinancialType(newData, oldData);

		await financialTypePage.codeColHeader().press('ControlOrMeta+a');
		await financialTypePage.codeColHeader().press('Backspace');
		await financialTypePage.codeColHeader().pressSequentially(newData.code, { delay: 500 });

		await financialTypePage.financialTypeNameColHeader().press('ControlOrMeta+a');
		await financialTypePage.financialTypeNameColHeader().press('Backspace');
		await page.route('/fhir/financialType', route => route.continue());
		await Promise.all([
			financialTypePage.financialTypeNameColHeader().pressSequentially(newData.name, { delay: 500 }),
			financialTypePage.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET'),
		]);

		await expect(financialTypePage.financialTypeRow0()).toContainText(newData.code);
	});

	test('Show error when Financial Type is duplicated or missing mandatory data', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const data = {
			code: `E2E-FT${randomNum}`,
			name: `FT ${randomNum}`,
		};

		const errorMsg =
			'New Financial Type record creation failed because of duplicate value. Please try again with different value';

		const financialTypePage = new OrganizationFinancialType(page);

		// Add a Financial Type
		await financialTypePage.addFinancialType(data);

		// Create another Financial Type with duplicate data
		await financialTypePage.addFinancialTypeIcon().click();

		// Duplicate code
		await financialTypePage.codeTxt().pressSequentially(data.code, { delay: 100 });
		await financialTypePage.financialTypeNameTxt().pressSequentially(`${data.name} - unique`, { delay: 100 });
		await financialTypePage.createBtn().click();

		const toastMsg1 = page.getByText(errorMsg);
		await toastMsg1.waitFor({ state: 'visible' });
		await expect(toastMsg1).toBeVisible();

		// Duplicate name
		await financialTypePage.codeTxt().press('ControlOrMeta+a');
		await financialTypePage.codeTxt().press('Backspace');
		await financialTypePage.codeTxt().pressSequentially(`${data.code} - unique`, { delay: 100 });
		await financialTypePage.financialTypeNameTxt().press('ControlOrMeta+a');
		await financialTypePage.financialTypeNameTxt().press('Backspace');
		await financialTypePage.financialTypeNameTxt().pressSequentially(data.name, { delay: 100 });

		await financialTypePage.createBtn().click();

		const toastMsg2 = page.getByText(errorMsg);
		await toastMsg2.waitFor({ state: 'visible' });
		await expect(toastMsg2).toBeVisible();

		await financialTypePage.cancelBtn().click();

		// Check mandatory fields
		await financialTypePage.addFinancialTypeIcon().click();
		await financialTypePage.createBtn().click();

		expect(page.locator('//*[@id="form-field-Code-helper-text"]')).toHaveClass(/Mui-error/);
		expect(page.locator('//*[@id="form-field-Financial Type Name-helper-text"]')).toHaveClass(/Mui-error/);
	});

	test('Delete a Financial Type successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(111111, 999911);
		const data = {
			code: `E2E-FT${randomNum}`,
			name: `FT ${randomNum}`,
		};

		const financialTypePage = new OrganizationFinancialType(page);

		// Add a Financial Type
		await financialTypePage.addFinancialType(data);

		// Delete the Financial Type
		await financialTypePage.codeColHeader().pressSequentially(data.code, { delay: 500 });
		await financialTypePage.financialTypeNameColHeader().pressSequentially(data.name, { delay: 200 });
		await financialTypePage.apiWaitUtils.waitForAPI('/fhir/financialType', 'GET');
		await expect(financialTypePage.financialTypeRow0()).toContainText(data.code);

		await financialTypePage.financialTypeRow0().hover();
		await financialTypePage.deleteIcon().click();
		await page.mouse.down();
		await page.waitForTimeout(3000);
		await page.mouse.up();

		await financialTypePage.codeColHeader().press('ControlOrMeta+a');
		await financialTypePage.codeColHeader().press('Backspace');
		await financialTypePage.codeColHeader().pressSequentially(data.code, { delay: 500 });
		await financialTypePage.financialTypeNameColHeader().press('ControlOrMeta+a');
		await financialTypePage.financialTypeNameColHeader().press('Backspace');
		await financialTypePage.financialTypeNameColHeader().pressSequentially(data.name, { delay: 200 });
		await expect(financialTypePage.financialTypeRow0()).not.toBeVisible();
	});
});

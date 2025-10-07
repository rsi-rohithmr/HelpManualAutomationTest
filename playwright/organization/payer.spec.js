const { test, expect } = require('@playwright/test');
import { OrganizationPayer } from '../POM/organization/organizationPayer';
import { Login } from 'playwright/POM/login';
import { financialTypeGenerator } from 'playwright/generators/financialTypeGenerator';
import { payerGenerator } from 'playwright/generators/payerGenerator';

let financialType1;
let financialType2;
let payerName;
let payerId;

test.describe.serial('OrganizationRisPayer', () => {
	// Should run this test suite in sequence because it needs Fiancial Type data which should be created in beforeAll,
	// So the data can be visible in the form without timing issue
	// If Running the suite in parallel, Financial Type selection is not stable. It's because:
	// + In parallel mode, beforeAll is executed multiple times instead of one time, so it will create multiple Financial Types making the dropdown list long
	test.beforeAll(async () => {
		financialType1 = await financialTypeGenerator.postFinancialType();
		financialType2 = await financialTypeGenerator.postFinancialType();
	});

	test.beforeEach('login and open Payer listview', async ({ page }) => {
		const loginPage = new Login(page);
		await loginPage.loginOmegaAI();
		const payerPage = new OrganizationPayer(page);
		await payerPage.openOrganizationRisPayerPage();
	});

	test('Create a custom payer and column filters should work correctly', async ({ page }) => {
		const payerPage = new OrganizationPayer(page);
		const expectedPayerInfo = payerGenerator.generatePayerFormValues(financialType1?.name);
		payerName = expectedPayerInfo['Payer Name'];
		payerId = expectedPayerInfo['Payer ID'];

		// Add a custom payer
		await payerPage.addPayer(expectedPayerInfo);

		// Verify filter
		await payerPage.payerNameColHeader().pressSequentially(expectedPayerInfo['Payer Name'], { delay: 100 });
		await payerPage.payerIdColHeader().pressSequentially(expectedPayerInfo['Payer ID'], { delay: 100 });
		await payerPage.payerTypeColHeader().click();
		await payerPage.dropdownOption(expectedPayerInfo['Payer Type']).click();
		await payerPage.financialTypeColHeader().click();
		await payerPage.dropdownOption(expectedPayerInfo['Financial Type']).click();

		await payerPage.waitForApiComplete('/fhir/organization', 'GET');
		await expect(payerPage.payerNameRow0()).toContainText(expectedPayerInfo['Payer Name']);

		// Verify form values
		await payerPage.openEditPayerForm(expectedPayerInfo['Payer Name'], null, true);
		const formValues = await payerPage.getFormValues();
		expect(formValues).toEqual(expectedPayerInfo);
	});

	test('Update a custom payer successfully', async ({ page }) => {
		const payerPage = new OrganizationPayer(page);
		const expectedPayerInfo = payerGenerator.generatePayerFormValues(financialType2?.name);
		expectedPayerInfo.active = false;

		await payerPage.openEditPayerForm(payerName, payerId);
		await payerPage.updatePayer(expectedPayerInfo);

		// Verify form values after update
		await payerPage.openEditPayerForm(expectedPayerInfo['Payer Name'], expectedPayerInfo['Payer ID']);
		const formValues = await payerPage.getFormValues();
		payerName = expectedPayerInfo['Payer Name'];
		payerId = expectedPayerInfo['Payer ID'];
		expect(formValues).toEqual(expectedPayerInfo);
	});

	test('Show error when adding duplicate payer or missing mandatory data', async ({ page }) => {
		const payerPage = new OrganizationPayer(page);
		const payerInfo = payerGenerator.generatePayerFormValues(financialType2?.name);
		payerInfo['Payer ID'] = payerId;

		// Create a new payer with duplicate payer name
		await payerPage.openNewPayerForm();
		await payerPage.inputFormValues(payerInfo);
		await payerPage.createBtn().click();
		const toastMsg = page.getByText(
			'New Payer record creation failed because of duplicate value. Please try again with different value'
		);
		await toastMsg.waitFor({ state: 'visible' });
		await expect(toastMsg).toBeVisible();

		await payerPage.cancelBtn().click();

		// Check mandatory fields
		await payerPage.openNewPayerForm();
		await payerPage.createBtn().click();
		expect(page.locator('//*[@id="form-field-Payer Name-helper-text"]')).toHaveClass(/Mui-error/);
		expect(page.locator('//*[@id="form-field-Payer ID-helper-text"]')).toHaveClass(/Mui-error/);
		expect(page.locator('//*[@id="payerType-helper-text"]')).toHaveClass(/Mui-error/);
		expect(page.locator('//*[@id="financialType-helper-text"]')).toHaveClass(/Mui-error/);
	});

	test('Delete a payer successfully', async ({ page }) => {
		const payerPage = new OrganizationPayer(page);

		await payerPage.payerNameColHeader().pressSequentially(payerName, { delay: 100 });
		await payerPage.apiWaitUtils.waitForAPI('/fhir/organization', 'GET');
		await expect(payerPage.payerNameRow0()).toContainText(payerName);

		// Delete a payer
		await payerPage.payerNameRow0().hover();
		await payerPage.deleteIcon().click();
		await page.mouse.down();
		await page.waitForTimeout(3000);
		await page.mouse.up();
		await payerPage.payerNameColHeader().click();
		await payerPage.payerNameColHeader().press('ControlOrMeta+a');
		await payerPage.payerNameColHeader().fill('');
		await payerPage.payerNameColHeader().pressSequentially(payerName, { delay: 100 });
		await expect(payerPage.payerNameRow0()).not.toBeVisible();
	});
});

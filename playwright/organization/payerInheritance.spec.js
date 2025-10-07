const { test, expect } = require('@playwright/test');
import { OrganizationPayer } from '../POM/organization/organizationPayer';
import { Login } from 'playwright/POM/login';
import { financialTypeGenerator } from 'playwright/generators/financialTypeGenerator';
import { orgGenerator } from 'playwright/generators/organizationGenerator';
import { payerGenerator } from 'playwright/generators/payerGenerator';

let financialType;
let childOrganizationRes;

test.describe.serial('OrganizationRisPayer - Inheritance', () => {
	test.beforeAll(async () => {
		financialType = await financialTypeGenerator.postFinancialType();
		const childOrgPayload = orgGenerator.generateOrganizationPayload(true, true, true, true, 'E2E-PROV-CHILDORG');
		childOrganizationRes = await orgGenerator.postOrganization(childOrgPayload);
	});

	test.beforeEach('login OAI', async ({ page }) => {
		const loginPage = new Login(page);
		await loginPage.loginOmegaAI();
	});

	test('A user being a part of a master org can create a payer at the master org, and view/update/delete the payer at a child org', async ({
		page,
	}) => {
		const payerPage = new OrganizationPayer(page);

		// Open Payer list of the master org
		await payerPage.openOrganizationRisPayerPage();

		// Add a payer at the master org
		const initialPayerInfo = payerGenerator.generatePayerFormValues(financialType?.name);
		await payerPage.addPayer(initialPayerInfo);

		// Open Payer list of a child org, and verify that the user can view/update/delete the payer created at the master org
		await payerPage.openOrganizationRisPayerPage(childOrganizationRes?.entry[0]?.resource?.id);

		// Verify that at the child org, the user can view/update/delete the payer created at the master org
		await viewUpdateAndDeletePayer(page, initialPayerInfo);
	});

	test('A user being a part of a master org can create a payer at a child org, and view/update/delete the payer at the master org', async ({
		page,
	}) => {
		const payerPage = new OrganizationPayer(page);

		// Open Payer list of a child org
		await payerPage.openOrganizationRisPayerPage(childOrganizationRes?.entry[0]?.resource?.id);

		// Add a payer at the child org
		const initialPayerInfo = payerGenerator.generatePayerFormValues(financialType?.name);
		await payerPage.addPayer(initialPayerInfo);

		// Open Payer list of a child org, and verify that the user can view/update/delete the payer created at the master org
		await payerPage.openOrganizationRisPayerPage();

		// Verify that at the child org, the user can view/update/delete the payer created at the child org
		await viewUpdateAndDeletePayer(page, initialPayerInfo);
	});
});

const viewUpdateAndDeletePayer = async (page, payerInfo) => {
	const payerPage = new OrganizationPayer(page);

	// Verify that the user can view the payer
	await payerPage.payerNameColHeader().pressSequentially(payerInfo['Payer Name'], { delay: 100 });
	await payerPage.payerIdColHeader().pressSequentially(payerInfo['Payer ID'], { delay: 100 });
	await payerPage.waitForApiComplete('/fhir/organization', 'GET');
	await expect(payerPage.payerNameRow0()).toContainText(payerInfo['Payer Name']);

	// Verify that the user can update the payer
	const newPayerInfo = payerGenerator.generatePayerFormValues(financialType?.name);
	await payerPage.openEditPayerForm(payerInfo['Payer Name'], null, true);
	await payerPage.updatePayer(newPayerInfo);

	// Verify form values after update
	await payerPage.openEditPayerForm(newPayerInfo['Payer Name'], newPayerInfo['Payer ID']);
	const formValues = await payerPage.getFormValues();
	expect(formValues).toEqual(newPayerInfo);

	// Close the edit form
	await payerPage.cancelBtn().click();
	await expect(payerPage.payerNameRow0()).toBeVisible();

	// Verify that the user can delete the payer
	await payerPage.payerNameRow0().hover();
	await payerPage.deleteIcon().click();
	await page.mouse.down();
	await page.waitForTimeout(3000);
	await page.mouse.up();
	await payerPage.payerNameColHeader().click();
	await payerPage.payerNameColHeader().press('ControlOrMeta+a');
	await payerPage.payerNameColHeader().fill('');
	await payerPage.payerNameColHeader().pressSequentially(newPayerInfo['Payer Name'], { delay: 100 });
	await expect(payerPage.payerNameRow0()).not.toBeVisible();
};

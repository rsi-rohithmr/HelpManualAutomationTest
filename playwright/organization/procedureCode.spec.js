const { test, expect, request } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { OrganizationProcedureCode } from '../POM/organization/organizationProcedureCode';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';

let utilFuncs;

test.describe.skip('OrganizationRisProcedureCode', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
	});

	test.beforeEach('login and open Procedure Code listview', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		const procedureCodePage = new OrganizationProcedureCode(page);
		await procedureCodePage.openOrganizationRisProcedureCodePage();
	});

	test('Create a new procedure code successfully and filter should work correctly', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(1111, 9999);
		const procedureCode = `E2ECODE${randomNum}`;
		const description = `DES ${randomNum}`;
		const rvuTechnical = '0.01';
		const rvuProfessional = '999.99';
		const data = {
			procedureCode: procedureCode,
			description: description,
			rvuTechnical: rvuTechnical,
			rvuProfessional: rvuProfessional,
			billable: true,
			priorAuthorization: true,
		};

		const procedureCodePage = new OrganizationProcedureCode(page);

		await procedureCodePage.addProcedureCode(data);

		// Filter
		await procedureCodePage.activeColHeader().click();
		await procedureCodePage.activeOption('Active').click();

		await procedureCodePage.procedureCodeColHeader().pressSequentially(procedureCode, { delay: 100 });

		await procedureCodePage.descriptionColHeader().pressSequentially(description, { delay: 100 });

		await procedureCodePage.rvuTechnicalColHeader().pressSequentially(rvuTechnical, { delay: 100 });

		await procedureCodePage.rvuProfessionalColHeader().pressSequentially(rvuProfessional, { delay: 100 });

		await procedureCodePage.billableCheckboxColHeader().click();
		await procedureCodePage.billableOption('Billable').click();

		await procedureCodePage.priorAuthorizationColHeader().click();
		await procedureCodePage.priorAuthorizationOption('Prior Auth Needed');

		await procedureCodePage.waitForApiComplete('/fhir/ProcedureCode', 'GET');
		await expect(procedureCodePage.procedureCodeRow0()).toContainText(procedureCode);
	});

	test('Edit a procedure code successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(1111, 9999);
		const procedureCode = `E2ECODE${randomNum}`;
		const description = `DES ${randomNum}`;
		const rvuTechnical = '0.01';
		const rvuProfessional = '999';
		const data = {
			procedureCode: procedureCode,
			description: description,
			rvuTechnical: rvuTechnical,
			rvuProfessional: rvuProfessional,
			billable: true,
			priorAuthorization: true,
		};

		const updateData = {
			active: false,
			procedureCode: `E2ECODE${randomNum}U`,
			description: `DESCRIPTION ${randomNum}`,
			rvuTechnical: '100',
			rvuProfessional: '200',
			billable: false,
			priorAuthorization: false,
		};

		const procedureCodePage = new OrganizationProcedureCode(page);

		// Create a procedure code and make sure it appears on the listview
		await procedureCodePage.addProcedureCode(data);

		// Edit the procedure code
		await procedureCodePage.editProcedureCode(updateData, data);

		await procedureCodePage.descriptionColHeader().pressSequentially(updateData.description, { delay: 100 });
		await expect(page.getByTestId('study-status-cell-0_description').locator('p')).toContainText(
			updateData.description
		);
	});

	test('Show error when procedure code is duplicated', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(1111, 9999);
		const procedureCode = `E2ECODE${randomNum}`;
		const description = `DES ${randomNum}`;
		const data = {
			procedureCode: procedureCode,
			description: description,
			rvuTechnical: '300',
			rvuProfessional: '400',
			billable: true,
			priorAuthorization: true,
		};

		const procedureCodePage = new OrganizationProcedureCode(page);
		// Create a procedure code and make sure it appears on the listview
		await procedureCodePage.addProcedureCode(data);

		// Create another procedure code with invalid data
		await procedureCodePage.addProcedureCodeIcon().click();

		await procedureCodePage.procedureCodeCombo().pressSequentially(procedureCode, { delay: 500 });
		await procedureCodePage.descriptionTxt().pressSequentially(`TEST DUPLICATE`, { delay: 500 });

		await procedureCodePage.createBtn().click();

		const toastMsg = page.getByText(
			'New Procedure Code creation failed because of duplicate value. Please try again with different value'
		);
		await toastMsg.waitFor({ state: 'visible' });
		await expect(toastMsg).toBeVisible();

		await procedureCodePage.cancelBtn().click();

		// Check mandatory fields
		await procedureCodePage.addProcedureCodeIcon().click();
		await procedureCodePage.createBtn().click();
		expect(page.locator('//*[@id="autocomplete-field-Procedure Code-helper-text"]')).toHaveClass(/Mui-error/);
		expect(page.locator('//*[@id="form-field-Description-helper-text"]')).toHaveClass(/Mui-error/);
	});

	test('Delete a procedure code successfully', async ({ page }) => {
		const randomNum = utilFuncs.generateRandomNumber(1111, 9999);
		const procedureCode = `E2ECODE${randomNum}`;
		const description = `DES ${randomNum}`;
		const data = {
			procedureCode: procedureCode,
			description: description,
			rvuTechnical: '100',
			rvuProfessional: '200',
			billable: true,
			priorAuthorization: true,
		};

		const procedureCodePage = new OrganizationProcedureCode(page);

		// Create a procedure code
		await procedureCodePage.addProcedureCode(data);

		// Filter the created procedure code
		await procedureCodePage.procedureCodeColHeader().pressSequentially(procedureCode, { delay: 100 });
		await procedureCodePage.waitForApiComplete('/fhir/ProcedureCode', 'GET');
		await expect(procedureCodePage.procedureCodeRow0()).toContainText(procedureCode);

		// Hover on the row and click Delete icon
		await procedureCodePage.procedureCodeRow0().hover();
		await procedureCodePage.deleteIcon(0).click();
		await page.mouse.down();
		await page.waitForTimeout(3000);
		await page.mouse.up();

		const toastMsg = page.getByText('Procedure Code deleted Successfully');
		await toastMsg.waitFor({ state: 'visible' });
		await expect(toastMsg).toBeVisible();

		await procedureCodePage.descriptionColHeader().pressSequentially(description, { delay: 100 });
		await expect(procedureCodePage.procedureCodeRow0()).not.toBeVisible();
	});
});

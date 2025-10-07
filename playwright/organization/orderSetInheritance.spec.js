const { test, expect } = require('@playwright/test');
import { OrganizationOrderSet } from '../POM/organization/organizationOrderSet';
import { POManager } from '../POM/POManager';
import { orgGenerator } from '../generators/organizationGenerator';
import { orderSetGenerator } from '../generators/orderSetGenerator';
import { procedureCodeGenerator } from '../generators/procedureCodeGenerator';

// let financialType;
let childOrganizationRes;
let procedureCode;

test.describe.skip('OrganizationOrderSet - Inheritance', () => {
	test.beforeAll(async () => {
		const childOrgPayload = orgGenerator.generateOrganizationPayload(true, true, true, true, 'E2E-PROV-CHILDORG');
		childOrganizationRes = await orgGenerator.postOrganization(childOrgPayload);
		const procedureCodePayload = procedureCodeGenerator.generateProcedureCodePayload();
		procedureCode = await procedureCodeGenerator.postProcedureCode(procedureCodePayload);
	});

	test.beforeEach('login and open Organization Order Set page', async ({ page }) => {
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON
			// Modify JSON data
			if (bodyJson.features && bodyJson.features['proact-enable-new-ris-order-sets']) {
				bodyJson.features['proact-enable-new-ris-order-sets'].variationName = 'Variation On';
				bodyJson.features['proact-enable-new-ris-order-sets'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['proact-enable-new-ris-order-sets']) {
				bodyJson.variables['proact-enable-new-ris-order-sets'].value = true;
			}

			if (bodyJson.features && bodyJson.features['proact-procedure-order-set-under-master-org']) {
				bodyJson.features['proact-procedure-order-set-under-master-org'].variationName = 'Variation On';
				bodyJson.features['proact-procedure-order-set-under-master-org'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['proact-procedure-order-set-under-master-org']) {
				bodyJson.variables['proact-procedure-order-set-under-master-org'].value = true;
			}

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});
		
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('A user being a part of a master org can create a order set at the master org, and view/update/delete the order set at a child org', async ({
		page,
	}) => {
		const orderSetPage = new OrganizationOrderSet(page);

		// Add a order set at the master org
		const initialOrderSetInfo = await orderSetGenerator.generateOrderSetFormValues(procedureCode);
		await orderSetPage.openOrganizationRisOrderSetPage();

		await orderSetPage.addOrderSet(initialOrderSetInfo);

		// Open Order set list of a child org, and verify that the user can view/update/delete the order set created at the master org
		await orderSetPage.openOrganizationRisOrderSetPage(childOrganizationRes?.entry[0]?.resource?.id);

		// Verify that at the child org, the user can view/update/delete the orderset created at the master org
		await viewUpdateAndDeleteOrderSet(page, initialOrderSetInfo, procedureCode);
	});

	test('A user being a part of a master org can create an orderSet at a child org, and view/update/delete the orderSet at the master org', async ({
		page,
	}) => {
		const orderSetPage = new OrganizationOrderSet(page);

		const initialOrderSetInfo = await orderSetGenerator.generateOrderSetFormValues(procedureCode);
		// Open OrderSet list of a child org

		await orderSetPage.openOrganizationRisOrderSetPage(childOrganizationRes?.entry[0]?.resource?.id);
		// Add an orderSet at the child org

		await orderSetPage.addOrderSet(initialOrderSetInfo);

		// Open OrderSet list of master org, and verify that the user can view/update/delete the orderSet created at the child org
		await orderSetPage.openOrganizationRisOrderSetPage();

		// Verify that at the master org, the user can view/update/delete the orderSet created at the child org
		await viewUpdateAndDeleteOrderSet(page, initialOrderSetInfo, procedureCode);
	});
});

const viewUpdateAndDeleteOrderSet = async (page, orderSetInfo, procedureCode) => {
	const orderSetPage = new OrganizationOrderSet(page);

	// Verify that the user can view the orderSet
	await orderSetPage.orderSetCodeColHeader().pressSequentially(orderSetInfo['Order Set Code'], { delay: 100 });
	await orderSetPage.orderSetDescriptionColHeader().pressSequentially(orderSetInfo.Description, { delay: 100 });
	await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');
	await expect(orderSetPage.orderSetCode0()).toContainText(orderSetInfo['Order Set Code']);
	await expect(orderSetPage.orderSetDesc0()).toContainText(orderSetInfo.Description);

	// Verify that the user can update the orderSet
	const newOrderSetInfo = await orderSetGenerator.generateOrderSetFormValues(procedureCode);
	await orderSetPage.openEditOrderSetForm();
	await orderSetPage.updateOrderSet(newOrderSetInfo);
	await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');

	// Verify form values after update
	await orderSetPage.openEditOrderSetForm();
	const formValues = await orderSetPage.getFormValues();
	const omitKeys = ['Duration', 'Duration (Minutes)', 'Quantity'];

	const filteredFormValues = Object.fromEntries(
		Object.entries(formValues).filter(([key]) => !omitKeys.includes(key))
	);

	const filteredGeneratedOrderSet = Object.fromEntries(
		Object.entries(newOrderSetInfo).filter(([key]) => !omitKeys.includes(key))
	);

	expect(filteredFormValues).toEqual(filteredGeneratedOrderSet);

	// Close the edit form
	await orderSetPage.cancelBtn().click();
	await expect(orderSetPage.orderSetCode0()).toBeVisible();

	// Verify that the user can delete the orderSet
	await orderSetPage.row0().hover();
	const deleteButton = orderSetPage.deleteIcon();
	await deleteButton.click();
	await page.mouse.down();
	await page.waitForTimeout(3000);
	await page.mouse.up();
	await orderSetPage.deletePopupHeaderText().waitFor({ state: 'visible' });
	await orderSetPage.deletePopUpProceedButton().click();
	await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'DELETE');
	const toastMsg = page.getByText('Order Set deleted successfully');
	await expect(toastMsg).toBeVisible();
	await expect(orderSetPage.row0()).not.toBeVisible();
};

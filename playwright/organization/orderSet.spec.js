const { test, expect, request } = require('@playwright/test');
import { POManager } from '../POM/POManager';
import { OrganizationOrderSet } from '../POM/organization/organizationOrderSet';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { orderSetGenerator } from 'playwright/generators/orderSetGenerator';
import { procedureCodeGenerator } from 'playwright/generators/procedureCodeGenerator';

let utilFuncs;
let latestOrderSet;
let procedureCode;

test.describe.serial('OrganizationOrderSet', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);
		const procedureCodePayload = procedureCodeGenerator.generateProcedureCodePayload();
		procedureCode = await procedureCodeGenerator.postProcedureCode(procedureCodePayload);
	});

	test.beforeEach('login and open Organization Order Set page', async ({ page }) => {
		
		// Modify network request response
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

	test('Verify that order sets are loading in the grid on the initial load.', async ({ page }) => {
		const orderSetPage = new OrganizationOrderSet(page);
		await orderSetPage.openOrganizationRisOrderSetPage();
		let orderSet = {};
		await utilFuncs.postOrderSet().then(result => {
			orderSet = {
				code: result?.studyType,
				description: result?.description,
				modalityCode: result?.modality,
				bodyPart: result?.bodyPart,
				duration: result?.duration.toString(),
				isActive: result?.active,
			};
		});
		await page.reload();
		// Verify filter
		await orderSetPage.orderSetCodeColHeader().pressSequentially('STUDYTYPE', { delay: 100 });
		await expect(orderSetPage.orderSetCode0()).toContainText('STUDYTYPE');
		await orderSetPage.orderSetDescriptionColHeader().pressSequentially('Description', { delay: 100 });
		await expect(orderSetPage.orderSetDesc0()).toContainText('Description');
		await orderSetPage.orderSetModalityColHeader().pressSequentially('CT', { delay: 100 });
		await orderSetPage.selectFirstOption();
		await orderSetPage.orderSetBodyPartsColHeader().pressSequentially('Abdomen', { delay: 100 });
		await orderSetPage.selectFirstOption();
		await orderSetPage.orderSetDurationColHeader().pressSequentially('15', { delay: 100 });
		await expect(orderSetPage.orderSetDuration0()).toContainText('15');
	});

	test('verify row values', async ({ page }) => {
		const orderSetPage = new OrganizationOrderSet(page);
		await orderSetPage.openOrganizationRisOrderSetPage();
		let orderSet = {};
		await utilFuncs.postOrderSet().then(result => {
			orderSet = {
				code: result?.studyType,
				description: result?.description,
				modalityCode: result?.modality,
				bodyPart: result?.bodyPart,
				duration: result?.duration.toString(),
				isActive: result?.active,
			};
		});

		await page.reload();
		// Get all values for row 0
		const rowValues = await orderSetPage.getRowValues(0);
		expect(rowValues).toEqual(orderSet);
	});

	test('delete first order set row', async ({ page }) => {
		await page.route('**/StudyType/*', async route => route.continue());
		const orderSetPage = new OrganizationOrderSet(page);
		await orderSetPage.openOrganizationRisOrderSetPage();
		let orderSet = {};
		await utilFuncs.postOrderSet().then(result => {
			orderSet = {
				code: result?.studyType,
				description: result?.description,
				modalityCode: result?.modality,
				bodyPart: result?.bodyPart,
				duration: result?.duration.toString(),
				isActive: result?.active,
			};
		});
		await page.reload();
		await orderSetPage.orderSetCodeColHeader().pressSequentially(orderSet.code, { delay: 100 });
		await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');
		await page.route('**/StudyType/*', async route => route.continue());
		// Get all values for row 0
		const rowValues = await orderSetPage.getRowValues(0);
		expect(rowValues).toEqual(orderSet);

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
	});

	test('create a new order set successfully', async ({ page }) => {
		await page.route('**/StudyType/*', async route => route.continue());
		const orderSetPage = new OrganizationOrderSet(page);

		// Generate test data
		const generatedOrderSet = await orderSetGenerator.generateOrderSetFormValues(procedureCode);
		console.log('Generated Order Set:', generatedOrderSet);
		await orderSetPage.openOrganizationRisOrderSetPage();

		await orderSetPage.addOrderSet(generatedOrderSet);
		await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');
		const rowValues = await orderSetPage.getRowValues(0);
		await expect(rowValues.code).toEqual(generatedOrderSet['Order Set Code']);
		await expect(rowValues.description).toEqual(generatedOrderSet.Description);

		//verify form values

		await orderSetPage.openEditOrderSetForm();
		const formValues = await orderSetPage.getFormValues();
		await orderSetPage.cancelBtn().click();
		console.log('Form Values:', formValues);
		console.log('Generated Order Set:', generatedOrderSet);
		expect({ ...formValues }).toEqual({ ...generatedOrderSet });

		// Verify duplicate can not be created
		await orderSetPage.addOrderSet(generatedOrderSet);
	});

	test('Update an order set successfully', async ({ page }) => {
		await page.route('**/StudyType/*', async route => route.continue());
		const orderSetPage = new OrganizationOrderSet(page);

		latestOrderSet = await orderSetGenerator.generateOrderSetFormValues(procedureCode);
		await orderSetPage.openOrganizationRisOrderSetPage();
		await orderSetPage.openEditOrderSetForm();
		await orderSetPage.updateOrderSet(latestOrderSet);
		await orderSetPage.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');

		const rowValues = await orderSetPage.getRowValues(0);
		await expect(rowValues.code).toEqual(latestOrderSet['Order Set Code']);
		await expect(rowValues.description).toEqual(latestOrderSet.Description);

		await orderSetPage.openEditOrderSetForm();
		const formValues = await orderSetPage.getFormValues();

		const omitKeys = ['Duration', 'Duration (Minutes)', 'Quantity'];

		const filteredFormValues = Object.fromEntries(
			Object.entries(formValues).filter(([key]) => !omitKeys.includes(key))
		);

		const filteredGeneratedOrderSet = Object.fromEntries(
			Object.entries(latestOrderSet).filter(([key]) => !omitKeys.includes(key))
		);

		expect(filteredFormValues).toEqual(filteredGeneratedOrderSet);
	});
});

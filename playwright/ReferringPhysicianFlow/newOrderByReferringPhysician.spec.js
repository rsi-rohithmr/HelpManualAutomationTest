const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { Common } = require('../POM/common');
const playwrightConfig = require('../../playwright.config');
const { DeleteOrganization } = require('../DBUtils/OrganizationQuery');
const { first } = require('lodash');

test.describe.serial('Create New Order With Referring Physician/Organization', () => {
	let browser;
	let page;
	let api;
	let apiContext;
	let refOrgId = '';
	let refOrgName = '';
	let refPhysician = '';
	let refPhysicianId = '';
	let orderSetId = '';
	let orderSetName = '';
	let firstName = '';
	let lastName = '';
	const email = playwrightConfig.userName3;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeAll(async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);

		await api.postReferringOrganization().then(result => {
			refOrgId = result.id;
			console.log('Referring Organization Id: ' + refOrgId);
			refOrgName = result.name;
			console.log('Referring Organization Name: ' + refOrgName);
		});

		await api.postReferringPhysician(refOrgId, refOrgName, email).then(result => {
			refPhysicianId = result.id;
			console.log('Referring Physician Id: ' + refPhysicianId);
			refPhysician = result.name;
			console.log('Referring Physician Name: ' + refPhysician);
		});

		await api.postOrderSet().then(result => {
			orderSetId = result.id;
			console.log('Order Set Id: ' + orderSetId);
			orderSetName = result.studyType;
			console.log('Order Set Name: ' + orderSetName);
		});

		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAIUserReferring01();
	});

	test('Create new order - Referring Physician and Referring Organization', async () => {
		const poManager = new POManager(page);

		console.log(`Create Study`);
		await poManager.homePage.addNewBtn().click();
		await poManager.homePage.newOrderBtn().click();

		await page.waitForTimeout(10000);

		await poManager.orderDrawer.selectImagingOrganization(managingOrgName);
		const imagingOrgName = await poManager.orderDrawer.imagingOrganizationInput().inputValue();
		expect(imagingOrgName).toBe(managingOrgName);
		console.log('Imaging Organization Name: ' + imagingOrgName);

		await poManager.orderDrawer.selectReferringPhysician(refPhysician);
		const referringPhysician = await poManager.orderDrawer.referringPhysicianInput().inputValue();
		expect(referringPhysician).toBe(refPhysician);
		console.log('Referring Physician Name: ' + referringPhysician);

		await poManager.orderDrawer.selectReferringOrganization(refOrgName);
		const referringOrganization = await poManager.orderDrawer.referringOrganizationInput().textContent();
		expect(referringOrganization).toBe(refOrgName);
		console.log('Referring Organization Name: ' + referringOrganization);

		({ firstName, lastName } = await poManager.orderDrawer.addPatient());
		console.log('Patient added successfully');

		await poManager.orderDrawer.addOrderSetCode(orderSetName);
		console.log('Order Set added successfully');

		console.log('Click on Create Order button');
		if (await poManager.orderDrawer.createOrderByCreateBtn().isVisible()) {
			await poManager.orderDrawer.createOrderByCreateBtn().click();
			console.log('Create Order - Create button clicked successfully');
		} else {
			await poManager.orderDrawer.createOrderByContinueBtn().click();
			await poManager.orderDrawer.submitBtn().click();
			console.log('Create Order - Continue button clicked successfully');
		}

		// Verify success message
		const successMessage = await page.locator('text=Successfully created new order');
		await expect(successMessage).toBeVisible();
		console.log('Success message: Successfully created new order');
	});

	test('Verify Study Displayed after creating in Worklist of Referring Physician', async () => {
		const poManager = new POManager(page);
		await page.waitForTimeout(10000);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', `${lastName} ${firstName}`);
		await page.waitForTimeout(5000);
		await poManager.homePage.worklistTableRows().click();
		const studiesCount = await poManager.homePage.studiesCount().textContent();
		console.log('Studies Count: ' + studiesCount);
		expect(studiesCount).toContain('1');
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await expect(poManager.clickWheel.documentViewerIcon()).toBeVisible();
		await expect(poManager.clickWheel.imageViewerIcon()).toBeVisible();
		await expect(poManager.clickWheel.patientIcon()).toBeHidden();
		await expect(poManager.clickWheel.visitIcon()).toBeHidden();
		await expect(poManager.clickWheel.orderIcon()).toBeHidden();
		await expect(poManager.clickWheel.studyIcon()).toBeHidden();
		await expect(poManager.clickWheel.sendStudyIcon()).toBeHidden();
		await expect(poManager.clickWheel.studyExplorerIcon()).toBeHidden();
		await expect(poManager.clickWheel.billingIcon()).toBeHidden();
	});

	test.afterAll(async () => {
		if (refOrgId) {
			await DeleteOrganization(refOrgId);
			console.log('Deleted Referring Organization: ' + refOrgId);
		}
	});
});

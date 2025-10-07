const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { Common } = require('../POM/common');
const { DeleteOrganization } = require('../DBUtils/OrganizationQuery');

test.describe.skip('No Studies Are Visible For Other New Referring Physician and New Referring Org', () => {
	let browser;
	let page;
	let api;
	let apiContext;
	let refOrgId = '';
	let refOrgName = '';
	let refOrgId1 = '';
	let refOrgName1 = '';
	let refPhysician = '';
	let refPhysicianId = '';
	let orderSetId = '';
	let orderSetName = '';
	const apiKey = Common.mailsacAPIKey4;
	const domain = 'mailsac.com';
	const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
	const email = `referringuser${timestamp}@${domain}`.toLowerCase();
	const emailTitle = 'Sign-In to Omega AI';

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

		browser = await chromium.launch();
		page = await browser.newPage();
		console.log('Referring Physician Email: ' + email);
		await api.oaiSignUp(page, email, apiKey, emailTitle);

		await api.postOrderSet().then(result => {
			orderSetId = result.id;
			console.log('Order Set Id: ' + orderSetId);
			orderSetName = result.studyType;
			console.log('Order Set Name: ' + orderSetName);
		});

		const poManager = new POManager(page);

		console.log(`Create Study`);
		await poManager.homePage.addNewBtn().click();
		await poManager.homePage.newOrderBtn().click();

		await page.waitForTimeout(10000);

		await poManager.orderDrawer.addPatient();
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

		console.log('Success message: Successfully created new order');
	});

	test('No Studies Are Visible For Other New Referring Physician and New Referring Org', async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);
		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);

		await api.postReferringOrganization().then(result => {
			refOrgId1 = result.id;
			console.log('Referring Organization Id: ' + refOrgId1);
			refOrgName1 = result.name;
			console.log('Referring Organization Name: ' + refOrgName1);
		});

		const secondEmail = `secondreferuser${timestamp}@${domain}`.toLowerCase();

		await api.postReferringPhysician(refOrgId1, refOrgName, secondEmail).then(result => {
			refPhysicianId = result.id;
			console.log('Referring Physician Id: ' + refPhysicianId);
			refPhysician = result.name;
			console.log('Referring Physician Name: ' + refPhysician);
		});

		console.log('Referring Physician Email: ' + secondEmail);
		await api.oaiSignUp(page, secondEmail, apiKey, emailTitle);

		await page.waitForTimeout(10000);

		const studiesCount = await poManager.homePage.studiesCount().textContent();
		console.log('Studies Count: ' + studiesCount);
		expect(studiesCount).toContain('0');
	});

	test.afterAll(async () => {
		if (refOrgId) {
			await DeleteOrganization(refOrgId);
			console.log('Deleted Referring Organization: ' + refOrgId);
		}
		if (refOrgId1) {
			await DeleteOrganization(refOrgId1);
			console.log('Deleted Referring Organization: ' + refOrgId1);
		}
	});
});

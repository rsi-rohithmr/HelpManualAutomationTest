const { test, request, expect, chromium } = require('@playwright/test');
const config = require('../../playwright.config');
const { POManager } = require('../POM/POManager');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

let singleBlockNote;
let healthcareService = {};
let page;
let browser;
let api;
let randomNum;
let poManager;

let tokenObj = {};

test.describe.serial('Single Block Time', async () => {
	test.beforeAll(async () => {
		browser = await chromium.launch();
		page = await browser.newPage();
		const apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);
		healthcareService = await api.postHealthcareService();
		tokenObj = await api.getTokenAndSessionId();
		randomNum = api.generateRandomNumber(111, 999);
		singleBlockNote = `Single Block Note ${randomNum}`;

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Create a single block successfully', async () => {
		const atHourAndMinuteCell = '23-45';
		await poManager.scheduler.openSchedulerDrawer(healthcareService?.name);
		await page.getByText(healthcareService?.name).isVisible();

		await poManager.scheduler.openNewBlockTimeDrawer(atHourAndMinuteCell);

		await poManager.scheduler.blockTimeNoteTxt().click();
		await poManager.scheduler.blockTimeNoteTxt().fill(singleBlockNote);
		await page.route('**/Appointment?**', async route => {
			await route.continue();
		});
		await Promise.all([
			poManager.scheduler.createBtn().click(),
			poManager.apiWaitUtils.waitForAPI('/Appointment?', 'POST'),
		]);

		await expect(page.getByLabel(singleBlockNote)).toBeVisible();
	});

	test('Update a single block successfully', async () => {
		await page.getByLabel(singleBlockNote).first().click();
		await poManager.scheduler.editBlockIcon().click();

		await poManager.scheduler.blockTimeNoteTxt().clear();
		await poManager.scheduler.blockTimeNoteTxt().fill(`${singleBlockNote} updated`);
		await page.route('**/Appointment**', async route => {
			await route.continue();
		});
		await Promise.all([
			poManager.scheduler.updateBtn().click(),
			poManager.apiWaitUtils.waitForAPI('/Appointment', 'PUT'),
		]);

		await expect(page.getByLabel(`${singleBlockNote} updated`)).toBeVisible();
	});
});

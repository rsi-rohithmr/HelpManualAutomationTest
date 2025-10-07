const { test, expect, chromium, request } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC3 } = require('../POM/timeouts');

let studyHelper = '';
let poManager;

const email = playwrightConfig.userName;
let api = '';

const viewports = [
	{ name: 'Desktop', viewport: { width: 1920, height: 1080 } },
	{ name: 'Tablet', viewport: { width: 768, height: 1024 } },
	{ name: 'Mobile', viewport: { width: 375, height: 812 } },
];

test.describe.serial('Blume Global Search', () => {
	let page;
	let browserContext;
	let tokenObj = {};
	let data = {};

	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 },
		});
		page = await browserContext.newPage();
		const apiContext = await request.newContext();
		api = new APIRequests(apiContext);
		studyHelper = new postStudyNGetToken(apiContext);
		poManager = new POManager(page);

		data = await studyHelper.postStudy();
		// Get token and session
		const token = await studyHelper.getTokenAndSessionId();
		tokenObj = {
			accessToken: token.accessToken,
			sessionID: token.sessionID,
		};

		const patientRes = await api.getResourceById('patient', data.patientId, tokenObj);
		const existingEmail = patientRes.telecom.find(t => t.system === 'email' && t.value.trim() !== '');

		if (existingEmail) {
			existingEmail.value = email;
			existingEmail.rank = 0;
		} else {
			patientRes.telecom.push({
				system: 'email',
				value: email,
				rank: 0,
				__uniqueId: uuidv4(),
			});
		}

		patientRes.telecom.forEach(t => {
			if (t.system === 'email' && t.value !== email) {
				t.rank = 1;
			}
		});

		await api.putResource('patient', patientRes.id, patientRes, tokenObj);
		await page.waitForTimeout(TIMEOUT_IN_MSEC3);
		await poManager.loginPage.loginBlume();
	});

	test.afterAll(async () => {
		if (data?.patientId) {
			await studyHelper.cleanupPatient(data?.patientId, tokenObj);
		}
		await browserContext.close();
	});

	viewports.forEach(({ name, viewport }) => {
		test(`Blume Global Study Search on ${name} Screen`, async ({ browser }) => {
			const searchLocator =
				name?.toLowerCase() === 'desktop' ? '[data-cy="global-search-input"]' : '[data-testid="search-icon"]';
			const searchInputLocator = name?.toLowerCase() === 'desktop' ? searchLocator : '[id="top-search"]';
			const context = await browser.newContext({ viewport });
			await page.setViewportSize({ ...viewport });

			const expectedStudyInfo = `${data?.studyDescription} - ${data?.studyId}`;

			await page.locator(searchLocator).click();
			await page.locator(searchInputLocator).fill(data.studyId);
			await page.locator(searchInputLocator).press('Enter');
			await poManager.apiWaitUtils.waitForAPI('/', 'POST');
			await expect(page.getByText('MY STUDIES', { exact: true })).toBeVisible();
			await expect(page.locator('.search-items-container', { hasText: expectedStudyInfo })).toBeVisible();
			await context.close();
		});
	});
});

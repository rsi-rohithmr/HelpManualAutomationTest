const { test, expect, chromium, request } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } = require('../POM/timeouts');

let studyHelper = '';
let poManager;

const managingOrgName = playwrightConfig.managingOrg.organizationName;
const email = playwrightConfig.userName;
let api = '';

test.describe.serial('Appointment Filter - Patient Filter', () => {
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

		await poManager.loginPage.loginBlume();

		await page.waitForTimeout(20000);
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
		// update study status to SIGNED
		await studyHelper.updateStudyStatusSequentially(data?.studyId, tokenObj);
	});

	test.afterAll(async () => {
		if (data?.patientId) {
			await studyHelper.cleanupPatient(data?.patientId, tokenObj);
		}
	});

	test('Filter Completed Appointments', async () => {
		await page.waitForTimeout(TIMEOUT_IN_MSEC3);
		await page.getByRole('tab', { name: 'Completed Appointments' }).click();

		await expect(page.getByTestId('filter-btn')).toBeVisible();
		await page.getByTestId('filter-btn').click();

		const allPatientLocators = page.locator('[data-cy="filter-patient"]');
		const count = await allPatientLocators.count();

		for (let i = 0; i < count; i++) {
			const item = allPatientLocators.nth(i);

			const text = await item.innerText();

			if (!text.includes(data?.patientName)) {
				await item.click({ timeout: TIMEOUT_IN_MSEC4 });
			}
		}

		await page
			.locator('#root div')
			.filter({ hasText: /Welcome/ })
			.getByTestId('blume-close')
			.click();

		const patientElement = page.getByText(data?.patientName, { exact: true, timeout: TIMEOUT_IN_MSEC4 }).first();

		await expect(patientElement.locator('..').locator('..').locator('..')).toContainText(managingOrgName);
	});
});

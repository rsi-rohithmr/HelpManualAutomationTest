const { test, expect, chromium, request } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { BlumeSignUpPage } = require('../POM/blumePage/blumeSignUpPage');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { Common } = require('../POM/common');
const { BreezeAPI } = require('../APIutils/breezeAccountManager');
const { Login } = require('../POM/login');
const { PatientInformationPage } = require('../POM/patientInformation/patientInformationPage');

let patientData = {};
let breezeAPI;
let accountId = '';
let studyHelper = '';
let poManager;
const domain = 'mailsac.com';
const emailSubject = 'OmegaAI Blume Invite Email';
const apiKey = Common.mailsacAPIKey1;
const pin = '123456';
const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
const email = `blumeinvitation${timestamp}@${domain}`;
let patientRes = {};
test.describe.skip('Blume Invitation', () => {
	let page;
	let userName = '';
	let browserContext;
	let tokenObj = {};
	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
		});
		page = await browserContext.newPage();

		const login = new Login(page);
		const apiContext = await request.newContext();
		const api = new APIRequests(apiContext);
		studyHelper = new postStudyNGetToken(apiContext);
		poManager = new POManager(page);

		const managingOrg = playwrightConfig.managingOrg;

		const token = await studyHelper.getTokenAndSessionId();
		tokenObj = {
			accessToken: token.accessToken,
			sessionID: token.sessionID,
		};
		// update patient address
		patientData = await studyHelper.postStudy('', '', '', true);

		patientRes = await api.getResourceById('patient', patientData.patientId, tokenObj);
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
		await poManager.loginPage.loginOmegaAIUser04();
		const patientPage = new PatientInformationPage(page);
		await patientPage.openPatientInformationPageByURL(patientRes.id);
	});

	test('Retrieve the Blume Invitation Link using the Resend Invite feature', async () => {
		const patientPage = new PatientInformationPage(page);
		await patientPage.contactInfoHeading().waitFor({ state: 'visible' });
		await patientPage.contactInfoHeading().click();

		const emailField = patientPage.emailFieldTxt(0);
		await emailField.hover();

		// Click on the first material icon inside the .MuiBox-root
		const materialIcon = page.locator('.MuiBox-root > .material-icons').first();
		await expect(materialIcon).toBeVisible({ timeout: 10000 });
		await materialIcon.click();

		// Wait for and click "Resend Invite" button
		const resendButton = page.locator('button:has-text("Resend Invite")');
		await expect(resendButton).toBeVisible({ timeout: 10000 });
		await resendButton.click();
		// await page.locator('button:has-text("Resend Invite")').click();
		await poManager.apiWaitUtils.waitForAPI('Patient/ResendInvite', 'POST');
		await expect(page.locator('text=INVITE SENT')).toBeVisible({ timeout: 10000 });
	});

	test('Register and confirm that the Blume Account status is ACTIVE.', async () => {
		const patientPage = new PatientInformationPage(page);
		const birthDate = Common.convertToMMDDYYYY(patientData.patientBirthday);
		await page.waitForTimeout(30000);
		await studyHelper.blumeSignUpV2(
			page,
			email,
			patientData.patientFirstName,
			patientData.patientLastName,
			birthDate,
			pin,
			apiKey,
			emailSubject
		);

		await patientPage.openPatientInformationPageByURL(patientRes.id);
		await patientPage.contactInfoHeading().waitFor({ state: 'visible' });
		await patientPage.contactInfoHeading().click();
		// Verify that the "ACTIVE" label with icon is visible
		const activeIcon = page
			.getByTestId('visit-section-Contact Information')
			.locator('div:has(svg)')
			.filter({ hasText: /^ACTIVE$/ });

		await expect(activeIcon).toBeVisible();
	});
});

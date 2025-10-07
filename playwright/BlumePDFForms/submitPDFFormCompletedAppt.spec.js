const { test, expect, chromium, request } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');
const { POManager } = require('../POM/POManager');
const { OrganizationBlumeFormPage } = require('../POM/organization/organizationBlumeFormPage');
const playwrightConfig = require('../../playwright.config');
const { Common } = require('../POM/common');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { APIRequests } = require('../APIutils/APIRequests');
const { Login } = require('../POM/login');
const { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } = require('../POM/timeouts');
const { BreezeAPI } = require('../APIutils/breezeAccountManager');

let registrationForm = {};
let clinicalForm = {};
let data = {};
let healthcareService = {};
let uniqueId = '';
const atHourAndMinuteCell = '23-45';
let tokenObj = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let page;
let browserContext;
let api;
let studyHelper;
let userName = '';
let breezeAPI;
const email = playwrightConfig.userName;
let accountId = '';

test.describe.serial('Blume Submit PDF Form - Completed Appointment', () => {
	test.beforeAll(async () => {
		test.setTimeout(480000);
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 },
		});
		page = await browserContext.newPage();
		poManager = new POManager(page);
		const organizationBlumeFormPage = new OrganizationBlumeFormPage(page);
		const login = new Login(page);
		const accessToken = await login.getAccessTokenForBreezeAccount();
		const apiContext = await request.newContext();
		api = new APIRequests(apiContext);
		studyHelper = new postStudyNGetToken(apiContext);
		uniqueId = uuidv4();
		const managingOrg = playwrightConfig.managingOrg;
		const primaryEntityName = playwrightConfig.primaryEntityName;

		// turn on Blume Automated Front Desk
		breezeAPI = new BreezeAPI(apiContext, accessToken);
		accountId = await breezeAPI.postBreezeAccount(
			managingOrg.organizationName,
			managingOrg.clientId,
			primaryEntityName
		);
		await breezeAPI.updateBreezeAccountAssets(accountId, managingOrg.organizationId, 'Blume Automated Front Desk');
		await poManager.loginPage.logoutOmegaAI();

		// Login and create appointment
		await poManager.loginPage.loginOmegaAI();
		// Open Blume form page and create PDF forms
		await organizationBlumeFormPage.openOrganizationBlumeForm(poManager.sidebar);
		await organizationBlumeFormPage.unselectOrganization();
		await organizationBlumeFormPage.selectOrganization(managingOrgName);
		clinicalForm = await organizationBlumeFormPage.createPDFBlumeForm('Clinical');
		registrationForm = await organizationBlumeFormPage.createPDFBlumeForm('Registration');

		healthcareService = await api.postHealthcareService();

		// Get token and session
		const token = await studyHelper.getTokenAndSessionId();
		tokenObj = {
			accessToken: token.accessToken,
			sessionID: token.sessionID,
		};

		// Wait for forms to be ready
		await page.waitForTimeout(20000);
		data = await studyHelper.postStudy(
			undefined, // createPatientInputFile
			undefined, // isPatientV2
			undefined, // patientPayload
			false, // includePatientNames
			undefined, // managingOrg
			undefined, // imagingOrg
			tokenObj // tokenObj
		);

		// Login and create appointment
		// await poManager.loginPage.loginOmegaAI();
		await poManager.scheduler.openSchedulerDrawer(healthcareService?.name);
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);

		await poManager.scheduler.openNewAppointmentDrawer(atHourAndMinuteCell);
		await page.route('**&workflowstep=ORDERED&**', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 3000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await Promise.all([
			await poManager.scheduler.autoCompleteSearchFormField(
				await poManager.scheduler.patientNameTextBox(),
				data?.patientName,
				'Patient',
				'patient-option-list'
			),
			poManager.apiWaitUtils.waitForAPI('&workflowstep=ORDERED&', 'GET', { timeout: 180000 }),
		]);

		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
		await expect(await poManager.scheduler.orderDropdown()).toContainText(data?.studyDescription);
		// await expect(await poManager.scheduler.deleteStudyIcon()).toBeVisible();

		await poManager.scheduler.createBtn().click();
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);

		await expect(page.locator(`[aria-label="${data?.patientName}"]`)).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });

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
		// Logout
		await poManager.loginPage.logoutOmegaAI();
		const userDetails = await api.getUserDetails();
		userName = userDetails.name[0].text;
	});

	test.afterAll(async () => {
		if (accountId) {
			await breezeAPI.deleteBreezeAccount(accountId);
		}
		// Remove Forms per each test run
		if (registrationForm?.id) {
			await api.deleteResource('form', registrationForm?.id);
		}
		if (clinicalForm?.id) {
			await api.deleteResource('form', clinicalForm?.id);
		}
		if (data?.patientId) {
			await studyHelper.cleanupPatient(data?.patientId, tokenObj);
		}
		await browserContext.close();
	});

	test('Submit Patient Registration PDF Form', async () => {
		await page.waitForTimeout(TIMEOUT_IN_MSEC4);
		await page.evaluate(() => window.localStorage.clear());
		await poManager.loginPage.loginBlume();
		await page.waitForTimeout(TIMEOUT_IN_MSEC3);
		// Go to Completed Appointments tab
		const completedTab = poManager.blume.completedAppointmentsTab();
		await expect(completedTab).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await completedTab.click();
		await page.waitForTimeout(3000);
		// Find and click the access forms button for the specific patient in completed appointments
		const appointmentCard = page.locator('.css-j0iiqq').filter({ hasText: data?.patientName });
		await expect(appointmentCard).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await expect(appointmentCard).toContainText(managingOrgName);
		const accessFormsBtn = appointmentCard.getByText('Access forms');
		await expect(accessFormsBtn).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await accessFormsBtn.click();
		await page.locator('span').filter({ hasText: registrationForm?.name }).click();
		await page.waitForTimeout(TIMEOUT_IN_MSEC2);
		await page.route('**/blume-api/form/v2/*', route => route.continue());
		await page.getByTestId('next', { timeout: TIMEOUT_IN_MSEC1 }).click();
		await poManager.apiWaitUtils.waitForAPI('blume-api/form/v2/', 'PUT', TIMEOUT_IN_MSEC4);
	});

	test('Submit Clinical PDF Form', async () => {
		await page.locator('span').filter({ hasText: clinicalForm?.name }).click();
		await page.waitForTimeout(TIMEOUT_IN_MSEC2);
		await page.route('**/blume-api/form/v2/*', route => route.continue());
		await page.getByTestId('next', { timeout: TIMEOUT_IN_MSEC1 }).click();
		await poManager.apiWaitUtils.waitForAPI('blume-api/form/v2/', 'PUT', TIMEOUT_IN_MSEC4);
	});
});

import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } from '../POM/timeouts';

const { test, request, expect, chromium } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

const managingrganizationId = playwrightConfig.managingOrg.organizationId;
const appointmentUID = "47b9b262-8191-4044-b205-d7f7e68428a4";
const ACTION_DISPLAY = 'Arrived';
const ACTION = 'arrived';
const TRIGGER_TYPE = 'APPOINTMENT';
const IS_FIRST_ACTION = true;
let data = {};
let healthcareService = {};
const atHourAndMinuteCell = '23-45';
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let page;
let browser;

let tokenObj = {};
let updatedAppointmentId = '';
test.describe.serial('appointmentStatusSendEmailAction', () => {
	test.beforeEach(async () => {
		const apiContext = await request.newContext();
		const apiRequests = new APIRequests(apiContext);

		const api = new postStudyNGetToken(apiContext);
		browser = await chromium.launch();
		page = await browser.newPage();

		await api.postStudy().then(result => {
			console.log(result);
			data = result;
		});
		healthcareService = await api.postHealthcareService();
		tokenObj = await api.getTokenAndSessionId();

		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await poManager.workflowAutomationPage.clearWorkflowAutomation(apiRequests, ACTION, 'AppointmentStatus', managingrganizationId);
		
		console.log('go to Workflow Automation Page');
		await poManager.workflowAutomationPage.openWorkflowAutomationPageByUrl(managingrganizationId);
		await poManager.workflowAutomationPage.createAppointmentStatusTrigger(ACTION_DISPLAY);
		await poManager.workflowAutomationPage.createSendEmailActionToSpecificUser(ACTION_DISPLAY, TRIGGER_TYPE, IS_FIRST_ACTION);
		await poManager.workflowAutomationPage.createSendEmailActionToReadingPhysician(ACTION_DISPLAY,TRIGGER_TYPE, false, true);

		await poManager.homePage.homePageBtn().click();
	});

	test('Create appointment', async () => {
		const poManager = new POManager(page);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', data?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);

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
			poManager.apiWaitUtils.waitForAPI('&workflowstep=ORDERED&', 'GET', { timeout: 5000 }),
		]);

		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
		await expect(await poManager.scheduler.orderDropdown()).toContainText(data?.studyDescription);
		await expect(await poManager.scheduler.deleteStudyIcon()).toBeVisible();

		await poManager.scheduler.createBtn().click();
		// await page.locator('[data-cy="CREATE_"]').nth(1).click();
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);

		await expect(page.locator(`[aria-label="${data?.patientName}"]`)).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });

		await poManager.scheduler.openEditAppointmentDrawer(data?.patientName);

		await poManager.common.selectOptionFromSingleSelection(await poManager.scheduler.statusCombo(), 'Arrived');
		await (await poManager.scheduler.asapPriorityIcon()).click();

		await page.waitForTimeout(2000);

		// Capture API response
		const responsePromise = page.waitForResponse(
			response => response.url().includes('/Appointment') && response.request().method() === 'PUT'
		);

		await poManager.scheduler.updateBtn().click();

		const response = await responsePromise;
		if (response.status() === '200') {
			const responseBody = await response.json(); // Parse response as JSON
			updatedAppointmentId = responseBody.id;
			console.log('Updated Appointment ID:', updatedAppointmentId); // Extract and log the ID
		}

		await expect(poManager.scheduler.statusOnAptDetailsCard()).toContainText('Arrived');
		await expect(poManager.scheduler.priorityOnAptDetailsCard(), { timeout: TIMEOUT_IN_MSEC3 }).toContainText(
			'ASAP'
		);
	});
		test('Check if there Email Send by Workflow Automation', async ({ page }) => {
            const apiContext = await request.newContext();
			const postStudy = new postStudyNGetToken(apiContext);
			let response = await postStudy.getFhirResourceByCriteria('task', `managingOrganization=${managingrganizationId}&reasoncode=Email&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=est%20Email%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20Arrived`);
			await expect(response.total).toBeGreaterThan(0);
			response = await postStudy.getFhirResourceByCriteria('task', `managingOrganization=${managingrganizationId}&reasoncode=Email&receiverUserNames=RAMSOFTLOCALUSER02%40GMAIL.COM&trigger=Workflow%20Automation&message=Test%20Email%20Send%20to%20Reading%20Physician%20by%20Workflow%20Automation%20on%20Arrived`);
			await expect(response.total).toBeGreaterThan(0);
		});
});
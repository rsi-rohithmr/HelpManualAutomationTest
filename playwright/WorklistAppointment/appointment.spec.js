import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC4 } from '../POM/timeouts';
const { test, request, expect, chromium } = require('@playwright/test');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');

let data = {};
let healthcareService = {};
const atHourAndMinuteCell = '23-45';
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let page;
let browser;

let tokenObj = {};
let updatedAppointmentId = '';

test.describe.serial('OAI Appointment', async () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
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
			poManager.apiWaitUtils.waitForAPI('&workflowstep=ORDERED&', 'GET', { timeout: 180000 }),
		]);

		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
		await expect(await poManager.scheduler.orderDropdown()).toContainText(data?.studyDescription);
		await expect(await poManager.scheduler.deleteStudyIcon()).toBeVisible();

		await poManager.scheduler.createBtn().click();
		// await page.locator('[data-cy="CREATE_"]').nth(1).click();
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);

		await expect(page.locator(`[aria-label="${data?.patientName}"]`)).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
	});

	test('Update appointment', async () => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);

		console.log('Patient name:', data?.patientName);
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
		await poManager.scheduler.openEditAppointmentDrawer(data?.patientName);

		await poManager.common.selectOptionFromSingleSelection(await poManager.scheduler.statusCombo(), 'Confirmed');
		await (await poManager.scheduler.asapPriorityIcon()).click();

		await page.waitForTimeout(3000);

		// Capture API response
		const responsePromise = page.waitForResponse(
			response => response.url().includes('/Appointment') && response.request().method() === 'PUT'
		);

		await poManager.scheduler.updateBtn().click();

		const response = await responsePromise;
		if (response.status() == '200') {
			const responseBody = await response.json(); // Parse response as JSON
			updatedAppointmentId = responseBody.id;
			console.log('Updated Appointment ID:', updatedAppointmentId); // Extract and log the ID
		}

		await expect(poManager.scheduler.statusOnAptDetailsCard()).toContainText('Confirmed');
		await expect(poManager.scheduler.priorityOnAptDetailsCard(), { timeout: TIMEOUT_IN_MSEC3 }).toContainText(
			'ASAP'
		);
	});

	test('Verify data sync from appointment to worklist grid when updating appointment', async () => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);

		await expect(
			page
				.locator(`[data-cy="study-status-cell-0_studyStatus"] [id="studyStatusText"]`)
				.getByText(poManager.common.buildSearchPattern('CONFIRMED'))
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		await expect(
			page
				.locator(`[data-cy="study-status-cell-0_priority"] p`)
				.getByText(poManager.common.buildSearchPattern('ASAP'))
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
	});

	test('Verify data sync from study and order to appointment and worklist grid', async () => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);

		const order = await poManager.common.getResourceById('ServiceRequest', data?.orderId, tokenObj);
		order.priority = 'URGENT';

		// Uncomment if referring physician update is needed
		// order.requester.id = refPhysicianId2;
		// order.requester.display = refPhysician2;
		// order.requester.reference = `Practitioner/${refPhysicianId2}`;
		// order.requester.extension[0].valueReference.display = refOrgName2;

		await poManager.common.updateResourceById('ServiceRequest', order?.id, order, tokenObj);
		const study = await poManager.common.getResourceById('ImagingStudy', data?.studyId, tokenObj);
		const newStatus = 'ARRIVED';
		const statusIndex = study.extension.findIndex(
			({ url }) => url === 'http://www.ramsoft.com/fhir/StructureDefinition/status'
		);
		study.extension[statusIndex].valueString = newStatus;

		await poManager.common.updateResourceById('ImagingStudy', study?.id, study, tokenObj);
		await expect(
			await page
				.locator(`[data-cy="study-status-cell-0_studyStatus"] [id="studyStatusText"]`)
				.getByText(new RegExp(`^${newStatus}$`, 'g'))
		).toBeVisible({
			timeout: 180000,
		});
		await expect(
			await page.locator(`[data-cy="study-status-cell-0_priority"] p`).getByText(new RegExp(`^URGENT$`, 'g'))
		).toBeVisible({
			timeout: 180000,
		});

		// await expect(await page.locator(`:has-text("${await poManager.common.buildSearchPattern(newStatus)}")`)).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		// await expect(await page.locator(`:has-text("${await poManager.common.buildSearchPattern('URGENT')}")`)).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });
		// await expect(await page.locator(await poManager.common.buildSearchPattern('URGENT'))).toBeVisible({ timeout: TIMEOUT_IN_MSEC4 });

		await expect(await poManager.scheduler.statusOnAptDetailsCard()).toContainText(newStatus, {
			timeout: TIMEOUT_IN_MSEC4,
			ignoreCase: true, // Ignores case differences
		  });
		await expect(await poManager.scheduler.priorityOnAptDetailsCard()).toContainText('URGENT');
	});

	test('Verify MirthOutbound task created after resource updated', async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		const taskResource = 'task';
		// search mirthoutbound task for patient updated
		let patientTaskCriteria = 'reasoncode=mirthoutbound&status=ready&focus.reference=patient/' + data?.patientId;
		console.log('Get outbound task by request criteria: ' + patientTaskCriteria);

		await api.getFhirResourceByCriteria(taskResource, patientTaskCriteria).then(result => {
			console.log('Search outbound patient task result', result);
			expect(result.total).toEqual(1);
		});
		// search mirthoutbound task for study updated
		let studyTaskCriteria = 'reasoncode=mirthoutbound&status=ready&focus.reference=imagingstudy/' + data?.studyId;
		console.log('Get outbound task by request url: ' + studyTaskCriteria);

		await api.getFhirResourceByCriteria(taskResource, studyTaskCriteria).then(result => {
			console.log('Search outbound study task result', result);
			expect(result.total).toEqual(1);
		});
		// search mirthoutbound task for appointment updated
		if (updatedAppointmentId) {
			let apptTaskCriteria =
				'reasoncode=mirthoutbound&status=ready&focus.reference=appointment/' + updatedAppointmentId;
			console.log('Get outbound task by request url: ' + apptTaskCriteria);

			await api.getFhirResourceByCriteria(taskResource, apptTaskCriteria).then(result => {
				console.log('Search outbound appointment task result', result);
				expect(result.total).toEqual(1);
			});
		}
	});
	// test('Delete appointment', async () => {
	// 	const apiContext = await request.newContext();
	// 	const poManager = new POManager(page, apiContext);

	// 	// if (testInfo.retry) {
	// 	// 	await poManager.scheduler.openSchedulerDrawer(page, healthcareService?.name);
	// 	// 	await poManager.scheduler.openAppointmentDetailsCard(page, data?.patientName);
	// 	// }

	// 	await poManager.scheduler.deleteIconOnAptDetailsCard().click();
	// 	await expect(await page.locator(`[aria-label="${data?.patientName}"]`)).not.toBeVisible({
	// 		timeout: TIMEOUT_IN_MSEC4,
	// 	});
	// });
});

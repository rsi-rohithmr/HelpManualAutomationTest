const { POManager } = require('../POM/POManager');
const { test, expect } = require('@playwright/test');
const { OrderInformationPage } = require('../POM/visits/order/orderInformationPage');
import { orderDO } from 'playwright/dataObjects/orderDO';
import { orderGenerator } from 'playwright/generators/orderGenerator';
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { PageHelper } from '../POM/utils/pageHelper';
import { StudyInfoPage } from '../POM/study/studyInfoPage';
const { cloneDeep } = require('lodash');
const { dateTimeHelper } = require('../POM/utils/dateTimeHelper');
const playwrightConfig = require('../../playwright.config');

let orderInfo;
let orderInformationPage;
let pageHelper;

test.describe.serial('Order info Tests', () => {
	let expectedOrderInfoDO = {
		orderDetailSection: { ...orderDO.orderDO },
	};
	let expectedOrderCount = 0;
	test.beforeAll(async ({}) => {
		orderInfo = await studyGenerator.postStudy();
	});

	test.beforeEach('Login OAI', async ({ page }) => {
		const poManager = new POManager(page);
		orderInformationPage = new OrderInformationPage(page);
		pageHelper = new PageHelper(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('verify the order number in order section right panel', async ({ page }) => {
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		const serviceRequestResponse = await orderInformationPage.openOrderDetailsAndWaitForAPI(
			orderInfo?.orderId,
			`/ServiceRequest/`
		);
		console.log('serviceRequestResponse', serviceRequestResponse);
		expectedOrderInfoDO = orderGenerator.getOrderDetailsFromInputJson(serviceRequestResponse);
		const serviceRequestResponseByEncounter = await orderInformationPage.getServiceRequestWithWaitForAPI(
			'/ServiceRequest?'
		);

		expectedOrderCount = serviceRequestResponseByEncounter.total;

		const actualOrderCount = await orderInformationPage.getStudyCountValue();
		expect(actualOrderCount).toEqual(expectedOrderCount);
	});

	test('verify order details section', async ({ page }) => {
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		const serviceRequestResponse = await orderInformationPage.openOrderDetailsAndWaitForAPI(
			orderInfo?.orderId,
			`/ServiceRequest/`
		);
		console.log('serviceRequestResponse', serviceRequestResponse);
		expectedOrderInfoDO = orderGenerator.getOrderDetailsFromInputJson(serviceRequestResponse);
		await orderInformationPage.getServiceRequestWithWaitForAPI('/ServiceRequest?');
		console.log('expectedOrderInfoDO', expectedOrderInfoDO);
		const actualOrderDetailsDO = await orderInformationPage.getOrderDetailsFromPage();

		expect(actualOrderDetailsDO.accessionNumber).toEqual(expectedOrderInfoDO['Accession Number']);
		expect(actualOrderDetailsDO.orderedDate).toEqual(expectedOrderInfoDO['Ordered Date']);
		expect(actualOrderDetailsDO.requestedDate).toEqual(expectedOrderInfoDO['Requested Date']);
		expect(actualOrderDetailsDO.priority).toEqual(expectedOrderInfoDO['Priority']?.toUpperCase());
		expect(actualOrderDetailsDO.status).toEqual(expectedOrderInfoDO['Status']?.toUpperCase());
		expect(actualOrderDetailsDO.fillerOrderNum).toEqual(expectedOrderInfoDO['Filler Order Number']);
		expect(actualOrderDetailsDO.placedOrderNum).toEqual(expectedOrderInfoDO['Placed Order Number']);
		expect(actualOrderDetailsDO.referringPhysician).toEqual(
			expectedOrderInfoDO['Referring Physician']?.toUpperCase()
		);
		expect(actualOrderDetailsDO.referringOrganization).toEqual(
			expectedOrderInfoDO['Referring Organization']?.toUpperCase()
		);
		expect(actualOrderDetailsDO.consultingPhysician).toEqual(
			expectedOrderInfoDO['Consulting Physician']?.toUpperCase()
		);
	});

	test('fill in order drawer form and add new referring org and referring physician', async ({ page }) => {
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		await orderInformationPage.openOrderDetailsAndWaitForAPI(orderInfo?.orderId, `/ServiceRequest/`);

		await orderInformationPage.getServiceRequestWithWaitForAPI('/ServiceRequest?');
		await orderInformationPage.getEditOrderIcon().click();
		const accessionField = await orderInformationPage.getOrderDrawerAccessionNumberField();
		await accessionField.fill('ACC123456');
		//#TODO
		const orderDateField = await orderInformationPage.getOrderDrawerOrderDateTimeField();
		await pageHelper.selectDateFromDatePicker(orderDateField, '05/02/2025 10:00 AM');
		//await orderInformationPage.setDateTime(orderDateField, '05/02/2025 10:00 AM');

		const requestedDateField = await orderInformationPage.getOrderDrawerRequestedAppointmentDateTimeField();
		await pageHelper.selectDateFromDatePicker(requestedDateField, '05/03/2025 11:00 AM');
		//await orderInformationPage.setDateTime(requestedDateField, '05/03/2025 11:00 AM');

		const priorityField = await orderInformationPage.getOrderDrawerPriorityField();
		await priorityField.fill('ASAP');
		// Fill referring physician by search
		await orderInformationPage.searchAndSelectReferringPhysician('TEST');

		const serviceRequestResponse = await orderInformationPage.saveOrderDetails();

		console.log('serviceRequestResponse', serviceRequestResponse);

		expectedOrderInfoDO = orderGenerator.getOrderDetailsFromInputJson(serviceRequestResponse);
		console.log('expectedOrderInfoDO', expectedOrderInfoDO);
		const actualOrderDetailsDO = await orderInformationPage.getOrderDetailsFromPage();
		expect(actualOrderDetailsDO.accessionNumber).toEqual(expectedOrderInfoDO['Accession Number']);
		expect(actualOrderDetailsDO.orderedDate).toEqual(expectedOrderInfoDO['Ordered Date']);
		expect(actualOrderDetailsDO.requestedDate).toEqual(expectedOrderInfoDO['Requested Date']);
		expect(actualOrderDetailsDO.priority).toEqual(expectedOrderInfoDO['Priority']?.toUpperCase());
		expect(actualOrderDetailsDO.status).toEqual(expectedOrderInfoDO['Status']?.toUpperCase());
		expect(actualOrderDetailsDO.fillerOrderNum).toEqual(expectedOrderInfoDO['Filler Order Number']);
		expect(actualOrderDetailsDO.placedOrderNum).toEqual(expectedOrderInfoDO['Placed Order Number']);
		expect(actualOrderDetailsDO.referringPhysician).toEqual(
			expectedOrderInfoDO['Referring Physician']?.toUpperCase()
		);
		expect(actualOrderDetailsDO.referringOrganization).toEqual(
			expectedOrderInfoDO['Referring Organization']?.toUpperCase()
		);
		expect(actualOrderDetailsDO.consultingPhysician).toEqual(
			expectedOrderInfoDO['Consulting Physician']?.toUpperCase()
		);
	});

	test('verify add new study', async ({ page }) => {
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		await orderInformationPage.openOrderDetailsAndWaitForAPI(orderInfo?.orderId, `/ServiceRequest/`);

		await orderInformationPage.searchAndSelectStudy('StudyType');
	});

	test('verify change patient flow', async ({ page }) => {
		const patient1Info = await studyGenerator.postStudy();
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		await orderInformationPage.openOrderDetailsAndWaitForAPI(orderInfo?.orderId, `/ServiceRequest/`);

		await orderInformationPage.searchAndChangePatient(patient1Info.patientName);
		await page.reload();
		await orderInformationPage.getServiceRequestWithWaitForAPI('/ServiceRequest?');
		expect(patient1Info.patientId).not.toEqual(orderInfo.patientId);
	});

	test('Add, update and delete order note', async ({ page }) => {
		await page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		const serviceRequestResponse = await orderInformationPage.openOrderDetailsAndWaitForAPI(
			orderInfo?.orderId,
			`/ServiceRequest/`
		);
		console.log('serviceRequestResponse', serviceRequestResponse);
		expectedOrderInfoDO = orderGenerator.getOrderDetailsFromInputJson(serviceRequestResponse);
		await orderInformationPage.getServiceRequestWithWaitForAPI('/ServiceRequest?');
		console.log('expectedOrderInfoDO', expectedOrderInfoDO);
		const actualOrderDetailsDO = await orderInformationPage.getOrderDetailsFromPage();
		let studyInfoPage = new StudyInfoPage(page);
		await orderInformationPage.orderNotesSectionExpandBtn().click();
		console.log('actualOrderDetailsDO', actualOrderDetailsDO);

		let expectedOrderNote = cloneDeep(orderDO.orderNotes);

		expectedOrderNote.count = 2;
		expectedOrderNote.note0Content = 'E2E Note 1';
		expectedOrderNote.note0CreatedBy = studyInfoPage.reverseName(playwrightConfig.userFullName2, true);
		expectedOrderNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY h:mm A');
		await orderInformationPage.addNote(expectedOrderNote.note0Content);
		await page.reload();
		await orderInformationPage.orderNotesSectionExpandBtn().click();
		let actualOrderNote = await orderInformationPage.getOrderNoteFormValues();

		console.log('actualOrderNoteAfterAdd', actualOrderNote);
		console.log('expectedOrderNoteAfterAdd', expectedOrderNote);
		expect({ ...expectedOrderNote, ...actualOrderNote }).toEqual(actualOrderNote);

		// Update study note
		const note2 = 'E2E Note 2';
		expectedOrderNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY h:mm A');
		await orderInformationPage.updateNote(note2);
		expectedOrderNote.note0Content = note2;
		actualOrderNote = await orderInformationPage.getOrderNoteFormValues();

		console.log('actualOrderNoteAfterAdd', actualOrderNote);
		console.log('expectedOrderNoteAfterAdd', expectedOrderNote);
		expect({ ...expectedOrderNote, ...actualOrderNote }).toEqual(actualOrderNote);

		// Delete a study note
		expectedOrderNote = cloneDeep(orderDO.orderNotes);
		await orderInformationPage.deleteNote();
		actualOrderNote = await orderInformationPage.getOrderNoteFormValues();
		console.log('actualOrderNoteAfterAdd', actualOrderNote);
		console.log('expectedOrderNoteAfterAdd', expectedOrderNote);
		expect({ ...expectedOrderNote, ...actualOrderNote }).toEqual(actualOrderNote);
	});
});

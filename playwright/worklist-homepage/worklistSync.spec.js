import { TIMEOUT_IN_MSEC5 } from '../POM/timeouts';
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { test, request, expect, chromium } = require('@playwright/test');

const tokenObj = {};
let patientInfo;
let browser;
let page;
const managingOrgName = playwrightConfig.managingOrg.organizationName;

test.describe('Worklist Sync', () => {
	test.beforeAll(async ({}) => {
		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// const apiRequests = new APIRequests(apiContext);

		const tokenResult = await api.getTokenAndSessionId();
		tokenObj.accessToken = tokenResult?.accessToken;
		tokenObj.sessionID = tokenResult?.sessionID;

		await api.postStudy(true).then(result => {
			console.log('Posted study', result);
			patientInfo = result;
		});

		await poManager.loginPage.loginOmegaAI();
	});
	test('Verify worklist sync when updating patient name - patient update', async ({}) => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);
		const newPatientName = `${patientInfo?.patientName} UPDATED`;
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await expect(
			page.getByText(new RegExp(`^${patientInfo?.patientName}$`, 'g'), { timeout: TIMEOUT_IN_MSEC5 }).first()
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC5 });

		const patientRes = await poManager.common.getResourceById('patient', patientInfo?.patientId, tokenObj);
		patientRes.name[0].text = newPatientName;
		patientRes.name[0].family = newPatientName;

		const updateRes = await poManager.common.updateResourceById('patient', patientRes?.id, patientRes, tokenObj);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${newPatientName}$`, 'g'), { timeout: TIMEOUT_IN_MSEC5 })
				.first()
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC5 });
	});

	test('Verify worklist sync when updating priority - ServiceRequest update', async ({}) => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		const res = await poManager.common.getResourceById('ServiceRequest', patientInfo?.orderId, tokenObj);
		const newPriority = 'ASAP';
		res.priority = newPriority;

		const updateRes = await poManager.common.updateResourceById('ServiceRequest', res?.id, res, tokenObj);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${newPriority}$`, 'g'), { timeout: TIMEOUT_IN_MSEC5 })
				.first()
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC5 });
	});

	test('Verify worklist sync when updating study status - ImagingStudy update', async ({}) => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page, apiContext);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);

		const res = await poManager.common.getResourceById('ImagingStudy', patientInfo?.studyId, tokenObj);
		const newStatus = 'CONFIRMED';
		const statusIndex = res?.extension?.findIndex(
			({ url }) => url === 'http://www.ramsoft.com/fhir/StructureDefinition/status'
		);
		res.extension[statusIndex].valueString = newStatus;
		res.status = newStatus;

		const updateRes = await poManager.common.updateResourceById('ImagingStudy', res?.id, res, tokenObj);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${newStatus}$`, 'g'), { timeout: TIMEOUT_IN_MSEC5 })
				.first()
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC5 });
	});
});

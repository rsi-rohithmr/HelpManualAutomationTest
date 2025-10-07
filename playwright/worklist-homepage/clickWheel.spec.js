import { test, expect, request } from '@playwright/test';
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
import { PatientInformationPage } from '../POM/patientInformation/patientInformationPage';
import { TIMEOUT_IN_MSEC2 } from '../POM/timeouts';
import { OrderInformationPage } from '../POM/visits/order/orderInformationPage';
import { StudyInfoPage } from '../POM/study/studyInfoPage';

let patientInfo = {};
// let patientInfo;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let patientInformationPage;
test.describe.serial('OAI Worklist wheel', async () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log('Posted study', result);
			patientInfo = result;
		});
	});

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
		patientInformationPage = new PatientInformationPage(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Access ClickWheel', async ({ page }) => {
		console.log('patientInfo.patientName', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		// const nameRegex = new RegExp(`^${patientInfo.patientName}$`);
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await poManager.clickWheel.closeClickWheel().click();
		await expect(poManager.clickWheel.clickWheel()).not.toBeVisible();
	});

	test('ClickWheel - open Patient Info', async ({ page }) => {
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await page.route('**/fhir/Patient/*', route => route.continue());
		await expect(poManager.clickWheel.patientIcon()).toBeVisible();
		await poManager.clickWheel.patientIcon().click({ force: true });
		await poManager.apiWaitUtils.waitForAPI('/fhir/Patient', 'GET');
		await expect(patientInformationPage.generalInfoHeading()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });
	});

	test('ClickWheel - double click to open Image Viewer', async ({ page }) => {
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await page.route('**/fhir/ImagingStudy**', route => route.continue());
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
			.first()
			.dblclick();
		await poManager.apiWaitUtils.waitForAPI('/fhir/ImagingStudy', 'GET');
		await expect(poManager.imageViewer.imageViewerWrapper()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });
	});

	test('ClickWheel - open order', async ({ page }) => {
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await page.route('**/fhir/ServiceRequest**', route => route.continue());
		await expect(poManager.clickWheel.orderIcon()).toBeVisible();
		await poManager.clickWheel.orderIcon().click({ force: true });
		await poManager.apiWaitUtils.waitForAPI('/fhir/ServiceRequest', 'GET');
		let orderInformationPage = new OrderInformationPage(page);
		await expect(orderInformationPage.getOrderLabel()).toBeVisible({
			timeout: TIMEOUT_IN_MSEC2,
		});
	});

	test('ClickWheel - open study', async ({ page }) => {
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', patientInfo.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientInfo.patientName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await page.route('**/fhir/Encounter**', route => route.continue());
		await expect(poManager.clickWheel.studyIcon()).toBeVisible();
		await poManager.clickWheel.studyIcon().click({ force: true });
		await poManager.apiWaitUtils.waitForAPI('/fhir/Encounter', 'GET');
		let studyInfoPage = new StudyInfoPage(page);
		await expect(studyInfoPage.studyStatusComboInView()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });
	});
});

const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { POManager } = require('../POM/POManager');
const { ApiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';

const getRandomNumber = () => Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

let finalReportName;

const date = new Date().toDateString();

test.beforeAll(async ({}) => {
	const apiContext = await request.newContext();
	const api = new postStudyNGetToken(apiContext);

	await api.postStudy().then(result => {
		console.log(result);
		studyInfo = result;
	});

	await api.getUserDetails().then(result => {
		// console.log(result)
		userdetails = result;
		console.log(userdetails.name[0].text);
		name = userdetails.name[0].text;
	});
});
test.beforeEach('login', async ({ page }) => {
	const poManager = new POManager(page);
	const randomNum = faker.datatype.number({
		min: 1111111111,
		max: 9999999999,
	});

	finalReportName = `Final Report ${randomNum}`;
	await poManager.loginPage.loginOmegaAI();
});

test('Final Report Upload and Amendment', async ({ page }) => {
	const poManager = new POManager(page);

	await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);
	await page.route('**/fhir/fhir?studyuid*', async route => {
		await route.continue();
	});
	await page.route('**/fhir/DiagnosticReport/*', async route => {
		await route.continue();
	});
	const documentPostPromise = poManager.apiWaitUtils.waitForAPI('/fhir/fhir?studyuid', 'POST');
	const reportContentPromise = poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');

	await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);

	await documentPostPromise;
	await reportContentPromise;

	await expect(poManager.documentViewer.finalCardReportTitle().first()).toContainText(finalReportName);
	await expect(poManager.documentViewer.pdfViewerArea().first()).toContainText(
		'Comparison is made with previous CT scan reported DATE and DATE'
	);

	await poManager.documentViewer.amendReport();

	await page.route('**/fhir/DiagnosticReport/*', async route => {
		await route.continue();
	});
	const amendedReportContentPromise = poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');

	await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName,true);

	await amendedReportContentPromise;

	await poManager.documentViewer.finalReportCardValidation(
		name,
		managingOrgName,
		'Amending the final report after upload'
	);

	await expect(poManager.documentViewer.pdfViewerArea()).toContainText(
		'Comparison is made with previous CT scan reported DATE and DATE'
	);
	await expect(poManager.documentViewer.amendedIcon()).toBeVisible();

	await poManager.documentViewer.deleteReport();
});

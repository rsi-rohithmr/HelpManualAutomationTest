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
const modifyText = 'Modify report content';

test.describe('Document Viewer', () => {
	test.beforeEach('login', async ({ page }) => {
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
		const poManager = new POManager(page);

		await poManager.loginPage.loginOmegaAI();
	});
	test('Check table creation', async ({ page }) => {
		const poManager = new POManager(page);
		const reportTxt = 'Test report save';
		await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
			await route.fulfill({
				status: 200,
				body: [],
			});
		});
		// Open document viewer.
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);

		// Add a diagnostic report in the new editor.
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		// Instead of cy.intercept, we use Playwright’s waitForResponse.
		await page.route('**/fhir/DiagnosticReport/*', async route => {
			await route.continue();
		});
		await Promise.all([
			poManager.documentViewer.addVerifyTable(modifyText, false),
			// Wait for the report update API call to be successful.
			poManager.apiWaitUtils.waitForAPI('fhir/DiagnosticReport/', 'PUT'),
		]);

		await page.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			await route.continue();
		});
		// Navigate back to home page and then reopen document viewer.
		await poManager.documentViewer.openHomePage();
		await Promise.all([
			poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true),
			poManager.apiWaitUtils.waitForAPI('/ReportContent?', 'GET'),
		]);

		await poManager.documentViewer.addVerifyTable(modifyText, true);
		await poManager.documentViewer.deletePreliminaryReport();
	});
});

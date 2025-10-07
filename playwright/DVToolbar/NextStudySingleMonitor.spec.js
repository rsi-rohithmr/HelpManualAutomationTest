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
let reportName;
let SDName;
let documentName;
let finalReportName;

test.describe('Next study and Prior studies check', () => {
	// Set up date strings
	let date = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
	date = date.slice(date.indexOf(' ') + 1).replace(',', '');
	const reportDate = new Date().toLocaleDateString('es-AR');
	let poManager;
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudywithPrior().then(result => {
			console.log(result);
			studyInfo = result;
		});

		await api.getUserDetails().then(result => {
			// console.log(result)
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		// Replace cy.generateRandomNumber with plain JavaScript
		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		reportName = `Preliminary ${randomNum}`;
		SDName = `SD Rename ${randomNum}`;
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
	});

	test.beforeEach(async ({ page }) => {
		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
	});

	test('Check prior studies, next study and study filters', async ({ page }) => {
		const reportTxt = 'Test report save';

		// Open the Document Viewer for the given patient and managing organization.
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);
		console.log('Report date:', reportDate);

		// Validate preliminary report card and add a diagnostic report.
		await poManager.documentViewer.preliminaryReportCardValidation(
			'reading physician',
			'Preliminary Report',
			'managing organization',
			'skip',
			reportDate
		);

		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);

		// Move to the next study and add another diagnostic report.
		await poManager.documentViewer.signAndNextStudy();
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		await poManager.documentViewer.uploadDocumentInStudyList(documentName, false);
		await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
		await page.route('**/ReportContent*', async route => {
			await route.continue();
		});
		await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);
		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await page.route('**/DocumentContent?*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
		});

		// Return to the home page and reopen the document viewer.
		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);

		// Validate elements in the prior study section.
		const priorStudySection = poManager.documentViewer.priorStudySection();
		await expect(priorStudySection).toBeVisible();
		await priorStudySection.click();
		await expect(poManager.documentViewer.priorFinalCardRefferringPhysician()).toBeVisible();
		await expect(poManager.documentViewer.priorStudyCardReportTitle()).toBeVisible();

		// Wait for and validate the report content for the final document.
		await page.route('**/ReportContent*', async route => {
			await route.continue();
		});
		await poManager.documentViewer.priorFinalCardRefferringPhysician().click();
		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await expect(poManager.documentViewer.priorFinalCardReportTitle().first()).toContainText(finalReportName);
		await expect(poManager.documentViewer.pdfViewerArea().first()).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);

		// Validate document content.
		await page.route('**/DocumentContent?*', async route => {
			await route.continue();
		});
		await poManager.documentViewer.priorStudyCardReportTitle().click();
		await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
		await expect(poManager.documentViewer.priorStudyCardReportTitle().first()).toContainText(documentName);
		await expect(poManager.documentViewer.pdfViewerArea().first()).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);

		// ----- Study Filter checks -----

		// Ensure the 'All' tab is visible.
		const allTab = page.locator('.css-7a6qt5', { hasText: 'All' });
		await expect(allTab).toBeVisible();

		// Click the 'Current Study' tab and verify its section is visible.
		const currentStudyFilter = poManager.documentViewer.currentStudyFilter();
		await expect(currentStudyFilter).toBeVisible();
		await currentStudyFilter.click();
		await expect(poManager.documentViewer.currentStudySection()).toBeVisible();

		// Verify that there are 0 items in the 'prior' section.
		const priorCount = await poManager.documentViewer.getElementCount('#prior');
		expect(priorCount).toBe(0);

		// Click the 'Prior Studies' tab and verify the 'Current Study' section is not visible.
		const priorStudyFilter = poManager.documentViewer.priorStudyFilter(page);
		await expect(priorStudyFilter).toBeVisible();
		await priorStudyFilter.click();
		const currentStudyCount = await poManager.documentViewer.getElementCount('[id="currentStudy"]');
		expect(currentStudyCount).toBe(0);
		await expect(poManager.documentViewer.priorStudySection()).toBeVisible();

		// Click the 'All' tab again to ensure both sections are visible.
		const allTabAlt = page.locator('.css-19uj5av', { hasText: 'All' });
		await expect(allTabAlt).toBeVisible();
		await allTabAlt.click();
		await expect(poManager.documentViewer.currentStudySection()).toBeVisible();
		await expect(poManager.documentViewer.priorStudySection()).toBeVisible();
	});
});

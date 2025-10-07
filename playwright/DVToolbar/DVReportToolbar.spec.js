const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');
test.describe('Document Viewer', () => {
	let studyInfo = {};
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let name = '';
	let reportName;
	let documentName;
	let finalReportName;
	const date = new Date().toDateString();
	let userdetails;

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
	});

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		});
		reportName = `Preliminary ${randomNum}`;
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		await poManager.loginPage.loginOmegaAI();
	});
	// Bug #RT-4662
	test('Critical findings', async ({ page }) => {
		const reportTxt = 'Test report save';
		const modifyText = 'Modify report save';
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		await poManager.documentViewer.markReportAsCritical();
		await expect(await poManager.documentViewer.criticalFindingIcon()).toBeVisible();
		await page.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			await route.continue();
		});
		await poManager.documentViewer.signBtn().hover();
		await poManager.documentViewer.previewBtn().click();
		await poManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET');
		// added to handle the text render delay
		await page.waitForTimeout(3000);
		const pdfText = await poManager.documentViewer.pdfViewerArea().textContent();
		await expect(pdfText).toContain(reportTxt);

		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(modifyText);
		await page.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			await route.continue();
		});
		await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await poManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET');
		// added to handle the text render delay
		await page.waitForTimeout(3000);
		const pdfText1 = await poManager.documentViewer.pdfViewerArea().textContent();
		await expect(pdfText1).toContain(reportTxt);
		await poManager.documentViewer.previewBtn().click();
		await poManager.documentViewer.signDiagnosticReport();

		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET');
		await expect(await poManager.documentViewer.criticalFindingIcon()).toBeVisible();
		await poManager.documentViewer.markReportAsCritical(true);
		await expect(await poManager.documentViewer.criticalFindingIcon(true)).not.toBeVisible();
		await poManager.documentViewer.deleteReport();
	});

	test('verify report toolbar', async ({ page },testInfo) => {
		const reportTxt = 'Test report save';
		const poManager = new POManager(page,'',testInfo);
		await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
			await route.fulfill({
				status: 200,
				body: [],
			});
		});
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.validateToolbar('blank');
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		await poManager.documentViewer.validateToolbar('preliminary');
		await poManager.documentViewer.signDiagnosticReport();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.documentViewer.validateToolbar('final');
		await poManager.documentViewer.deleteReport();
	});

	test('Compare Reports, multi-report download and delete', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await page.route('**/ReportContent*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
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
		await poManager.documentViewer.uploadDocumentInStudyList(documentName, false);
		await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
		await page.locator('[name="addGrid"]').click();
		//Opening the report list
		await poManager.documentViewer.documentTemplatedrawerExpandBtn().click();
		// Added to handle the drag and drop issue due to the document rendering delay
		await page.waitForTimeout(4000);
		// Use dragAndDrop for better reliability
		const dragElement = poManager.documentViewer.finalCardReportTitle();
		const dropTarget = page.locator('.css-1q354jb');
		await dragElement.dragTo(dropTarget);
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);
		await expect(poManager.documentViewer.pdfViewerArea().nth(1)).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);
		await poManager.documentViewer.multiDownload(finalReportName, documentName);
		await poManager.documentViewer.multiDelete();
	});
});

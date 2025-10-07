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
let reportId = '';

const templateTxt = 'Test report save';
const newTemplateTxt = 'Template text update';
let templateName;
let newFinalReportName;
let documentName;
let finalReportName;
let reportName;
let SDName;
let templateRename;
let UploadedName;

let currentDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
const newDateOptions = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
};
let reportDate = currentDate.toLocaleString('en-US', newDateOptions);
let date = currentDate.toLocaleString('en-US', newDateOptions);
test.describe('DV Rename', () => {
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
		const apiContext = await request.newContext();
		const poManager = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		});
		templateName = `NewTemplate${randomNum}`;
		templateRename = `Rename Template${randomNum}`;
		reportName = `Preliminary ${randomNum}`;
		newFinalReportName = `New Final Report ${randomNum}`;
		SDName = `SD Rename ${randomNum}`;
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		UploadedName = `UploadTemplate ${randomNum}`;
		await poManager.loginPage.loginOmegaAI();
	});

	test('Rename Preliminary report', async ({ page }) => {
		const poManager = new POManager(page);
		const reportTxt = 'Test report save';
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);

		await poManager.documentViewer.diagnosticReportTitleCategoryChange(reportName, 'PR', false, '');
		await poManager.documentViewer.openHomePage();
		await page.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			if (route.request().method() === 'GET') {
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET');
		await poManager.documentViewer.preliminaryReportCardValidation(
			name.toLowerCase(),
			reportName,
			managingOrgName.toLowerCase(),
			reportTxt,
			reportDate
		);
		await poManager.documentViewer.deletePreliminaryReport();
	});

	test('final report Rename', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await page.route('**/ReportContent*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);
		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await expect(page.locator('[id="Final Report"] [id="title"]', { timeout: 20000 }).nth(0)).toContainText(
			finalReportName
		);
		await expect(poManager.documentViewer.pdfViewerArea(page).nth(0)).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);
		await poManager.documentViewer.diagnosticReportTitleCategoryChange(newFinalReportName, 'FR', false, '');
		await expect(poManager.documentViewer.finalCardReportTitle()).toContainText(newFinalReportName);
		await poManager.documentViewer.deleteReport();
	});

	test('SD rename', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await page.route('**/DocumentContent?*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.uploadDocumentInStudyList(documentName, false);
		await poManager.documentViewer.studyCardReportTitle().nth(0).click();
		await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
		await expect(poManager.documentViewer.studyCardReportTitle().nth(0)).toContainText(documentName);
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText(
			'Comparison is made with previous CT scan reported DATE and DATE'
		);
		await page.route('**/DocumentContent?*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.diagnosticReportTitleCategoryChange(SDName, 'SD', false, '');
		await poManager.documentViewer.openHomePage();
		await page.route('**/DocumentContent?*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.documentViewer.studyCardReportTitle().nth(0).click();
		await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
		await expect(poManager.documentViewer.studyCardReportTitle().nth(0)).toContainText(SDName);
		await poManager.documentViewer.deleteStudyDocument();
	});

	// test('Change the Preliminary report category', async ({ page }) => {
	// 	const poManager = new POManager(page);
	// 	const reportTxt = 'Test report save';
	// 	await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
	// 	await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
	// 	await page.route('**/DocumentContent?*', async route => {
	// 		if (route.request().method() === 'GET') {
	// 			await new Promise(resolve => setTimeout(resolve, 1000));
	// 			route.continue();
	// 		} else {
	// 			route.continue();
	// 		}
	// 	});
	// 	await poManager.documentViewer.diagnosticReportTitleCategoryChange(reportName, 'PR', true, '');
	// 	await poManager.apiWaitUtils.waitForAPI('/DocumentContent?', 'GET');
	// 	await expect(poManager.documentViewer.studyCardReportTitle().nth(0)).toContainText(reportName);
	// 	await poManager.documentViewer.deleteStudyDocument();
	// });

	test('Template upload and Rename from template card', async ({ page }) => {
		try {
			const poManager = new POManager(page);
			const apiUtils = new ApiWaitUtils(page);

			console.log('Opening Document Viewer');
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

			console.log('Routing FHIR Organization templates');
			// await page.route('**/template?_count**', route => route.continue());

			console.log('Opening Template Manager');
			await poManager.documentViewer.openTemplateMgr();
			// await apiUtils.waitForAPI('/template?_count', 'GET');

			const originalFilePath = path.resolve(__dirname, '../TestData/Upload.pdf');
			const renamedFilePath = path.resolve(__dirname, `../TestData/${templateName}.pdf`);
			fs.copyFileSync(originalFilePath, renamedFilePath);
			console.log('Copied file to renamed path:', renamedFilePath);

			console.log('Routing TemplateContent API');
			await page.route('**/TemplateContent?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					route.continue();
				} else {
					route.continue();
				}
			});

			console.log('Routing template creation API');

			await page.route('**/template?templateName=**', async route => {
				if (route.request().method() === 'POST') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					route.continue();
				} else {
					route.continue();
				}
			});

			console.log('Uploading file');
			await page.setInputFiles('[id="input-file-upload"]', renamedFilePath);

			console.log('Waiting for API response');
			const responseBody = await apiUtils.waitForAPI('/template?templateName=', 'POST');
			console.log('Response body received template:', JSON.stringify(responseBody, null, 2));

			if (!responseBody || !responseBody[0].id) {
				throw new Error('Response body is undefined or does not contain an id.');
			}

			const reportId = responseBody[0].id;
			console.log('Report ID:', reportId);

			await apiUtils.waitForAPI('/TemplateContent?', 'GET');
			await page.waitForTimeout(3000);

			console.log('Verifying uploaded template content');
			const editorContent = await page.locator('#TipTapProseMirrorEditorMain .ProseMirror').textContent();
			expect(editorContent).toContain('Comparison is made with previous CT scan reported DATE and DATE');

			console.log('Verifying template card');
			await poManager.documentViewer.verifyTemplateCard(
				reportId,
				templateTxt,
				templateName,
				managingOrgName,
				false,
				name,
				date,
				true
			);
			await poManager.documentViewer.diagnosticReportTitleCategoryChange(templateRename, 'T', false, reportId);
			await poManager.documentViewer.verifyTemplateCard(
				reportId,
				templateTxt,
				templateRename,
				managingOrgName,
				false,
				name,
				date,
				true
			);

			console.log('Deleting template');
			await poManager.documentViewer.deleteTemplate(reportId);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});
});

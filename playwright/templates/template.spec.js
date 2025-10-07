const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const fs1 = require('fs').promises;
const path = require('path');
let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';
let reportId = '';
let newReportId = '';
let browser;
let page;
const bookmarksList = [
	'Patient Name',
	'Patient ID',
	'Accession #',
	'Gender',
	'Age at Study',
	'Date of Birth',
	'Body Part',
	'Modality',
	'Patient Email',
];

const templateTxt = 'Normal CT abdomen/pelvis.';
const newTemplateTxt = 'Template text update';
const modifyText = 'Modify report content';
const headerText = 'Header Text';
const footerText = 'Footer Text';
let templateName;
let newTemplateName;
let publishAsNewTemplateName;
let patientName;

const date = new Date().toDateString();
const reportDate = new Date().toLocaleDateString('es-AR');
test.describe.serial('Templates', async () => {
	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		browser = await chromium.launch({ channel: 'chrome' });
		page = await browser.newPage();
		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		});
		templateName = `NewTemplate${randomNum}`;
		newTemplateName = `Rename Template${randomNum}`;
		publishAsNewTemplateName = `Publish as a Template${randomNum}`;
		await api.getUserDetails().then(result => {
			// console.log(result)
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		const poManager = new POManager(page);

		await poManager.loginPage.loginOmegaAI();
	});

	test('Add Template', async () => {
		try {
			const poManager = new POManager(page);
			const reportTxt = 'Test report save';
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

			await poManager.documentViewer.addTemplateForNewEditor(
				templateTxt,
				headerText,
				footerText,
				managingOrgName,
				name,
				templateName,
				false,
				'',
				false,
				studyInfo.patientGender,
				bookmarksList
			);
			await page.route('**/fhir/Organization/template/*/TemplateContent?_dc=*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			const responseBody = await poManager.apiWaitUtils.waitForAPI('/template?_dc', 'POST');
			const object1 = JSON.parse(responseBody[0].template);
			expect(object1).toHaveProperty('templateURL');
			expect(object1).not.toHaveProperty('htmlData');
			reportId = responseBody[0].id;
			patientName = studyInfo.patientName;
			await poManager.apiWaitUtils.waitForAPI('TemplateContent?_dc=', 'GET');
			await poManager.documentViewer.verifyTemplateCard(
				responseBody[0].id,
				templateTxt,
				templateName,
				managingOrgName,
				false,
				name,
				date
			);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Template Search', async () => {
		try {
			const poManager = new POManager(page);
			await poManager.documentViewer.searchTemplateIcon().click();
			await poManager.documentViewer.templateSearch(templateName);
			await poManager.documentViewer.verifyTemplateCard(
				reportId,
				templateTxt,
				templateName,
				managingOrgName,
				false,
				name,
				date,
				bookmarksList
			);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Edit Template', async () => {
		try {
			const poManager = new POManager(page);
			await page.route(`**/fhir/Organization/template/${reportId}/TemplateContent?_dc=`, async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await poManager.documentViewer.addTemplateForNewEditor(
				newTemplateTxt,
				headerText,
				footerText,
				managingOrgName,
				name,
				newTemplateName,
				true,
				reportId,
				false,
				studyInfo.patientGender,
				bookmarksList
			);

			await poManager.apiWaitUtils.waitForAPI(`/fhir/organization/template/${reportId}`, 'PUT');
			await poManager.apiWaitUtils.waitForAPI(
				`/fhir/Organization/template/${reportId}/TemplateContent?_dc=`,
				'GET'
			);

			await poManager.documentViewer.verifyTemplateCard(
				reportId,
				newTemplateTxt,
				newTemplateName,
				managingOrgName,
				true,
				name,
				date
			);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Publish as new template', async () => {
		try {
			const poManager = new POManager(page);
			await poManager.documentViewer.addTemplateForNewEditor(
				templateTxt,
				headerText,
				footerText,
				managingOrgName,
				name,
				publishAsNewTemplateName,
				true,
				reportId,
				true,
				studyInfo.patientGender,
				bookmarksList
			);
			const responseBody = await poManager.apiWaitUtils.waitForAPI('/template?_dc', 'POST');
			newReportId = responseBody[0].id;
			await poManager.apiWaitUtils.waitForAPI(
				`/fhir/Organization/template/${newReportId}/TemplateContent?_dc=`,
				'GET'
			);

			await poManager.documentViewer.verifyTemplateCard(
				responseBody[0].id,
				templateTxt,
				publishAsNewTemplateName,
				managingOrgName,
				false,
				name,
				date,
				bookmarksList
			);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Verify the template in embedded DV opening from image viewer with BMT', async () => {
		const poManager = new POManager(page);
		// opening home page
		await poManager.homePage.homePageBtn().click();
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true);
		await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
			await route.continue();
		});
		// Click on the split button to open the embedded report
		await page.getByTestId('ImageViewerSplitButton').getByRole('button').click();
		await poManager.apiWaitUtils.waitForAPI('/bestmatchtemplate/Content?_count=1&criteria=', 'GET');
		await page.waitForTimeout(3000);
		// Verify the template in embedded report
		await expect(poManager.documentViewer.newReportEditorTextArea()).toBeVisible();
		await expect(poManager.documentViewer.newReportEditorTextArea()).toContainText(templateTxt);
	});

	test('Load Template', async ({}, testInfo) => {
		try {
			const poManager = new POManager(page, '', testInfo);
			await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 3000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await page.route('**/fhir/DiagnosticReport?_count=50&page=1&_dc*', async route => {
				await route.continue();
			});
			
			await poManager.homePage.homePageBtn().click();
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
			const responseBody = await poManager.apiWaitUtils.waitForAPI(
				'/bestmatchtemplate/Content?_count=1&criteria=',
				'GET'
			);
			await page.waitForTimeout(5000);
			// There are no matching templates then test will be failed
			if (!responseBody) {
				throw new Error('Response body is empty');
			} else {
				console.log('Response body for BMT:', responseBody);
			}
			await poManager.documentViewer.newReportEditorTextArea().pressSequentially(`${modifyText}`);
			await poManager.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport?_count=50&page=1&_dc', 'POST');
			await poManager.documentViewer.deletePreliminaryReport();
			await poManager.documentViewer.loadTemplateinEditor(
				reportId,
				templateTxt,
				headerText,
				footerText,
				bookmarksList
			);
			const headerImgPath = path.join(__dirname, '../../screenshots-testdata/headerTemplate.png');
			const footerImgPath = path.join(__dirname, '../../screenshots-testdata/footerTemplate.png');
			const templateLoadImgPath = path.join(__dirname, '../../screenshots-testdata/templateLoad.png');

			await page.route('**/fhir/DiagnosticReport/*/save', async route => {
				await route.continue();
			});

			await poManager.documentViewer.headerTextArea().scrollIntoViewIfNeeded();
			// const response2 = await poManager.aiUtils.compareImages(page.locator('[id="editor-wrapper"]'), templateLoadImgPath,'TemplateLoadChecCheck','Ignore the patient-specific details');
			const response = await poManager.aiUtils.compareImages(
				poManager.documentViewer.headerTextArea(),
				headerImgPath,
				'TemplateHeaderCheck',
				'Ignore the patient-specific details'
			);
			const response1 = await poManager.aiUtils.compareImages(
				poManager.documentViewer.footerTextArea(),
				footerImgPath,
				'TemplateFooterCheck',
				'Ignore the patient-specific details'
			);
			console.log('Template Load comparison result:', response);
			console.log('Template Load comparison result:', response1);
			// console.log('Template Load comparison result:', response2);

			await expect(response.hasDifferences).toBe(false, 'Header image does not match the expected image.');
			await expect(response1.hasDifferences).toBe(false, 'Footer image does not match the expected image.');
			// await expect(response2.hasDifferences).toBe(false, 'Template Load image does not match the expected image.');
			await poManager.documentViewer.newReportEditorTextArea().click();
			await page.keyboard.down('Control');
			await page.keyboard.press('End');
			await page.keyboard.up('Control');
			await page.waitForTimeout(3000);
			await page.keyboard.press('Enter');
			await page.keyboard.press('Enter');
			await Promise.all([
				poManager.apiWaitUtils.waitForAPI('/save', 'PUT'),
				poManager.documentViewer.newReportEditorTextArea().pressSequentially(`${modifyText}`),
			]);
			await poManager.documentViewer.signDiagnosticReport();
			await page.route('**/DiagnosticReport/*/ReportContent?*', async route => {
				if (route.request().method() === 'GET') {
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await page.route('**/DiagnosticReport?_count=50&page=1**', async route => {
				if (route.request().method() === 'GET') {
					await route.continue();
				} else {
					await route.continue();
				}
			});

			const [, diagnosticReportList] = await Promise.all([
				poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true),
				poManager.apiWaitUtils.waitForAPI('DiagnosticReport?_count=50&page=1', 'GET'),
				poManager.apiWaitUtils.waitForAPI('ReportContent', 'GET'),
			]);

			// Intial Cursor Position bookmark is only added to place the cursor in report not to send in conclusion
			await expect(diagnosticReportList.entry[0].resource.conclusion).not.toContain('Initial Cursor Position');

			await page.waitForTimeout(10000);
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(templateTxt, { timeout: 20000 });
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(headerText, { timeout: 20000 });
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(modifyText, { timeout: 20000 });
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(footerText, { timeout: 20000 });
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(studyInfo.patientName, {
				timeout: 20000,
			});
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(studyInfo.patientGender, {
				timeout: 20000,
			});
			await expect(poManager.documentViewer.pdfViewerArea()).toContainText(studyInfo.accessionNum, {
				timeout: 20000,
			});
			await poManager.documentViewer.deleteReport();
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Delete Template', async ({}) => {
		try {
			const poManager = new POManager(page);
			await poManager.documentViewer.openTemplateMgr();
			await poManager.documentViewer.deleteMultipleTemplates([reportId, newReportId]);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});
});

const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const fs1 = require('fs').promises;
const path = require('path');

test.describe.serial('Document Viewer Picklist', () => {
	let studyInfo = {};
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let name = '';
	let newReportId = '';
	let page;
	let poManager;
	const templateTxt = 'Test report save';
	const modifyText = 'Modify report content';
	let customFieldName;
	let pickListNameTemplate;
	let pickListName;
	const options = ['Option default', 'Options 2', 'Options 3', 'Options 4'];
	const optionsUpdate = ['OptionUpdate default', 'OptionUpdate 2', 'OptionUpdate 3', 'OptionUpdate 4'];

	const date = new Date().toDateString();

	test.beforeAll(async ({ browser }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		page = await browser.newPage();
		poManager = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111,
			max: 9999,
		});
		pickListNameTemplate = `pickListNameTemplate ${randomNum}`;
		pickListName = `Pick List ${randomNum}`;
		customFieldName = `CustomField ${randomNum}`;
		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
		await api.getUserDetails().then(result => {
			const userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		await poManager.loginPage.loginOmegaAI();
	});

	test('AddPicklist and custom field', async () => {
		// Setup request interception
		await page.route('**/fhir/organization/*/template?*', async route => {
			await route.continue();
		});

		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);
		await page.route('**/fhir/StudyStatus?_count=50&criteria=organization*', async route => {
			await route.continue();
		});

		await poManager.documentViewer.openTemplateMgr();
		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(templateTxt);
		await poManager.documentViewer.addEditPickList(pickListName, false, options);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.addCustomField(customFieldName, false);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.verifyPL(pickListName, false);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.verifyPL(customFieldName, true);
		await poManager.documentViewer.dragAndDropBookmarkToTiptapEditor(pickListName);
		await poManager.documentViewer.dragAndDropBookmarkToTiptapEditor(customFieldName);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(`${templateTxt}`);
		await page.keyboard.press('Enter');
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.dragAndDropBookmarkToTiptapEditor('Initial Cursor Position');
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.openTemplateDrawerBtn().click();
		await poManager.documentViewer.fillPublishDrawerNPublish(
			pickListNameTemplate,
			false,
			false,
			studyInfo.patientGender,
			true
		);

		const responseBody = await poManager.apiWaitUtils.waitForAPI('/template?_dc', 'POST');
		newReportId = responseBody[0].id;
		await poManager.documentViewer.verifyTemplateCard(
			newReportId,
			templateTxt,
			pickListNameTemplate,
			managingOrgName,
			false,
			name,
			date
		);
	});

	test('Load Template with Picklist and custom field', async () => {
		await page.locator('[data-testid="ArrowBackIcon"]').click();

		await page.route('**/fhir/DiagnosticReport?*', async route => {
			await route.continue();
		});

		await poManager.documentViewer.templateLoad(newReportId);
		await poManager.apiWaitUtils.waitForAPI('/DiagnosticReport?', 'POST');

		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});

		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(modifyText);
		await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await poManager.documentViewer.signDiagnosticReport();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);

		await page.route('**/DiagnosticReport/**/ReportContent?*', async route => {
			await route.continue();
		});

		await expect(poManager.documentViewer.pdfViewerArea()).toContainText(options[0]);
		await poManager.documentViewer.deleteReport();
	});

	test('update picklist and add text to customField', async () => {
		await poManager.documentViewer.openTemplateMgr();

		await page.route(`**/fhir/Organization/template/${newReportId}*`, async route => {
			await route.continue();
		});

		await poManager.documentViewer.templateCard(newReportId).click();
		await poManager.documentViewer.templateEditBtn().click();
		await page.waitForTimeout(4000);
		await poManager.documentViewer.addEditPickList(pickListName, true, optionsUpdate);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.openTemplateDrawerBtn().click();
		await poManager.documentViewer.backBtnforTemplatemanagerDV().click();

		await page.route('**/fhir/DiagnosticReport?*', async route => {
			await route.continue();
		});

		await poManager.documentViewer.templateLoad(newReportId);
		await poManager.apiWaitUtils.waitForAPI('/DiagnosticReport?', 'POST');
		await page.waitForTimeout(6000);
		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});

		await poManager.documentViewer.draggedPickListBookmark(pickListName).click();
		// await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await poManager.documentViewer.pickListInEditor().waitFor({ state: 'visible' });
		await expect(poManager.documentViewer.pickListInEditor()).toContainText(optionsUpdate[0]);
		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await page.locator('[id="PicklistItems3"]').click();
		await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await expect(poManager.documentViewer.pickListInEditor()).toContainText(optionsUpdate[3]);

		await poManager.documentViewer.customFieldTxtField(customFieldName).click();
		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await poManager.documentViewer.customFieldTxtField(customFieldName).fill('   Custom field text typing');
		await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await page.keyboard.down('Control');
		await page.keyboard.press('End');
		await page.keyboard.up('Control');
		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(modifyText);
		await page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
		await poManager.documentViewer.signDiagnosticReport();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName,true);

		await page.route('**/DiagnosticReport/**/ReportContent?*', async route => {
			await route.continue();
		});

		await expect(poManager.documentViewer.pdfViewerArea()).toContainText(optionsUpdate[3]);
		await expect(poManager.documentViewer.pdfViewerArea()).toContainText('Custom field text typing');
		await poManager.documentViewer.deleteReport();
	});

	test('Delete Template and picklist', async () => {
		await poManager.documentViewer.openTemplateMgr();
		await poManager.documentViewer.deleteTemplate(newReportId);
		await page.waitForTimeout(5000);
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.pickListSettingBtn().click();
		await poManager.documentViewer.deletePickLists();
		await poManager.documentViewer.bookmarkOpenCollapseBtn().click();
		await poManager.documentViewer.deleteCustomfield();
	});
});

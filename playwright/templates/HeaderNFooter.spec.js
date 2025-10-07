const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');

test.describe.serial('Document Viewer Header & Footer and page margins', async () => {
	let studyInfo = {};
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let name = '';
	let reportId = '';

	const templateTxt = 'Test report save';
	const modifyText = 'Modify report content';
	const headerText = 'Header Text';
	const footerText = 'Footer Text';
	let templateName;
	let browser;
	let page;
	let userdetails;
	const margins = {
		headerMargin: '4',
		footerMargin: '4',
		pageTopMargin: '8',
		pageBottomMargin: '8',
		pageLeftMargin: '6',
		pageRightMargin: '6',
	};

	const date = new Date().toDateString();
	const reportDate = new Date().toLocaleDateString('es-AR');

	test.beforeAll(async () => {
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
		await api.getUserDetails().then(result => {
			// console.log(result)
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		const poManager = new POManager(page);

		await poManager.loginPage.loginOmegaAI();
	});

	test('add HeaderFooter and page Margins', async () => {
		try {
			const poManager = new POManager(page);
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);

			await poManager.documentViewer.addTemplateWithHFMargin(
				templateTxt,
				headerText,
				footerText,
				managingOrgName,
				name,
				templateName,
				false,
				'',
				false,
				margins
			);

			await page.route('**/fhir/Organization/template/*/TemplateContent?_dc=*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 3000));
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
			await poManager.apiWaitUtils.waitForAPI('TemplateContent?_dc=', 'GET');
			await page.route(`**/fhir/organization/template/*`, async route => {
				if (route.request().method() === 'PUT') {
					await new Promise(resolve => setTimeout(resolve, 6000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await poManager.documentViewer.addTemplateWithHFMargin(
				templateTxt,
				headerText,
				footerText,
				managingOrgName,
				name,
				templateName,
				true,
				responseBody[0].id,
				false,
				margins
			);
			// await Promise.all([
			await poManager.apiWaitUtils.waitForAPI(`/fhir/organization/template/`, 'PUT');
			// ]);

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

	test('load Template with header & footer and page margins', async () => {
		try {
			const poManager = new POManager(page);
			await page.locator('[data-testid="ArrowBackIcon"]').click();

			await poManager.documentViewer.loadTemplateinEditor(reportId, templateTxt, headerText, footerText);
			await page.route('**/fhir/DiagnosticReport/*/save', async route => {
				await route.continue();
			});
			await poManager.documentViewer.newReportEditorTextArea().type(`${modifyText}`);
			await poManager.apiWaitUtils.waitForAPI('/save', 'PUT');
			const headerSection = await poManager.documentViewer.headerSection();
			const footerSection = await poManager.documentViewer.footerSection();
			const editorSection = await poManager.documentViewer.newReportEditorSection();
			await expect(headerSection).toHaveCSS('padding-top', (37.7953 * margins.headerMargin).toFixed(3) + 'px');
			await expect(footerSection).toHaveCSS('padding-bottom', (37.7953 * margins.footerMargin).toFixed(3) + 'px');
			// await expect(editorSection).toHaveCSS('margin-top', (37.7953 * margins.pageTopMargin).toFixed(3) + 'px');
			await expect(editorSection).toHaveCSS(
				'padding-right',
				(37.7953 * margins.pageRightMargin).toFixed(3) + 'px'
			);
			// await expect(editorSection).toHaveCSS(
			// 	'margin-bottom',
			// 	(37.7953 * margins.pageBottomMargin).toFixed(3) + 'px'
			// );
			await expect(editorSection).toHaveCSS('padding-left', (37.7953 * margins.pageLeftMargin).toFixed(3) + 'px');
			await expect(editorSection).toHaveCSS('font-style', 'normal');
			await poManager.documentViewer.deletePreliminaryReport();
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});

	test('Delete Header and footer from template', async () => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openTemplateMgr();
		await poManager.documentViewer.addTemplateWithHFMargin(
			templateTxt,
			headerText,
			footerText,
			managingOrgName,
			name,
			templateName,
			true,
			reportId,
			true,
			margins
		);
		await page.locator('[data-testid="ArrowBackIcon"]').click();
		await poManager.documentViewer.page.route('**/fhir/DiagnosticReport?_count=50&page=1&_dc*', async route =>
			route.continue()
		);
		await poManager.documentViewer.templateLoad(reportId);
		await poManager.documentViewer.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport?_count=50&page=1&_dc', 'POST');
		await expect(poManager.documentViewer.newReportEditorTextArea()).toContainText(templateTxt);
		await poManager.documentViewer.deletePreliminaryReport();
	});

	test('Delete Template', async () => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openTemplateMgr();
		await poManager.documentViewer.deleteTemplate(reportId);
	});
});

const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');

test.describe.serial('Organization header and footer', async () => {
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
		browser = await chromium.launch();
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
		//deleting the header and footer for org
		await api.deleteOrgHeaderNFooter().then(result => {
			console.log('org HF delete' + result);
		});
		const poManager = new POManager(page);

		await poManager.loginPage.loginOmegaAI();
	});

	test('add org Header and Footer', async () => {
		try {
			const poManager = new POManager(page);
			await page.route('**/fhir/Patient/**', route => route.continue());
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
			await poManager.apiWaitUtils.waitForAPI('//fhir/Patient/', 'GET');
			await poManager.documentViewer.addRemoveHeaderFooter(headerText, footerText, false, margins);
			await expect(await poManager.documentViewer.headerTextArea()).toContainText(headerText);
			await expect(await poManager.documentViewer.headerTextArea()).toContainText(studyInfo.patientId);
			await expect(await poManager.documentViewer.footerTextArea()).toContainText(footerText);
			await expect(await poManager.documentViewer.footerTextArea()).toContainText(studyInfo.patientName);
		} catch (error) {
			console.error('An error occurred:', error);
			throw error;
		}
	});
});

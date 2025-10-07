const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const fs1 = require('fs').promises;
const path = require('path');
let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';
let browser;
let page;
let reportId;
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
const headerText = 'Header Text';
const footerText = 'Footer Text';
let templateName;
test.describe.serial('Templates', async () => {
	test.beforeAll(async ({}) => {
		test.setTimeout(480000);
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
		reportId = responseBody[0].id;
		await poManager.apiWaitUtils.waitForAPI('TemplateContent?_dc=', 'GET');
	});

	test('Check Report save without User interaction', async ({}) => {
		test.setTimeout(480000);
		try {
			const poManager = new POManager(page);
			await poManager.documentViewer.openHomePage();
			await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true);

			// Enable request interception
			let intercepted = false; // Track if the specific request occurs
			await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
				await route.continue();
			});
			await page.route('**/*', async route => {
				const request1 = route.request();

				// Check if the request matches your condition
				if (request1.url().includes('/fhir/DiagnosticReport?') && request1.method() === 'POST') {
					intercepted = true;
					console.error(`Request to ${request1.url()} occurred, failing the test`);
					// Continue to avoid blocking the route for other tests
					await route.continue();
				} else {
					await route.continue();
				}
			});
			// Opening Embedded DV
			await Promise.all([
				page.getByTestId('ImageViewerSplitButton').getByRole('button').click(),
				poManager.apiWaitUtils.waitForAPI('/bestmatchtemplate/Content?_count=1&criteria=', 'GET'),
			]);

			// Wait for a specific timeout or until the action completes
			await page.waitForTimeout(60000); // Wait up to 60 seconds for the request to potentially occur

			// Check if the request was intercepted
			if (intercepted) {
				throw new Error('The unwanted report save request was intercepted, test failed.');
			}
		} catch (error) {
			console.error('An error occurred:', error.message);
			throw error; // Re-throw the error to fail the test
		}
	});
});

const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';
let documentName;
let finalReportName;

test.describe('DV unwanted report save', () => {
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
	test.beforeEach('login', async ({ page }) => {
		const poManager = new POManager(page);
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		});
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		await poManager.loginPage.loginOmegaAI();
	});

	test('Preliminary report unwanted report save', async ({ page }) => {
		try {
			const poManager = new POManager(page);
			// const reportTxt = 'Test report save';
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
			await poManager.documentViewer.addReportTxtToEditorFromFile();
			await page.route('**/fhir/DiagnosticReport?*', async route => {
				if (route.request().method() === 'POST') {
					postData = JSON.parse(route.request().postData());
					console.log('Request Payload:', postData);
				}
				await route.continue();
			});
			// Enable request interception
			let intercepted = false; // Track if the specific request occurs

			await poManager.documentViewer.openHomePage();
			await page.route('**/*', route => {
				const request1 = route.request();

				// Check if the request matches your condition
				if (request1.url().includes('/save') && request1.method() === 'PUT') {
					intercepted = true;
					console.error(`Request to ${request1.url()} occurred, failing the test`);
					// Continue to avoid blocking the route for other tests
					route.continue();
				} else {
					route.continue();
				}
			});
			await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
			await page.waitForTimeout(60000); // Wait up to 60 seconds for the request to potentially occur

			// Check if the request was intercepted
			if (intercepted) {
				throw new Error('The unwanted report PUT request was intercepted, test failed.');
			}
			await poManager.documentViewer.deletePreliminaryReport();
		} catch (error) {
			console.error('An error occurred:', error.message);
			throw error; // Re-throw the error to fail the test
		}
	});
});

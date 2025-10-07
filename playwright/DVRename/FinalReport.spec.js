
const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { login } = require('../POM/login')
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName
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


let currentDate = new Date(Date.now())
const newDateOptions = {
	year: "numeric",
	month: "numeric",
	day: "numeric"
}
let reportDate = currentDate.toLocaleString("en-US", newDateOptions);
let date = currentDate.toLocaleString("en-US", newDateOptions);
test.describe('toolbar check', () => {

	test.beforeAll(async ({ }) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result)
			studyInfo = result;
		})

		await api.getUserDetails().then(result => {
			// console.log(result)
			userdetails = result;
			console.log(userdetails.name[0].text)
			name = userdetails.name[0].text

		})
	})
	test.beforeEach('login', async ({ page }) => {
		const apiContext = await request.newContext();
		const poManager = new POManager(page)
		const randomNum = faker.datatype.number({
			min: 1111111111,
			max: 9999999999,
		})
		templateName = `NewTemplate${randomNum}`;
		templateRename = `Rename Template${randomNum}`;
		reportName = `Preliminary ${randomNum}`;
		newFinalReportName = `New Final Report ${randomNum}`;
		SDName = `SD Rename ${randomNum}`;
		documentName = `Upload document ${randomNum}`;
		finalReportName = `Final Report ${randomNum}`;
		UploadedName = `UploadTemplate ${randomNum}`;
		await poManager.loginPage.loginOmegaAI()
	})

	test('final report PDF toolbar check and AI summary', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await page.route('**/ReportContent*', async (route) => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);
		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await expect(page.locator('[id="Final Report"] [id="title"]', { timeout: 20000 }).nth(0)).toContainText(finalReportName);
		await expect(poManager.documentViewer.pdfViewerArea().nth(0)).toContainText('Comparison is made with previous CT scan reported DATE and DATE');
		await page.locator('[data-testid="open-btn"]').click({ force: true })
		await page.getByTestId('hide-thumbnail-icon').click();
		await expect(page.getByTestId('thumbnail__list')).toBeVisible();
		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('download-icon').click();
		const download = await downloadPromise;
		const downloadPath = path.join(__dirname, 'downloads', await download.suggestedFilename());
		await download.saveAs(downloadPath);
		console.log('First file downloaded:', downloadPath);
		const filename1 = await download.suggestedFilename();
		await expect(filename1).toContain(finalReportName);
		await page.locator('[aria-label="Print"]').isEnabled()
		// Get the bounding box before zooming out
		const initialBoundingBox = await poManager.documentViewer.pdfViewerArea().boundingBox();
		console.log('Initial bounding box:', initialBoundingBox);

		// Perform the zoom out action
		await page.getByTestId('zoom-out-icon').click();

		// Get the bounding box after zooming out
		const afterZoomOutBoundingBox = await poManager.documentViewer.pdfViewerAreaZoomCheck().boundingBox();
		console.log('Bounding box after zoom out:', afterZoomOutBoundingBox);

		// Perform the zoom in action
		await page.getByTestId('zoom-in-icon').click();
		await page.waitForTimeout(3000)
		await page.getByTestId('zoom-in-icon').click();

		// Get the bounding box after zooming in
		const afterZoomInBoundingBox = await poManager.documentViewer.pdfViewerAreaZoomCheck().boundingBox();
		console.log('Bounding box after zoom in:', afterZoomInBoundingBox);
		expect(initialBoundingBox.height > afterZoomOutBoundingBox.height).toBeTruthy();
		expect(afterZoomOutBoundingBox.height < afterZoomInBoundingBox.height).toBeTruthy();
		expect(initialBoundingBox.width > afterZoomOutBoundingBox.width).toBeTruthy();
		expect(afterZoomOutBoundingBox.width < afterZoomInBoundingBox.width).toBeTruthy();

		const page1Promise = page.waitForEvent('popup');
		// Opening the report in new window
		await page.locator('.css-pvqsmv [aria-label="Open in a new window"]').click();
		const page1 = await page1Promise;
		const poManager1 = new POManager(page1);
		await page1.route('**/ReportContent*', async (route) => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 3000));
				route.continue();
			} else {
				route.continue();
			}
		});
		await poManager1.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await page1.locator('[data-testid="navigator-wrapper"]').click();
		await expect(page1.locator('[id="Final Report"] [id="title"]', { timeout: 20000 }).nth(0)).toContainText(finalReportName);
		await expect(poManager1.documentViewer.pdfViewerArea().nth(0)).toContainText('Comparison is made with previous CT scan reported DATE and DATE');
		await page1.close();
		await page.route('**fhir/DiagnosticReport/AiSummary?language=English*', async (route) => {
			route.continue();
		});
		await page.getByTestId('ai-summary-btn').click();
		// Wait for the API response
		const response = await page.waitForResponse(response =>
			response.url().includes('DiagnosticReport/AiSummary?language=English') && response.status() === 200
		);

		// Get the response as text
		const responseBody = await response.text();
		await expect(page.locator('[id="panel1a-content"]')).toBeVisible();

		await expect(page.locator('[id="panel1a-content"]')).toContainText('The AI technology serves as an analytical aid, the ultimate responsibility for patient diagnosis and care lies with licensed healthcare providers who must interpret and validate any AI-generated reports ');
		await page.locator('[id="panel1a-header"]').click();
		expect(await page.getByTestId('ai-summary-btn')).toBeVisible();
		await poManager.documentViewer.deleteReport();
	});
});
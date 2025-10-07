const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const { apiWaitUtils } = require('../POM/apiWaitUtils');
const { documentViewer } = require('../POM/documentViewer');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');

let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let name = '';
const modifyText = 'Modified text';

test.describe('DV font Toolbar', () => {
	test.beforeAll(async () => {
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
		await poManager.loginPage.loginOmegaAI();
	});

	test('Font toolbar Check', async ({ page }) => {
		const poManager = new POManager(page);
		await page.route('**/bestmatchtemplate/Content?_count=1&criteria=*', async route => {
			await route.fulfill({
				status: 200,
				body: [],
			});
		});
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, false);
		await poManager.documentViewer.addDiagnosticReportForNewEditor('Test report save', false);
		await poManager.documentViewer.newReportEditorTextArea().clear();
		await poManager.documentViewer.newReportEditorTextArea().pressSequentially(modifyText);

		await page.waitForTimeout(5000); // Wait for changes to apply

		// Check if the modified text is present
		const elementLocator = await poManager.documentViewer
			.newReportEditorTextArea()
			.locator(`:has-text('${modifyText}')`);
		const elementCount = await elementLocator.count();
		console.log('Number of element with modified test:', elementCount);

		if (elementCount === 1) {
			await expect(elementLocator).toHaveCSS('color', 'rgb(0, 0, 0)');
			await expect(elementLocator).toHaveCSS('font-family', 'Arial, sans-serif');
			await expect(elementLocator).toHaveCSS('font-size', '14px');
			await expect(elementLocator).toHaveCSS('font-weight', '400');
			await expect(elementLocator).toHaveCSS('text-decoration', 'none solid rgb(0, 0, 0)');
			await expect(elementLocator).toHaveCSS('text-align', 'start');
			await expect(elementLocator).toHaveCSS('font-style', 'normal');
		} else {
			console.error('Unexpected number of elements found:', elementCount);
		}

		// Simulate the actions to change the text properties
		await poManager.documentViewer.newReportEditorTextArea().press('Control+a');
		await page.waitForTimeout(1000);

		// The "bubble-menu" is not visible as the toolbar is docked above the DV. The below line is not required.
		// await poManager.documentViewer.fontToolbarHeaderOption().hover();
		await page.getByTestId('select-heading').click();

		// Apply font changes
		await page.getByRole('button', { name: 'H1' }).click();
		await page.waitForTimeout(3000);

		// Ensure the font-family selector is visible and enabled before clicking
		await page.waitForSelector('[data-testid="font-family-selector"]', { state: 'visible' });
		await page.getByTestId('font-family-selector').hover();
		await page.getByTestId('font-family-selector').click({ force: true });
		await page.getByRole('button', { name: 'Times New Roman' }).click();

		await page.waitForTimeout(3000);

		await page.getByTestId('font-size-selector').hover();
		await page.getByTestId('font-size-selector').click({ force: true });
		await page.locator('[data-popper-placement="bottom-start"]').getByRole('button', { name: '24' }).click();

		await page.getByLabel('Bold').click();
		await page.getByLabel('Italics').click();
		await page.getByLabel('Underline').click();
		await page.getByLabel('Strikethrough').click();
		// To show the color picker
		await page.getByLabel('Font Color').click();

		// Click again to dismiss the color picker
		await page.getByLabel('Font Color').click();
		await page.getByTestId('button-align').click();
		await page.getByTestId('button-right-align').click();
		await poManager.documentViewer.openHomePage();
		await page.route('**/ReportContent*', async route => {
			route.continue();
		});

		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);

		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		const elementLocator2 = await poManager.documentViewer
			.newReportEditorTextArea()
			.locator(`s:has-text('${modifyText}')`);
		// Verify the modified text properties
		await expect(elementLocator2).toHaveCSS('font-family', '"Times New Roman", serif');
		await expect(elementLocator2).toHaveCSS('font-size', '24px');
		await expect(elementLocator2).toHaveCSS('font-weight', '900');
		await expect(elementLocator2).toHaveCSS('text-decoration', 'line-through solid rgb(0, 0, 0)');
		await expect(elementLocator2).toHaveCSS('text-align', 'right');
		await expect(elementLocator2).toHaveCSS('font-style', 'italic');
		await poManager.documentViewer.deletePreliminaryReport();
	});
});

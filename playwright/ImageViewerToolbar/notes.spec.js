const { test, expect, request, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC1 } = require('../POM/timeouts');

test.describe.serial('ImageViewer Notes', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	const textNote1 = 'Add text note 1';
	const textNote2 = 'Add text note 2';
	let page;
	let browser;

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		browser = await chromium.launch({ channel: 'chrome' });
		page = await browser.newPage();
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		console.log('Importing studies');

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testNavigateButtons/966.dcm')
		);

		await api.importDICOM(filePath, studyInfo.studyId);
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await page.route('**/Patient/**', async route => route.continue());
		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await poManager.apiWaitUtils.waitForAPI('/Patient/', 'GET');
	});

	test('Verify Add and Discard Text Note', async ({}) => {
		const poManager = new POManager(page);
		// Open the dictations and notes panel (force click if necessary)
		await poManager.imageViewer.dictationsAndNotesBtn().click({ force: true });

		// Type the first text note and press Enter (using "\n" to simulate Enter)
		await poManager.imageViewer.notesInputField().pressSequentially(`${textNote1}\n`);

		// Verify that the note list displays the first text note
		await expect(poManager.imageViewer.voiceAndNoteList().getByText(textNote1)).toBeVisible();

		// Type the second text note (without pressing Enter)
		await poManager.imageViewer.notesInputField().pressSequentially(textNote2);

		// Click the discard note button
		await poManager.imageViewer.discardNoteBtn().click();

		// Verify that the note list does not contain the second text note
		await expect(poManager.imageViewer.voiceAndNoteList().locator(`text=${textNote2}`)).toHaveCount(0);
	});

	test('Verify Delete Text Note', async ({}) => {
		const poManager = new POManager(page);
		// Type the second text note and press Enter
		await poManager.imageViewer.notesInputField().pressSequentially(`${textNote2}\n`);
		await page.waitForTimeout(5000);

		// Verify that the note list shows the second text note
		await expect(poManager.imageViewer.voiceAndNoteList().getByText(textNote2)).toBeVisible();

		// Delete the second text note by clicking its delete button (simulate mousedown with force)
		await poManager.imageViewer.deleteNoteBtn(textNote2).first().hover();
		await poManager.imageViewer.deleteNoteBtn(textNote2).first().dispatchEvent('mousedown');

		// Wait for the deletion to process (simulate cy.wait(3000))
		await page.waitForTimeout(3000);

		// Verify that the note list no longer shows the second text note
		await expect(poManager.imageViewer.voiceAndNoteList().locator(`text=${textNote2}`)).toHaveCount(0);

		// Delete the first text note similarly
		await poManager.imageViewer.deleteNoteBtn(textNote1).click({ force: true });
		await page.waitForTimeout(3000);

		// Delete the first text note similarly
		await poManager.imageViewer.deleteNoteBtn(textNote1).hover();
		await poManager.imageViewer.deleteNoteBtn(textNote1).dispatchEvent('mousedown');

		// Wait for the deletion to process
		await page.waitForTimeout(3000);
	});
});

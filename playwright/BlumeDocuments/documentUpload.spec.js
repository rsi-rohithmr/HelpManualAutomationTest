const { test, expect, chromium, request } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { POManager } = require('../POM/POManager');
const { TIMEOUT_IN_MSEC3, TIMEOUT_IN_MSEC1 } = require('../POM/timeouts');
const fs = require('fs');
const path = require('path');

let pom;
let api = '';

const viewports = [
	{ name: 'Desktop', viewport: { width: 1920, height: 1080 } },
	{ name: 'Tablet', viewport: { width: 768, height: 1024 } },
	{ name: 'Mobile', viewport: { width: 375, height: 812 } },
];

test.describe.serial('Upload Documents and share documents', () => {
	let page;
	let browserContext;
	let UploadName;

	test.beforeEach(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 },
		});
		page = await browserContext.newPage();
		const apiContext = await request.newContext();
		api = new APIRequests(apiContext);
		pom = new POManager(page);

		await pom.loginPage.loginBlume();

		const randomNum = api.generateRandomNumber(111111, 999999);

		UploadName = `UploadTemplate ${randomNum}`;
		await page.waitForTimeout(20000);
	});

	viewports.forEach(({ name, viewport }) => {
		test(`Upload PDF file on ${name} screen`, async ({ browser }) => {
			const context = await browser.newContext({ viewport });
			await page.setViewportSize({ ...viewport });

			await page.waitForTimeout(TIMEOUT_IN_MSEC1);
			await page.evaluate(() => {
				const el = document.querySelector('[data-cy="sidebar-profile"]');
				if (el) {
					el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
				}
			});
			await page.locator('li:has-text("Profile")').click();
			await pom.apiWaitUtils.waitForAPI('/blume-api/Document', 'GET');
			const originalFilePath = path.resolve(__dirname, '../TestData/Upload.pdf');
			await page.route('**/blume-api/Document?*', route => route.continue());

			await page
				.locator('#file-upload-input')
				.first()
				.setInputFiles({
					name: `${UploadName}.pdf`,
					mimeType: 'application/pdf',
					buffer: fs.readFileSync(originalFilePath),
				});

			await page.click('[data-cy="consent-no"]');
			await pom.apiWaitUtils.waitForAPI('/blume-api/Document?', 'POST');

			await page.locator('[data-testid="CheckIcon"]').click({ timeout: TIMEOUT_IN_MSEC1 });

			await pom.blume.documentSearchBtn().first().click({ force: true });
			await pom.blume.documentSearchTxtArea().fill(UploadName);

			await expect(pom.blume.documentTitleTxt().first()).toContainText(`${UploadName}.pdf`);

			await page.waitForTimeout(6000);
			await pom.blume.documentThumbnail().hover();
			await pom.blume.documentCheckBtn().click();
			await page.unroute('**/**');
			await page.route('**/blume-api/Document?hash=**', route => route.continue());
			await page.locator('[data-testid="progress-delete-button"] [data-testid="DeleteOutlineIcon"]').hover();
			await page.mouse.down();
			await pom.apiWaitUtils.waitForAPI('/blume-api/Document?hash=', 'DELETE');

			await context.close();
		});

		test.skip(`Upload Dicom file on ${name} screen`, async ({ browser }) => {
			const context = await browser.newContext({ viewport });
			await page.setViewportSize({ ...viewport });

			await page.waitForTimeout(TIMEOUT_IN_MSEC3);
			await page.evaluate(() => {
				const el = document.querySelector('[data-cy="sidebar-profile"]');
				if (el) {
					el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
				}
			});
			await page.locator('li:has-text("Profile")').click();
			const originalFilePath = path.resolve(__dirname, '../TestData/2.dcm');
			await page.route('**/blume-api/Study/dicomuploadv2*', route => route.continue());

			await page
				.locator('#file-upload-input')
				.first()
				.setInputFiles({
					name: `${UploadName}.dcm`,
					mimeType: 'application/dicom',
					buffer: fs.readFileSync(originalFilePath),
				});

			await page.click('[data-cy="consent-no"]');
			await pom.apiWaitUtils.waitForAPI('/blume-api/Study/dicomuploadv2', 'POST');

			await page.waitForTimeout(6000);

			// await page.locator('[data-testid="CheckIcon"]').click({ timeout: TIMEOUT_IN_MSEC1 });

			await pom.blume.documentSearchBtn().first().click({ force: true });
			await pom.blume.documentSearchTxtArea().fill('ORTHOPEDICS');

			await expect(pom.blume.documentTitleTxt().first()).toContainText('ORTHOPEDICS');

			await page.waitForTimeout(6000);
			await pom.blume.documentThumbnail().hover();
			await pom.blume.documentCheckBtn().click();
			await page.unroute('**/**');
			await page.route('**/blume-api/Study/dicomDelete?internalStudyId**', route => route.continue());
			await page.locator('[data-testid="progress-delete-button"] [data-testid="DeleteOutlineIcon"]').hover();
			await page.mouse.down();
			await pom.apiWaitUtils.waitForAPI('/blume-api/Study/dicomDelete?internalStudyId', 'DELETE');

			await context.close();
		});
	});
});

const { test, expect, request, chromium } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const playwrightConfig = require('../../playwright.config');
const { POManager } = require('../POM/POManager');
const path = require('path');
const { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3 } = require('../POM/timeouts');
const { faker } = require('@faker-js/faker');

test.describe.serial('View Study Image Viewer', () => {
	let browserContext, page, api, studyHelper, poManager, userName;
	let patientName = '';
	let patientId = '';
	let managingOrgName = playwrightConfig.managingOrg.organizationName;
	let finalReportName = '';
	let tokenObj = {};
	let patientData = {};
	const email = playwrightConfig.userName;

	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 }, // Use desktop viewport for setup
		});
		page = await browserContext.newPage();

		const apiContext = await request.newContext();
		api = new APIRequests(apiContext);
		studyHelper = new postStudyNGetToken(apiContext);
		poManager = new POManager(page);

		const managingOrg = playwrightConfig.managingOrg;
		// Get token/session
		const token = await studyHelper.getTokenAndSessionId();
		tokenObj = {
			accessToken: token.accessToken,
			sessionID: token.sessionID,
		};
		// Create study and patient
		patientData = await studyHelper.postStudy(
			undefined, // createPatientInputFile
			undefined, // isPatientV2
			undefined, // patientPayload
			false, // includePatientNames
			undefined, // managingOrg
			undefined, // imagingOrg
			tokenObj // tokenObj
		);
		patientName = `${patientData.patientName}`;
		patientId = patientData.patientId;

		console.log('Importing studies');

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/testDownloadBlume/BLUMESTUDY.DCM')
		);

		await api.importDICOM(filePath, patientData.studyId);

		const userDetails = await api.getUserDetails();
		userName = userDetails.name[0].text;

		const patientRes = await api.getResourceById('patient', patientData.patientId, tokenObj);
		const existingEmail = patientRes.telecom.find(t => t.system === 'email' && t.value.trim() !== '');

		if (existingEmail) {
			existingEmail.value = email;
			existingEmail.rank = 0;
		} else {
			patientRes.telecom.push({
				system: 'email',
				value: email,
				rank: 0,
				__uniqueId: uuidv4(),
			});
		}

		patientRes.telecom.forEach(t => {
			if (t.system === 'email' && t.value !== email) {
				t.rank = 1;
			}
		});

		await api.putResource('patient', patientRes.id, patientRes, tokenObj);

		await poManager.loginPage.loginOmegaAI();

		await poManager.documentViewer.openDocumentViewer(`${patientData.patientName}`, managingOrg.organizationName);
		await page.route('**/ReportContent*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				route.continue();
			} else {
				route.continue();
			}
		});
		// Upload final report
		const randomNum = faker.number.int({
			min: 1111111111,
			max: 9999999999,
		});
		finalReportName = `Final Report ${randomNum}`;
		await poManager.documentViewer.uploadDocumentInStudyList(finalReportName, true);
		await poManager.apiWaitUtils.waitForAPI('/ReportContent', 'GET');
		await expect(
			page.locator('[id="Final Report"] [id="title"]', { timeout: TIMEOUT_IN_MSEC2 }).nth(0)
		).toContainText(finalReportName);

		// Login to Blume
		await page.waitForTimeout(TIMEOUT_IN_MSEC3);
		await page.evaluate(() => window.localStorage.clear());
		await poManager.loginPage.loginBlume();
		await expect(page).toHaveURL(/\/home/);
	});

	test.afterAll(async () => {
		if (patientData?.patientId) {
			await studyHelper.cleanupPatient(patientData?.patientId, tokenObj);
		}
		await browserContext.close();
	});

	test('View Study IV should be read-only on [1920, 1080] screen', async () => {
		await page.setViewportSize({ width: 1920, height: 1080 });

		// Go to Completed Appointments tab
		const completedTab = poManager.blume.completedAppointmentsTab();
		await expect(completedTab).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await completedTab.click();
		await page.waitForTimeout(3000);
		// Find and click the View Images button for the specific patient in completed appointments
		const appointmentCard = page.locator('.css-119vlmr').filter({ hasText: patientName });
		await expect(appointmentCard).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await expect(appointmentCard).toContainText(managingOrgName);
		const viewImageBtn = appointmentCard.getByText('View Images');
		await expect(viewImageBtn).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await viewImageBtn.click();
		await page.waitForTimeout(3000);
		await expect(page).toHaveURL(/\/view-study/, { timeout: 30000 });

		const iframe = page.frameLocator('#external-view-iframe');
		const toolbar = iframe.locator('[data-testid="MoreVertOutlinedIcon"]');
		await expect(toolbar).toHaveCount(1, { timeout: 30000 });
		await toolbar.nth(0).click();

		const disableOptions = ['Pop Out In Window', 'Fullscreen Mode'];
		const availableOptions = ['Burn Study', 'Toggles', 'Link Series', 'Download', 'Settings'];

		for (const option of disableOptions) {
			await expect(iframe.locator('span.MuiListItemText-primary', { hasText: option })).toHaveCount(0);
		}

		for (const option of availableOptions) {
			await expect(iframe.locator('span.MuiListItemText-primary', { hasText: option })).toBeVisible();
		}

		await expect(
			iframe.locator('[data-testid="image-viewer-document-viewer-stack"]', { timeout: TIMEOUT_IN_MSEC1 })
		).toBeVisible();
		await iframe.locator('[data-testid="ImageViewerSplitButton"] [data-testid="CloseIcon"]').click({ force: true });
	});

	const sizes = [
		{ name: 'ipad-2', viewport: { width: 768, height: 1024 } },
		{ name: 'iphone-xr', viewport: { width: 414, height: 896 } },
	];

	for (const { name, viewport } of sizes) {
		test(`View Study IV should be read-only on ${name} screen`, async () => {
			await page.setViewportSize(viewport);
			await page.goto(playwrightConfig.baseBlumeURL, { waitUntil: 'load', timeout: TIMEOUT_IN_MSEC3 });
			await poManager.blume.completedAppointmentsTab().click({ force: true });
			// Wait for /home URL
			await expect(page).toHaveURL(/\/home/);

			// Wait for page to settle
			await page.waitForTimeout(TIMEOUT_IN_MSEC2);

			// Intercept study API
			await page.route('**/blume-api/Study?id**', route => route.continue());

			// Click Completed Appointments tab
			await poManager.blume.completedAppointmentsTab().click({ force: true });

			// Find and click the View Results button for the specific patient in completed appointments
			const appointmentCard = page.locator('.css-1hmcbzg').filter({ hasText: patientName });
			await expect(appointmentCard).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
			await expect(appointmentCard).toContainText(managingOrgName);
			const viewImageBtn = appointmentCard.getByText('View Results');
			await expect(viewImageBtn).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
			await viewImageBtn.click({ force: true });

			// Wait for study API response
			await page.waitForResponse(
				resp =>
					resp.url().includes('/blume-api/Study?id') &&
					resp.request().method() === 'GET' &&
					resp.status() === 200
			);

			// Verify completed detail mobile is visible
			await expect(poManager.blume.completedDetailMobile()).toBeVisible();

			// Verify Study Information grid
			await expect(page.getByText('Study Information')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

			// Verify reports list
			await expect(page.getByText('Reports')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

			// Verify Share list
			await expect(page.getByText('Shared With')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

			// Intercept final report API
			await page.route('**/blume-api/Study/report/*/content', route => route.continue());

			// Click final report name
			await expect(page.getByText(finalReportName)).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
			await page.getByText(finalReportName).click({ force: true });

			// Wait for final report API response
			await page.waitForResponse(
				resp =>
					resp.url().includes('/blume-api/Study/report/') &&
					resp.request().method() === 'GET' &&
					resp.status() === 200
			);

			// Verify PDF toolbar
			await expect(poManager.blume.zoomOutBtn()).toBeVisible();
			await expect(poManager.blume.zoominBtn()).toBeVisible();
			await expect(poManager.blume.downloadBtn()).toBeVisible();
			await expect(poManager.blume.printBtn()).toBeVisible();

			// Back to study detail view
			await poManager.blume.closeDocumentMobileView().click({ force: true });

			// Intercept study series API
			await page.route('**/blume-api/studies/*/series**', route => route.continue());

			// Open image viewer
			await expect(poManager.blume.viewImageBtn()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });
			await poManager.blume.viewImageBtn().scrollIntoViewIfNeeded();
			await poManager.blume.viewImageBtn().click();

			// Wait for viewer API response
			await page.waitForResponse(
				resp =>
					resp.url().includes('/blume-api/studies/') &&
					resp.request().method() === 'GET' &&
					resp.status() === 200,
				{ timeout: TIMEOUT_IN_MSEC2 }
			);

			// Wait for viewer engine to be visible first
			await expect(poManager.blume.dataRenderEngine()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });

			// heck for thumbnail
			await expect(poManager.blume.imageThumbnail()).toBeVisible({ timeout: TIMEOUT_IN_MSEC2 });

			// Back to study detail view
			await poManager.blume.closeDocumentMobileView().click({ force: true });
		});
	}
});

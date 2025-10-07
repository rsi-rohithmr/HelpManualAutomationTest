const { test, expect, request, chromium } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const playwrightConfig = require('../../playwright.config');
const { POManager } = require('../POM/POManager');
const path = require('path');
const { TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC3 } = require('../POM/timeouts');

test.describe.serial('Download (zip/btd) study', () => {
	let browserContext, page, api, studyHelper, poManager, userName;
	let patientName = '';
	let patientId = '';
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

		// Login to Blume
		await page.waitForTimeout(TIMEOUT_IN_MSEC3);
		await page.goto(playwrightConfig.baseBlumeURL, { waitUntil: 'load', timeout: TIMEOUT_IN_MSEC3 });
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

	test('Download study as zip on [1920, 1080] screen', async () => {
		await poManager.blume.completedAppointmentsTab().click({ force: true });
		await page.waitForTimeout(TIMEOUT_IN_MSEC2);

		async function clickDownloadResultsOrReload(reloadAttempted = false) {
			await poManager.blume.completedAppointmentsTab().click({ force: true });
			await page.waitForTimeout(TIMEOUT_IN_MSEC2);

			const allRows = await page.locator('.css-119vlmr').elementHandles();
			console.log('Found rows:', allRows.length);

			let matchingRow = null;
			for (const row of allRows) {
				const text = await row.innerText();
				console.log('Row text:', text);
				if (text.includes(patientName)) {
					matchingRow = row;
					break;
				}
			}
			console.log('Matching row:', matchingRow ? 'found' : 'not found');

			if (matchingRow) {
				const downloadBtn = await matchingRow.$('text=Download Results');
				if (downloadBtn) {
					await downloadBtn.click({ force: true });
					// Wait for spinner to disappear (download complete)
					await expect(page.locator('.MuiCircularProgress-root[role="progressbar"]')).not.toBeVisible({
						timeout: 900000,
					});
				} else {
					throw new Error('Download Results button not found in matching row.');
				}
			} else if (!reloadAttempted) {
				console.log('Patient not found, reloading and retrying...');
				await page.reload();
				await expect(page.locator('[data-testid="AddIcon"]')).toBeVisible();
				await page.waitForTimeout(30000);
				await clickDownloadResultsOrReload(true);
			} else {
				throw new Error(`Failed to find patient row for "${patientName}" after reload.`);
			}
		}

		await clickDownloadResultsOrReload();
	});

	test('Burn to disc study on [1920, 1080] screen', async () => {
		// Listen for the POST request to discImageBurner
		let burnToDiscResponse;
		page.on('response', async response => {
			if (response.request().method() === 'POST' && response.url().includes('/blume-api/Study/discImageBurner')) {
				burnToDiscResponse = response;
			}
		});

		await poManager.blume.completedAppointmentsTab().click({ force: true });
		await page.waitForTimeout(TIMEOUT_IN_MSEC2);

		const allRows = await page.locator('.css-119vlmr').elementHandles();
		console.log('Found rows:', allRows.length);

		let matchingRow = null;
		for (const row of allRows) {
			const text = await row.innerText();
			console.log('Row text:', text);
			if (text.includes(patientName)) {
				matchingRow = row;
				break;
			}
		}
		console.log('Matching row:', matchingRow ? 'found' : 'not found');

		if (matchingRow) {
			const burnBtn = await matchingRow.$('text=Burn to disc');
			if (burnBtn) {
				await burnBtn.click({ force: true });

				// Wait for the POST response
				await page.waitForResponse(
					resp =>
						resp.request().method() === 'POST' &&
						resp.url().includes('/blume-api/Study/discImageBurner') &&
						resp.status() === 200,
					{ timeout: 600000 }
				);

				// Validate response headers
				const headers = await burnToDiscResponse.headers();
				expect(headers['content-type']).toBe('application/octet-stream');
				expect(headers['content-length']).toBeTruthy();
				expect(headers['content-disposition']).toBe(
					"attachment; filename=RamSoft.DiscImageBurner.exe; filename*=UTF-8''RamSoft.DiscImageBurner.exe"
				);

				// Optionally, validate response body is not empty
				const body = await burnToDiscResponse.body();
				expect(body.byteLength).toBeGreaterThan(0);
			} else {
				throw new Error('Burn to disc button not found in matching row.');
			}
		} else {
			throw new Error(`Failed to find patient row for "${patientName}".`);
		}
	});
});

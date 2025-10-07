const { test, expect, chromium, request } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC4 } = require('../POM/timeouts');
let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let dvPage;
let IVPage2;
let DVPOManager;
let IV1POManager;
let name;
const newDateOptions = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
};
let currentDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
let userdetails;
let reportDate = currentDate.toLocaleString('en-US', newDateOptions);
const reportTxt = 'Test report save';
let url = { mainPageURL: '', DVPageURL: '', IV1PageURL: '' };
let url1 = { mainPageURL: '', DVPageURL: '', IV1PageURL: '' };
let signText;
test.describe('ImageViewer MM', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudy().then(result => {
			console.log(`Posted study value`);
			console.log(result);
			studyInfo = result;
		});
		await api.getUserDetails().then(result => {
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});
		signText = `DIGITALLY SIGNED BY ${name} ON ${reportDate} AT`;
	});

	test.beforeEach(async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiMonitor/CT1_Axial.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiMonitor/CT2_Axial.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiMonitor/CT3_Sagittal.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/multiMonitor/CT4_Coronal.dcm')
		);

		await Promise.all([
			await api.importDICOM(filePath3, studyInfo.studyId),
			await api.importDICOM(filePath2, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId),
			await api.importDICOM(filePath, studyInfo.studyId),
		]);

		// Modify network request response
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json(); // Parse response JSON

			// Modify JSON data
			if (bodyJson.features && bodyJson.features['won-mm-e2e-mocking']) {
				bodyJson.features['won-mm-e2e-mocking'].variationName = 'Variation On';
				bodyJson.features['won-mm-e2e-mocking'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['won-mm-e2e-mocking']) {
				bodyJson.variables['won-mm-e2e-mocking'].value = true;
			}

			// Fulfill request with modified data
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});
		await page.waitForTimeout(60000);
		await poManager.loginPage.loginOmegaAI();

		// Get the initial number of open pages
		const initialPages = await page.context().pages();
		console.log(`Initial page count: ${initialPages.length}`);

		// Trigger popups
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(12000);
		// Get all pages again and find the new ones
		const allPages = page.context().pages();
		const newPages = allPages.filter(pg => !initialPages.includes(pg));

		console.log(`Total open pages: ${allPages.length}`);
		console.log(`New popups detected: ${newPages.length}`);

		// Ensure exactly 2 new popups were captured
		if (newPages.length < 2) {
			throw new Error(`Expected 2 popups, but found ${newPages.length}`);
		}

		// Debugging: Print all URLs to check what is being captured
		await newPages.forEach((pg, index) => console.log(`Popup ${index + 1} URL: ${pg.url()}`));

		// Assign pages based on URL content
		if (newPages[0].url().includes('document-viewer')) {
			dvPage = newPages[0];
			IVPage2 = newPages[1];
		} else {
			dvPage = newPages[1];
			IVPage2 = newPages[0];
		}

		// Ensure the pages are fully loaded before interacting
		await dvPage.waitForLoadState();
		await IVPage2.waitForLoadState();
		console.log('DVPage URL:', page.url());
		console.log('DVPage URL:', dvPage.url());
		console.log('IVPage2 URL:', IVPage2.url());
		url.mainPageURL = page.url();
		url.DVPageURL = dvPage.url();
		url.IV1PageURL = IVPage2.url();

		// Perform actions in the popups
		DVPOManager = new POManager(dvPage);
		IV1POManager = new POManager(IVPage2);

		async function checkAndRecoverIVPage(IVPage2) {
			try {
				if ((await IVPage2.url()) === 'about:blank') {
					console.log('IVPage2 loaded about:blank. Reloading...');
					await IVPage2.reload();
				} else {
					const isWhiteScreen = await IVPage2.evaluate(() => {
						return document.body.innerText.trim().length === 0;
					});

					if (isWhiteScreen) {
						console.log('IVPage2 is blank. Reloading...');
						await IVPage2.reload();
					} else {
						console.log('IVPage2 is functioning correctly.');
					}
				}
			} catch (error) {
				console.log('Error detected on IVPage2. Reloading...', error);
				await IVPage2.reload();
			}
		}

		// Run this check before interacting with IVPage2
		await checkAndRecoverIVPage(IVPage2);

		await DVPOManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
	});

	test('MultiMonitor Sign off from DV', async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		await DVPOManager.documentViewer.openBookmarksFromDV();
		await dvPage.route('**/fhir/DiagnosticReport/*/save', async route => {
			route.continue();
		});
		await Promise.all([
			DVPOManager.apiWaitUtils.waitForAPI('/save', 'PUT'),
			DVPOManager.documentViewer.dragAndDropBookmarkToTiptapEditor('Accession #'),
		]);
		await DVPOManager.documentViewer.bookmarkOpenCollapseBtn().click({ force: true });
		// Verifying patient Details all pages
		expect(await page.locator('.css-16sq0ei').innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);

		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		await DVPOManager.documentViewer.signDiagnosticReportMM(page, false, poManager);
		await dvPage.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			route.continue();
		});
		// Trigger popups
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true),
			DVPOManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET', TIMEOUT_IN_MSEC4),
		]);
		await dvPage.waitForTimeout(10000);
		const pdfText2 = await DVPOManager.documentViewer.pdfViewerArea().textContent();
		expect(pdfText2).toContain(reportTxt);
		expect(pdfText2).toContain(studyInfo.accessionNum);
		expect(pdfText2).toContain(signText);
		expect(await page.locator('.css-16sq0ei').innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);

		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
	});

	test('MultiMonitor Sign off from IV', async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		await DVPOManager.documentViewer.openBookmarksFromDV();
		await dvPage.route('**/fhir/DiagnosticReport/*/save', async route => {
			route.continue();
		});
		await Promise.all([
			DVPOManager.apiWaitUtils.waitForAPI('/save', 'PUT'),
			DVPOManager.documentViewer.dragAndDropBookmarkToTiptapEditor('Accession #'),
		]);
		await DVPOManager.documentViewer.bookmarkOpenCollapseBtn().click({ force: true });
		// Verifying patient Details all pages
		expect(await page.locator('.css-16sq0ei').innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		//sign IV
		await DVPOManager.documentViewer.signDiagnosticReportMM(page, true, poManager);
		await dvPage.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			route.continue();
		});
		// Trigger popups
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true),
			DVPOManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET', TIMEOUT_IN_MSEC4),
		]);
		// added to handle the text render delay
		await dvPage.waitForTimeout(10000);
		const pdfText2 = await DVPOManager.documentViewer.pdfViewerArea().textContent();
		expect(pdfText2).toContain(reportTxt);
		expect(pdfText2).toContain(studyInfo.accessionNum);
		expect(pdfText2).toContain(signText);
		// Verifying patient Details all pages
		expect(await page.locator('.css-16sq0ei').innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
	});
});
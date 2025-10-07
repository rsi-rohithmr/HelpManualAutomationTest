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
const reportTxt = 'Test report save';
let url = { mainPageURL: '', DVPageURL: '', IV1PageURL: '' };
let url1 = { mainPageURL: '', DVPageURL: '', IV1PageURL: '' };
let name;
const newDateOptions = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
};
let currentDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
let userdetails;
let reportDate = currentDate.toLocaleString('en-US', newDateOptions);
let signText;
test.describe('ImageViewer MM', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		await api.postStudywithPrior().then(result => {
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

			await api.importDICOM(filePath3, studyInfo.studyId1),
			await api.importDICOM(filePath2, studyInfo.studyId1),
			await api.importDICOM(filePath1, studyInfo.studyId1),
			await api.importDICOM(filePath, studyInfo.studyId1),
		]);
		// Modify network request response to enable won-mm-e2e-mocking
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
		// Added 2 mins time for imported DICOM studies to update
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

	test('MultiMonitor Sign off from DV Next study', async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		await DVPOManager.documentViewer.openBookmarksFromDV();
		await dvPage.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await Promise.all([
			DVPOManager.apiWaitUtils.waitForAPI('/save', 'PUT'),
			DVPOManager.documentViewer.dragAndDropBookmarkToTiptapEditor('Accession #'),
		]);
		await DVPOManager.documentViewer.bookmarkOpenCollapseBtn().click({ force: true });
		console.log('DVPage URL:', page.url());
		console.log('DVPage URL:', dvPage.url());
		console.log('IVPage2 URL:', IVPage2.url());
		url.mainPageURL = page.url();
		url.DVPageURL = dvPage.url();
		url.IV1PageURL = IVPage2.url();

		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();
		const cards = DVPOManager.documentViewer.patientChartCardTitle();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		// Select the patient card from the patient chart
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await IV1POManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		expect(await DVPOManager.documentViewer.currentStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum
		);
		expect(await DVPOManager.documentViewer.priorStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum1
		);
		await DVPOManager.documentViewer.signAndNextStudyMM(page, false, poManager);
		url1.mainPageURL = page.url();
		url1.DVPageURL = dvPage.url();
		url1.IV1PageURL = IVPage2.url();
		console.log('URLS after next study click:');
		Object.entries(url1).forEach(([key, value]) => {
			console.log(`${key}: ${value}`);
		});
		expect(url1.mainPageURL).not.toBe(url.mainPageURL);
		expect(url1.DVPageURL).not.toBe(url.DVPageURL);
		expect(url1.IV1PageURL).not.toBe(url.IV1PageURL);

		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		// Going to back the reported study and validate the report content
		// Select the patient card from the patient chart
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId1);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		expect(await DVPOManager.documentViewer.currentStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum1
		);
		expect(await DVPOManager.documentViewer.priorStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum
		);
		// Going to back the reported study and validate the report content
		await page.locator('[title="Go Back"]').nth(1).click();
		await dvPage.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			await route.continue();
		});
		// Trigger popups
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true),
			DVPOManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET', TIMEOUT_IN_MSEC4),
		]);

		// added to handle the text render delay
		await dvPage.waitForTimeout(20000);
		const pdfText4 = await DVPOManager.documentViewer.pdfViewerArea().textContent();
		expect(pdfText4).toContain(reportTxt);
		expect(pdfText4).toContain(studyInfo.accessionNum);
		expect(pdfText4).toContain(signText);
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();

		// Verifying patient Details all pages
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		// Select the patient card from the patient chart
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await IV1POManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
	});

	test('MultiMonitor Sign off from IV Next study', async ({ page }) => {
		test.setTimeout(480000);
		const poManager = new POManager(page);
		await DVPOManager.documentViewer.openBookmarksFromDV();
		await dvPage.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await Promise.all([
			DVPOManager.apiWaitUtils.waitForAPI('/save', 'PUT'),
			DVPOManager.documentViewer.dragAndDropBookmarkToTiptapEditor('Accession #'),
		]);
		await DVPOManager.documentViewer.bookmarkOpenCollapseBtn().click({ force: true });
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// PatientChart cards
		const cards = DVPOManager.documentViewer.patientChartCardTitle();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		// Verifying patient Details all pages
		// Select the patient card from the patient chart
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		expect(await DVPOManager.documentViewer.currentStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum
		);
		expect(await DVPOManager.documentViewer.priorStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum1
		);

		console.log('DVPage URL:', page.url());
		console.log('DVPage URL:', dvPage.url());
		console.log('IVPage2 URL:', IVPage2.url());
		url.mainPageURL = page.url();
		url.DVPageURL = dvPage.url();
		url.IV1PageURL = IVPage2.url();
		await DVPOManager.documentViewer.signAndNextStudyMM(page, true, poManager);
		await dvPage.waitForTimeout(30000);
		url1.mainPageURL = page.url();
		url1.DVPageURL = dvPage.url();
		url1.IV1PageURL = IVPage2.url();
		console.log('URLS after next study click:');
		Object.entries(url1).forEach(([key, value]) => {
			console.log(`${key}: ${value}`);
		});
		expect(url1.mainPageURL).not.toBe(url.mainPageURL);
		expect(url1.DVPageURL).not.toBe(url.DVPageURL);
		expect(url1.IV1PageURL).not.toBe(url.IV1PageURL);
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();
		// Verifying patient Details all pages
		// Select the patient card from the patient chart
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId1);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
		expect(await DVPOManager.documentViewer.currentStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum1
		);
		expect(await DVPOManager.documentViewer.priorStudyAccordionSummaryContent().innerText()).toContain(
			studyInfo.accessionNum
		);
		// Going to back the reported study and validate the report content
		await page.locator('[title="Go Back"]').nth(1).click();
		await dvPage.route('**/DiagnosticReport/*/ReportContent?*', async route => {
			await route.continue();
		});
		// Trigger popups
		await Promise.all([
			poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, true),
			DVPOManager.apiWaitUtils.waitForAPI('ReportContent?', 'GET', TIMEOUT_IN_MSEC4),
		]);

		// added to handle the text render delay
		await dvPage.waitForTimeout(20000);
		const pdfText4 = await DVPOManager.documentViewer.pdfViewerArea().textContent();
		expect(pdfText4).toContain(reportTxt);
		expect(pdfText4).toContain(studyInfo.accessionNum);
		expect(pdfText4).toContain(signText);
		// The left side panel should open by default
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).not.toBeVisible();

		// Open the side Navigator panel
		await DVPOManager.documentViewer.toggleLeftPanelFromDV();

		// The left side panel should now be visible
		expect(await DVPOManager.documentViewer.leftPanelFromDV()).toBeVisible();

		// Verifying patient Details all pages
		// Select the patient card from the patient chart
		expect(await cards.nth(1)).toHaveText(studyInfo.patientName);
		expect(await poManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await poManager.imageViewer.studyIdlineInIV().innerText()).toContain(studyInfo.studyId);
		expect(await IV1POManager.imageViewer.patientNameInIV().innerText()).toContain(studyInfo.patientName);
		expect(await dvPage.locator('[data-testid="name-label"]').innerText()).toContain(studyInfo.patientName);
	});
});

const { test, expect, chromium, request } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { APIRequests } = require('../APIutils/APIRequests');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { BlumeSignUpPage } = require('../POM/blumePage/blumeSignUpPage');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { Common } = require('../POM/common');
const { BreezeAPI } = require('../APIutils/breezeAccountManager');
const { Login } = require('../POM/login');
const { ShareDrawer } = require('../POM/blumePage/shareDrawer');
const { blume } = require('../POM/blumePage/blume');

let patientData = {};
let breezeAPI;
let accountId = '';
let studyHelper = '';
let poManager;
const domain = 'mailsac.com';
const emailSubject = 'has shared a study with you';
const pin = '123456';
const apiKey = Common.mailsacAPIKey3;

const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
const email = `sendtoblume${timestamp}@${domain}`;
let organizationData = '';
let api = '';
const newAddress = {
	line: ['JERSEY CITY BLVD'],
	city: 'JERSEY CITY BOULEVARD',
	state: 'NJ',
	postalCode: '07305',
	country: 'UNITED STATES',
	latitude: 40.7167, // Example Jersey City latitude
	longitude: -74.0667, // Example Jersey City longitude
};

const orgPayload = {
	IsRescheduleAllowed: true,
	IsCancelledAllowed: true,
	IsUnknownOrdersetEnabled: true,
};

const viewports = [
	{ name: 'Desktop', viewport: { width: 1920, height: 1080 } },
	{ name: 'Tablet', viewport: { width: 768, height: 1024 } },
	{ name: 'Mobile', viewport: { width: 375, height: 812 } },
];

test.describe.serial('Send To Blume V2 - Setup', () => {
	let page;
	let userName = '';
	let browserContext;
	let tokenObj = {};

	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 }, // Use desktop viewport for setup
		});
		page = await browserContext.newPage();

		const login = new Login(page);
		const apiContext = await request.newContext();
		const accessToken = await login.getAccessTokenForBreezeAccount();
		breezeAPI = new BreezeAPI(apiContext, accessToken);
		api = new APIRequests(apiContext);
		studyHelper = new postStudyNGetToken(apiContext);
		poManager = new POManager(page);

		const managingOrg = playwrightConfig.managingOrg;
		const primaryEntityName = playwrightConfig.primaryEntityName;

		accountId = await breezeAPI.postBreezeAccount(
			managingOrg.organizationName,
			managingOrg.clientId,
			primaryEntityName
		);
		await breezeAPI.updateBreezeAccountAssets(accountId, managingOrg.organizationId, 'Blume Patient Portal');
		const token = await studyHelper.getTokenAndSessionId();
		tokenObj = {
			accessToken: token.accessToken,
			sessionID: token.sessionID,
		};

		// update organization address
		organizationData = await api.getResourceById('organization', managingOrg.organizationId, tokenObj);
		organizationData.address = [newAddress];
		delete organizationData.meta;
		await api.putResource('organization', managingOrg.organizationId, organizationData);
		patientData = await studyHelper.postStudy('', '', '', true);
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
		await poManager.loginPage.logoutOmegaAI();

		await poManager.loginPage.loginOmegaAI();
		const reportText = 'Test report final';
		await page.route('**/fhir/DiagnosticReport/*', route => route.continue());

		await poManager.documentViewer.openDocumentViewer(
			`${patientData.patientLastName} ${patientData.patientFirstName}`,
			managingOrg.organizationName
		);

		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportText, false);
		await poManager.documentViewer.signDiagnosticReport();

		await page.route('**/DiagnosticReport/**/ReportContent?*', route => route.continue());
		await poManager.documentViewer.openDocumentViewer(
			`${patientData.patientLastName} ${patientData.patientFirstName}`,
			managingOrg.organizationName,
			true
		);
		await poManager.apiWaitUtils.waitForAPI('ReportContent', 'GET');
		await poManager.documentViewer.finalReportCardValidation(userName, managingOrg.organizationName, reportText);

		await poManager.homePage.homePageBtn().click({ force: true });
		await poManager.homePage.filterStudiesBySingleColumn(
			'Patient Name',
			`${patientData.patientLastName} ${patientData.patientFirstName}`
		);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrg.organizationName);
		await poManager.homePage
			.worklistTableRows()
			.getByText(new RegExp(`^${patientData.patientLastName} ${patientData.patientFirstName}$`, 'g'))
			.first()
			.click();
		await expect(poManager.clickWheel.clickWheel()).toBeVisible();
		await expect(poManager.clickWheel.sendStudyIcon()).toBeVisible();
		await poManager.clickWheel.sendStudyIcon().click({ force: true });
		await page.getByText('SEND TO BLUME').click();
		await poManager.apiWaitUtils.waitForAPI('/Blume', 'POST');
	});

	test.afterAll(async () => {
		await breezeAPI.deleteBreezeAccount(accountId);
	});

	test('Get Blume Invitation Link and Sign up', async () => {
		await page.waitForTimeout(10000);
		const birthDate = Common.convertToMMDDYYYY(patientData.patientBirthday);
		await studyHelper.blumeSignUpV2(
			page,
			email,
			patientData.patientFirstName,
			patientData.patientLastName,
			birthDate,
			pin,
			apiKey,
			emailSubject
		);
	});

	test('Verify the shared study can be opened from Blume', async () => {
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
			iframe.locator('[data-testid="image-viewer-document-viewer-stack"]', { timeout: 10000 })
		).toBeVisible();
		await iframe.locator('[data-testid="ImageViewerSplitButton"] [data-testid="CloseIcon"]').click({ force: true });
	});

	test.describe('Send To Blume V2 - Automated Front Desk', () => {
		test.beforeEach(async () => {
			// post a healthcare service6
			await studyHelper.postHealthcareService();
			await breezeAPI.updateBreezeAccountAssets(
				accountId,
				playwrightConfig.managingOrg.organizationId,
				'Blume Automated Front Desk'
			);
			page = await browserContext.newPage();
			await page.goto(playwrightConfig.baseBlumeURL, { waitUntil: 'load', timeout: 60000 });
		});
		viewports.forEach(({ name, viewport }) => {
			test(`Verify Blume Automated Front Desk appointment creation - ${name}`, async ({ browser }) => {
				const context = await browser.newContext({ viewport });
				await page.setViewportSize({ ...viewport });

				const poManager = new POManager(page);
				await poManager.blume
					.createAnApptWithOrderSet(playwrightConfig.managingOrg.organizationName, 2, patientData.studyType)
					.then(response => {
						const apptID = response.id;
						expect(response.status).toEqual('proposed');
					});

				await context.close();
			});
		});
	});

	test('create and verify attachments to the appointment', async () => {
		page = await browserContext.newPage();
		await page.setViewportSize({ ...viewports[0].viewport });
		const poManager = new POManager(page);
		await page.goto(playwrightConfig.baseBlumeURL, { waitUntil: 'load', timeout: 60000 });
		await poManager.blume.uploadAttachmentToAppointment();
		await poManager.apiWaitUtils.waitForAPI('attachment', 'GET');
		await page.locator('[data-testid="close"]').click({ force: true });
	});

	test.skip('Verify Unknown Orderset option in appointment creation with feature flag', async () => {
		// Set desktop viewport for this test
		await page.setViewportSize({ width: 1920, height: 1080 });

		const poManager = new POManager(page);
		const managingOrg = playwrightConfig.managingOrg.organizationName;

		// Set up the Unknown Order Set feature flag
		await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
			const response = await route.fetch();
			const bodyJson = await response.json();

			// Enable the Unknown Order Set feature flag
			if (bodyJson.features && bodyJson.features['phoenix-blume-unknown-orderset']) {
				bodyJson.features['phoenix-blume-unknown-orderset'].variationName = 'Variation On';
				bodyJson.features['phoenix-blume-unknown-orderset'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['phoenix-blume-unknown-orderset']) {
				bodyJson.variables['phoenix-blume-unknown-orderset'].value = true;
			}

			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: JSON.stringify(bodyJson),
			});
		});

		// Patch the organization metadata
		await api.patchOrganizationMetadata(playwrightConfig.managingOrg.organizationId, orgPayload);

		await page.goto(playwrightConfig.baseBlumeURL);
		await poManager.blume
			.createAnApptWithOrderSet(managingOrg, 2, 'PROCEDURE NOT LISTED/ NOT SURE?')
			.then(response => {
				expect(response).toHaveProperty('studyId');
				expect(response).toHaveProperty('patientId');
			});
	});

	test.skip(`Share study via email and verify link access`, async () => {
		const targetPatientName = `${patientData.patientLastName}, ${patientData.patientFirstName}`;
		const shareDrawer = new ShareDrawer(page);
		const poManager = new POManager(page);

		await page.goto(playwrightConfig.baseBlumeURL);
		await page.waitForSelector('[data-cy="completed-appointments-tab"]', {
			state: 'visible',
			timeout: 10000,
		});
		await poManager.blume.completedAppointmentsTab().click({ force: true });

		// Locate patient card
		const patientCards = page.locator('div.MuiPaper-root');
		const targetCard = patientCards.filter({
			has: page.locator(`text=${targetPatientName}`),
		});

		await targetCard.getByRole('button', { name: 'Share via email' }).click();

		// Copy the shareable link (intercept network response)
		const [response] = await Promise.all([
			page.waitForResponse(
				res => res.url().includes('/api/blume-api/Study/studylink/') && res.request().method() === 'GET'
			),
			shareDrawer.copyLink(),
		]);

		const responseBody = await response.json();
		const copiedLink = responseBody.link;

		// Share study via email
		await shareDrawer.shareWithEmail(email);

		// Confirm sharing toast
		const confirmationToast = page.getByText('Shared Successfully!');
		await expect(confirmationToast).toBeVisible();

		// Open copied link in isolated context
		const browserInstance = page.context().browser();
		const context = await browserInstance.newContext();
		const newPage = await context.newPage();

		await newPage.goto(copiedLink);

		// Final cleanup
		await context.close();
	});
});

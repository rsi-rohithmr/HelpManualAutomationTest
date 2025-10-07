const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const path = require('path');

// Shared test data
let studyInfo = {};
let userdetails = {};
const managingOrgName = playwrightConfig.managingOrg.organizationName;

// Device configurations
const devices = [
	// Enable for Mobile Devices if required
	// {
	// 	name: 'iPhone 16 Pro',
	// 	viewport: { width: 430, height: 932 }, // Projected iPhone 16 Pro viewport
	// 	deviceScaleFactor: 3,
	// 	isMobile: true,
	// 	hasTouch: true,
	// 	userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
	// },
	// {
	// 	name: 'Samsung Galaxy S25 Ultra',
	// 	viewport: { width: 430, height: 950 }, // Projected S25 Ultra viewport
	// 	deviceScaleFactor: 4,
	// 	isMobile: true,
	// 	hasTouch: true,
	// 	userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
	// },
	// Tablet Devices
	{
		name: 'iPad Pro 11"',
		viewport: { width: 1194, height: 834 }, // iPad Pro 11" viewport
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
		userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
	},
	{
		name: 'Samsung Galaxy Tab S9 Ultra',
		viewport: { width: 1600, height: 2560 }, // Tab S9 Ultra viewport
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
		userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
	}
];

// Setup shared test data
async function setupTestData() {
	const apiContext = await request.newContext();
	const api = new postStudyNGetToken(apiContext);

	const result = await api.postStudy();
	console.log(result);
	studyInfo = result;
	
	console.log('import study');
	
	const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/1.dcm'));
	await api.importDICOM(filePath, studyInfo.studyId);
	
	const userResult = await api.getUserDetails();
	userdetails = userResult;
	console.log(userdetails.name[0].text);
}

test.describe.parallel('ImageViewer on Mobile and Tablet Devices', () => {
	test.beforeAll(async () => {
		await setupTestData();
	});

	for (const device of devices) {
		test.describe(`Testing on ${device.name}`, () => {
			test.use({
				viewport: device.viewport,
				deviceScaleFactor: device.deviceScaleFactor,
				isMobile: device.isMobile,
				hasTouch: device.hasTouch,
				userAgent: device.userAgent
			});

			test.beforeEach('login', async ({ page }) => {
				const poManager = new POManager(page);
				await poManager.loginPage.loginOmegaAI();
			});

			test('DICOM import and load image', async ({ page }) => {
				const poManager = new POManager(page);
				await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, false);
				await page.locator('[data-testid="ExpandableSection"]').first().click();
				await expect(page.getByTestId('ImageViewerViewportCornerstone').locator('[ready="true"]')).toBeVisible();
			});
		});
	}
});
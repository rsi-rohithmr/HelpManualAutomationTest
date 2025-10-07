const { test, chromium, request, expect } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

test.describe.serial('Blume User Profile - BMI Conversion & Display', () => {
	let poManager;
	let utilFuncs;
	let page, browserContext;
	let BMIValues, BMI, BMICategory;
	let weightKG, heightCM;
	const weightFactor = 2.20462;
	const heightFactor = 0.0328084;

	const viewports = [
		{ name: 'Desktop', viewport: { width: 1920, height: 1080 } },
		{ name: 'Tablet', viewport: { width: 768, height: 1024 } },
		{ name: 'Mobile', viewport: { width: 375, height: 812 } },
	];

	test.beforeAll(async () => {
		browserContext = await chromium.launchPersistentContext('', {
			headless: true,
			channel: 'chrome',
			viewport: { width: 1920, height: 1080 },
		});
		page = await browserContext.newPage();

		poManager = new POManager(page);
		await poManager.loginPage.loginBlume();

		const apiContext = await request.newContext();
		utilFuncs = new postStudyNGetToken(apiContext);

		await poManager.blume.profileIcon().click({ force: true });
		await page.locator('li:has-text("Profile")').waitFor({ state: 'visible' });
		await page.locator('li:has-text("Profile")').click({ force: true, timeout: 2000 });
	});

	test.beforeEach(async () => {
		weightKG = Number(`${utilFuncs.generateRandomNumber(44, 110)}.${utilFuncs.generateRandomNumber(11, 99)}`);
		heightCM = utilFuncs.generateRandomNumber(100, 200);
	});

	viewports.forEach(({ name, viewport }) => {
		test(`BMI test on ${name} screen`, async () => {
			await page.setViewportSize(viewport);
			await page.reload();
			const { blume } = poManager;
			// Fill weight and height in metric
			await page.getByText('Metric').click();
			await blume.userWeightSection().scrollIntoViewIfNeeded();
			await blume.userWeightSection().click();
			await page.waitForTimeout(1000);
			await blume.userWeightInput().waitFor({ state: 'visible' });

			await blume.userWeightInput().fill(`${weightKG}`);
			await page.locator('body').click();
			await poManager.apiWaitUtils.waitForAPI('/User?version=3', 'PATCH');
			await blume.userHeightSection().scrollIntoViewIfNeeded();
			await blume.userHeightSection().click();
			await blume.userHeightInput().fill(`${heightCM}`);
			await page.locator('body').click();
			await poManager.apiWaitUtils.waitForAPI('/User?version=3', 'PATCH');
			// Metric BMI calculation
			console.log(weightKG, heightCM);
			BMIValues = blume.BMICalculator?.(weightKG, heightCM);
			BMI = BMIValues[0];
			BMICategory = BMIValues[1] || 'BMI';

			// Validate metric units and values
			await expect(blume.userWeight()).toContainText('kg');
			await expect(blume.userHeight()).toContainText('cm');
			await expect(blume.userWeightSection()).toContainText('Weight');
			await expect(blume.userHeightSection()).toContainText('Height');
			await expect(blume.userBMI()).toContainText(BMI);
			await expect(blume.userBMICategory()).toContainText(BMICategory);

			// Switch to imperial and validate conversion
			await page.getByText('Imperial').click();
			await page.waitForTimeout(3000);
			await expect(blume.userWeight()).toContainText('lb');
			await expect(blume.userHeight()).toContainText('feet');
			await expect(blume.userWeight()).toContainText((weightKG * weightFactor).toFixed(2));
			await expect(blume.userHeight()).toContainText((heightCM * heightFactor).toFixed(2));
		});
	});
});

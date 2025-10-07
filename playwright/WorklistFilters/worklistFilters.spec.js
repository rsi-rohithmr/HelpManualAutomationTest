const { test, request, expect } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
test.describe('Worklist Filters Test', () => {
	let studyInfo;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const date = new Date().toDateString();

	test.beforeAll(async ({}) => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});
	});

	test.beforeEach(async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
		await page.waitForTimeout(60000);
	});

	// test.skip('Worklist Filters - Add date column if not exist', async ({ page }) => {
	// 	const poManager = new POManager(page);
	// 	await page.waitForFunction(
	// 		async () => {
	// 			const rows = await homePage.worklistTableRows(page);
	// 			return rows.length >= 1;
	// 		},
	// 		{ timeout: TIMEOUT_IN_MSEC3, polling: 300 }
	// 	);

	// 	const headers = await poManager.homePage.worklistTableHeader(page);
	// 	let isExist = headers.some(header => header.id === 'columnheader-lastUpdated');

	// 	if (!isExist) {
	// 		await page.route('**/fhir/WorklistLayout?*', route => route.continue());
	// 		await poManager.worklistSpeedDial.openSpeedDialSettings(page);
	// 		await page.waitForResponse(
	// 			response => response.url().includes('/fhir/WorklistLayout') && response.status() === 200
	// 		);
	// 		await page.waitForTimeout(3000);

	// 		const value = await poManager.worklistSettings.userWorklistNameCombo(page).getAttribute('value');
	// 		if (value.toUpperCase() !== worklistDefaultInfo.worklistName.toUpperCase()) {
	// 			await poManager.common.selectOptionFromSingleSelection(
	// 				worklistSettings.userWorklistNameLbl(page),
	// 				worklistDefaultInfo.worklistName
	// 			);
	// 		}

	// 		await poManager.worklistSettings.addColumnBtn(page).click();
	// 		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
	// 		await common.selectOptionFromSingleSelection(
	// 			poManager.worklistSettings.columnNameSearchBoxOnColumnsTab(page, 0),
	// 			'Date/Time Last Updated'
	// 		);
	// 		await page.waitForTimeout(3000);
	// 		await poManager.worklistSettings.saveExistingWorklistBtn(page).click();
	// 		await page.waitForSelector(`text=Worklist ${worklistDefaultInfo.worklistName} is saved.`);
	// 	}
	// });

	test('Worklist Filters - Text filter', async ({ page }) => {
		const poManager = new POManager(page);
		console.log(`Worklist Filters - Patient Name: ${studyInfo?.patientName}`);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Worklist Filters - Suggestion filter', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		// await poManager.homePage.worklistTableRows()
		// .getByText(`${poManager.common.buildSearchPattern(managingOrgName)}`).click();
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${managingOrgName}$`, 'g'))
				.first()
		).toBeVisible();
	});

	test('Worklist Filters - Multi-select filter', async ({ page }) => {
		const poManager = new POManager(page);
		await poManager.homePage.filterStudiesByMultiSelectionColumn('Modality', ['MR', 'CT']);
		// await expect(poManager.homePage.worklistTableRows().locator(`text=^CT$`)).toBeVisible();
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${'CT'}$`, 'g'))
				.first()
		).toBeVisible();
	});
});

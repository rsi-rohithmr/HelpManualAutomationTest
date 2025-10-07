const { test, expect, request, chromium } = require('@playwright/test');
import { TIMEOUT_IN_MSEC1 } from '../POM/timeouts';
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');

test.describe.serial('Teaching folder test', () => {
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const baseUrl = playwrightConfig.baseURL;
	const randomNum = faker.datatype.number({
		min: 1111111111,
		max: 9999999999,
	});
	let folderName = `Test Folder ${randomNum}`;
	let subFolderName = `Sub Folder ${randomNum}`;
	let subFolderNameEdited = `Edited Folder ${randomNum}`;
	let page;
	let browser;
	let studyInfo;
	test.beforeAll(async ({ }) => {

		// Create sutdy
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		browser = await chromium.launch();
		page = await browser.newPage();

		// Create sutdy
		await api.postStudy().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAI();
        // wait for 1 min before doing anything because there could be api slowness
        await page.waitForTimeout(5000);
    });

	test('Teaching Folder - Create Folder', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.teachingFolderPage.openTeachingPage();
		await poManager.teachingFolderPage.addFolder(folderName);
		const createdFolder = poManager.teachingFolderPage.getFolder(folderName);
		await expect(createdFolder).toBeVisible();
	});

	test('Teaching Folder - Create Sub Folder', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.teachingFolderPage.addSubFolder(folderName, subFolderName);
		const createdFolder = poManager.teachingFolderPage.getFolder(subFolderName);
		await expect(createdFolder).toBeVisible();
	});

	test('Teaching Folder - Edit Sub Folder Name', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.teachingFolderPage.editFolderName(subFolderName, subFolderNameEdited);
		const editedFolder = poManager.teachingFolderPage.getFolder(subFolderNameEdited);
		await expect(editedFolder).toBeVisible();
	});

	test('Teaching Folder - Remove Folder', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.teachingFolderPage.removeFolder(subFolderNameEdited);
		await expect(page.getByText('Folder deleted successfully')).toBeVisible();
		const removedFolder = poManager.teachingFolderPage.getFolder(subFolderNameEdited);
		await expect(removedFolder).not.toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
	});

	test('Teaching Folder - Add Studies to Folder', async ({ }) => {
		const poManager = new POManager(page);
		await poManager.sidebar.menuIcon('home').click();
		await expect(page.getByTestId('worklist-data-grid-table-header')).toBeVisible();
		await page.waitForTimeout(5000);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await page.waitForTimeout(5000);
		await expect(
			poManager.homePage.worklistTableRows().getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g')).first()
		).toBeVisible();

		const firstRow = poManager.homePage.worklistTableRows().first();
		await expect(firstRow).toBeVisible();
		await firstRow.hover();
		const checkbox = firstRow.locator('.PrivateSwitchBase-input').nth(0);
		await expect(checkbox).toBeVisible();
		await checkbox.click({ force: true, timeout: TIMEOUT_IN_MSEC1 });
		await poManager.teachingFolderPage.addStudiesToFolderBtn().click();
		await page.getByText(folderName).click();
		await poManager.teachingFolderPage.addStudiesToFolderSaveBtn().click();

		await poManager.teachingFolderPage.openTeachingPage();
		await page.getByText(folderName).click();
		await expect(page.locator('[data-cy="study-status-row-0"]')).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
	});

	test('Teaching Folder - Share Folder', async ({ }) => {
		const poManager = new POManager(page);
		await page.getByText(folderName).click();
		await poManager.teachingFolderPage.shareFolderBtn().click();
		await page.getByTestId('add-new-share').click();
		await page.getByTestId('suggest-infinite-scroll-multiple').locator('input').click();
		await page.waitForTimeout(2000);
		await page.locator('li[role="option"]').first().click({ timeout: TIMEOUT_IN_MSEC1 });
		await page.locator('[data-cy="share-button"]').click({ timeout: TIMEOUT_IN_MSEC1 });
		await expect(page.getByText('Share successful.')).toBeVisible();
		await page.locator('[data-cy="Share_close"]').click();
	});
	
	// Remove folder after all tests
	test.afterAll(async () => {
		try {
			const poManager = new POManager(page);
			await poManager.teachingFolderPage.navigateTeachingFolder();
			
			// Check if folder exists before trying to remove it
			const folderElement = poManager.teachingFolderPage.getFolder(folderName);
			const isFolderVisible = await folderElement.isVisible().catch(() => false);
			
			if (isFolderVisible) {
				await poManager.teachingFolderPage.removeFolder(folderName);
				console.log(`Removed folder successfully: ${folderName}`);
			} else {
				console.log(`Folder ${folderName} does not exist, skipping removal`);
			}
		} catch (error) {
			console.log(`Error removing folder ${folderName}:`, error.message);
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	});
});

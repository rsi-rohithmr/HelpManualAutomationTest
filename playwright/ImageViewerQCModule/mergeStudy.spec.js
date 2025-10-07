const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const path = require('path');
import { TIMEOUT_IN_MSEC1 } from '../POM/timeouts';

let studyInfo;
const managingOrgId = playwrightConfig.managingOrg.organizationId;
const managingOrgName = playwrightConfig.managingOrg.organizationName;
let poManager;
let browserContext;
let page;

test.describe('Merge Studies', () => {
	test.beforeAll(async () => {
		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);
		// Create a shared browser context and page
		browserContext = await chromium.launch();
		page = await browserContext.newPage();

		// Prepare the study
		await api.postStudywithPrior().then(result => {
			console.log('Posted study', result);
			studyInfo = result;
		});
		
		// Import images to the study
		const filePath = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/mergeStudies/studyA998.dcm')
		);
		const filePath1 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/mergeStudies/studyA999.dcm')
		);
		const filePath2 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/mergeStudies/studyA1000.dcm')
		);
		const filePath3 = path.relative(
			process.cwd(),
			path.join(__dirname, '../TestData/dicomImport/mergeStudies/studyB1.DCM')
		);
		await Promise.all([
			await api.importDICOM(filePath, studyInfo.studyId),
			await api.importDICOM(filePath1, studyInfo.studyId),
			await api.importDICOM(filePath2, studyInfo.studyId),
			await api.importDICOM(filePath3, studyInfo.studyId1),
		]);

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();

		// Open the Image Viewer and wait for the page to load
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName);
		await page.waitForTimeout(2000);
	});

	test('Reparent series, Merge and Unmerge Studies', async () => {
		const poManager = new POManager(page);
		// Expand Study Explorer
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);
		// Expand prior study
		await poManager.imageViewer.studyAccordion(1).click();
		await page.waitForTimeout(1000);
		// Verify the number of series in current and prior study
		const currentStudySeries = page.locator('[role="region"]').nth(0).locator('[data-testid="series"]');
		const priorStudySeries = page.locator('[role="region"]').nth(1).locator('[data-testid="series"]');
		await expect(currentStudySeries).toHaveCount(3);
		await expect(priorStudySeries).toHaveCount(1);
		//Drag and drop the first series from current study to prior study
		const dragElement = await poManager.imageViewer.studyExplorerSeriesStudy(0);
		const dropElement = await poManager.imageViewer.studyExplorerDroppableArea(1);
		await expect(dragElement).toBeVisible();
		await expect(dropElement).toBeVisible();
		await Promise.all([
			// Perform drag and drop
			dragElement.dragTo(dropElement),
			// Validate API call success
			poManager.apiWaitUtils.waitForAPI(`/reparent/`, 'POST'),
		]);		
		await page.waitForTimeout(6000);
		await expect(currentStudySeries).toHaveCount(2);
	    await expect(priorStudySeries).toHaveCount(2);
		// Merge studies
		await poManager.imageViewer.mergeStudy(poManager);
		await expect(currentStudySeries).toHaveCount(4);
		await expect(poManager.imageViewer.studyAccordion('1')).not.toBeVisible();
		await page.waitForTimeout(2000);		
		// Unmerge studies
		await page.getByTestId('ImageViewerLayoutWrapper').getByTestId('collapse-button').hover();
		await page.route('**/dicomweb/unmergeById/*', async route => route.continue());
		await page.getByTestId('unmerge-button').click();
		//verify series count after unmerge
		await poManager.apiWaitUtils.waitForAPI('/dicomweb/unmergeById/', 'POST');
		await page.waitForTimeout(1000);
		await expect(currentStudySeries).toHaveCount(2);
		await poManager.imageViewer.studyAccordion('1').click();
		await expect(priorStudySeries).toHaveCount(2);	
	});

	test('Delete series, Merge and Unmerge Studies', async () => {
		const poManager = new POManager(page);
		// Expand Study Explorer
		await poManager.imageViewer.openLeftSection();
		await page.waitForTimeout(1000);
		// Expand prior study
		await poManager.imageViewer.studyAccordion(1).click();
		await page.waitForTimeout(1000);
		// Verify the number of series in current and prior study
		const currentStudySeries = page.locator('[role="region"]').nth(0).locator('[data-testid="series"]');
		const priorStudySeries = page.locator('[role="region"]').nth(1).locator('[data-testid="series"]');
		await expect(currentStudySeries).toHaveCount(3);
		await expect(priorStudySeries).toHaveCount(1);
		//Delete the first series from current study to prior study
		await poManager.imageViewer.seriesStudiesExplorerDeleteSeriesBtn().dispatchEvent('mousedown');
		await page.waitForTimeout(6000);
		await poManager.imageViewer.seriesStudiesExplorerDeleteSeriesBtn().dispatchEvent('mouseup');
		await poManager.apiWaitUtils.waitForAPI(`/study/`, 'DELETE');
		// Verify series count after deletion
		await expect(currentStudySeries).toHaveCount(2);
	    await expect(priorStudySeries).toHaveCount(1);
		// Merge studies
		await poManager.imageViewer.mergeStudy(poManager);
		await expect(currentStudySeries).toHaveCount(3);
		await expect(poManager.imageViewer.studyAccordion('1')).not.toBeVisible();
		await page.waitForTimeout(2000);
		// Unmerge studies
		await page.getByTestId('ImageViewerLayoutWrapper').getByTestId('collapse-button').hover();
		await page.route('**/dicomweb/unmergeById/*', async route => route.continue());
		await page.getByTestId('unmerge-button').click();
		//verify series count after unmerge
		await poManager.apiWaitUtils.waitForAPI('/dicomweb/unmergeById/', 'POST');
		await page.waitForTimeout(1000);
		await expect(currentStudySeries).toHaveCount(2);
		await poManager.imageViewer.studyAccordion('1').click();
		await expect(priorStudySeries).toHaveCount(1);	
	});	
});
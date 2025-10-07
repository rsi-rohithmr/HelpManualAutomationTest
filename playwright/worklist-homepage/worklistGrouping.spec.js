const { test, expect, request, chromium } = require('@playwright/test');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
import { TIMEOUT_IN_MSEC5 } from '../POM/timeouts';

test.describe('Worklist Grouping', () => {
	let page;
	let browser;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;

	test.beforeEach(async () => {
		browser = await chromium.launch();
		page = await browser.newPage();
        // Turn off FF before testing for selector
        await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
            const response = await route.fetch();
            const bodyJson = await response.json(); // Parse response JSON
            if (bodyJson.features && bodyJson.features['maven-2686-new-worklist-toggle']) {
                bodyJson.features['maven-2686-new-worklist-toggle'].variationName = 'Variation On';
                bodyJson.features['maven-2686-new-worklist-toggle'].variationKey = 'variation-on';
            }
 
            if (bodyJson.variables && bodyJson.variables['maven-2686-new-worklist-toggle']) {
                bodyJson.variables['maven-2686-new-worklist-toggle'].value = true;
            }

			if (bodyJson.features && bodyJson.features['maven-worklist-grouping']) {
                bodyJson.features['maven-worklist-grouping'].variationName = 'Variation On';
                bodyJson.features['maven-worklist-grouping'].variationKey = 'variation-on';
            }
 
            if (bodyJson.variables && bodyJson.variables['maven-worklist-grouping']) {
                bodyJson.variables['maven-worklist-grouping'].value = true;
            }

			if (bodyJson.features && bodyJson.features['maven-2697-worklist-grouping-twilio-sync']) {
                bodyJson.features['maven-2697-worklist-grouping-twilio-sync'].variationName = 'Variation On';
                bodyJson.features['maven-2697-worklist-grouping-twilio-sync'].variationKey = 'variation-on';
            }
 
            if (bodyJson.variables && bodyJson.variables['maven-2697-worklist-grouping-twilio-sync']) {
                bodyJson.variables['maven-2697-worklist-grouping-twilio-sync'].value = true;
            }
 
            // Fulfill request with modified data
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                body: JSON.stringify(bodyJson),
            });
        });
 
        const poManager = new POManager(page);
        await poManager.loginPage.loginOmegaAI();

		await expect(page.getByText('Try New Worklist')).toBeVisible();
 
        await page.getByText('Try New Worklist').click();
 
        await expect(page.getByText('Try New Worklist')).toBeChecked();
		await expect(page.getByText('Column Grouping')).toBeVisible();
    });

	test.afterEach(async () => {
		if (page) await page.close();
		if (browser) await browser.close();
	});

	test('Should be able to group studies by managing organization', async () => {
		let studyInfo;
		const tokenObj = {};

		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		const tokenResult = await api.getTokenAndSessionId();
		tokenObj.accessToken = tokenResult?.accessToken;
		tokenObj.sessionID = tokenResult?.sessionID;
 
		// Create a study
		await api.postStudy().then(result => {
			studyInfo = result;
		});
		const poManager = new POManager(page, apiContext);
		// Filter studies by patient name and managing organization
		await poManager.homePage.filterStudiesBySingleColumn('Patient Name', studyInfo?.patientName);
		await poManager.homePage.filterStudiesBySuggestionColumn('Managing Organization', managingOrgName);

		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();

		// Drag and drop the managing organization column to the column grouping
		const header = await page.locator('[data-cy="Managing Organization_filter"]');
		const columnGrouping = await page.locator('[data-testid="worklist-grouping-dropable"]');

		await expect(header).toBeVisible();
		await expect(columnGrouping).toBeVisible();

		// Get the bounding box of the columnGrouping to calculate left side position
		const columnGroupingBox = await columnGrouping.boundingBox();
		
		// Perform drag and drop to the left side of the grouping area
		await header.dragTo(columnGrouping, {
			targetPosition: { 
				x: 20, // 20px from the left edge
				y: columnGroupingBox.height / 2  // Center vertically
			}
		});

		// Expand the group
		const expandRowBtn = await page.locator('[data-testid="expand-row-0"]');
		await expect(expandRowBtn).toBeVisible();
		await expandRowBtn.click();

		// Verify the group is expanded and show the studies
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();

		// Add Study Status column
		const studyStatusColumn = await page.locator('[data-cy="Study Status_filter"]');
		await expect(studyStatusColumn).toBeVisible();
		
		// Get updated bounding box for the second drop operation
		const studyStatusDropBox = await columnGrouping.boundingBox();
		
		// Perform drag and drop to the left side of the grouping area
		await studyStatusColumn.dragTo(columnGrouping, {
			targetPosition: { 
				x: 20, // 20px from the left edge
				y: studyStatusDropBox.height / 2  // Center vertically
			}
		});
		
		// Wait for LinearProgress to appear
		let linearProgress = page.locator('.MuiLinearProgress-root');
		await expect(linearProgress).toBeVisible({ timeout: 5000 });
		
		// Wait for LinearProgress to disappear (loading finished)
		await expect(linearProgress).toBeHidden({ timeout: 30000 });
		
		// Verify the grouping is applied correctly after loading
		await expect(page.locator('[data-testid="expand-row-0"]')).toBeVisible();

		const expandRowBtn0 = await page.locator('[data-testid="expand-row-0"]');
		await expect(expandRowBtn0).toBeVisible();
		await expandRowBtn0.click();

		const expandRowBtn00 = await page.locator('[data-testid="expand-row-0.0"]');
		await expect(expandRowBtn00).toBeVisible();
		await expandRowBtn00.click();

		// Verify the group is expanded and show the studies
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${studyInfo?.patientName}$`, 'g'))
				.first()
		).toBeVisible();

		// Worklist sync when updating patient name - patient update
		const newPatientName = `${studyInfo?.patientName} UPDATED`;
		const patientRes = await poManager.common.getResourceById('patient', studyInfo?.patientId, tokenObj);
		patientRes.name[0].text = newPatientName;
		patientRes.name[0].family = newPatientName;

		await poManager.common.updateResourceById('patient', patientRes?.id, patientRes, tokenObj);
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${newPatientName}$`, 'g'), { timeout: TIMEOUT_IN_MSEC5 })
				.first()
		).toBeVisible({ timeout: TIMEOUT_IN_MSEC5 });

		// Remove the Study Status column from the column grouping
		const lastCancelIcon = page.locator('[data-testid="cancel-icon-grouping"]').last();
		await expect(lastCancelIcon).toBeVisible();
		await lastCancelIcon.click();
		linearProgress = page.locator('.MuiLinearProgress-root');
		await expect(linearProgress).toBeVisible({ timeout: 5000 });
		
		// Wait for LinearProgress to disappear (loading finished)
		await expect(linearProgress).toBeHidden({ timeout: 30000 });

		// Verify the group is expanded and show the studies
		const expandRowBtn3 = await page.locator('[data-testid="expand-row-0"]');
		await expect(expandRowBtn3).toBeVisible();
		await expandRowBtn3.click();

		// Verify the group is expanded and show the studies
		await expect(
			poManager.homePage
				.worklistTableRows()
				.getByText(new RegExp(`^${newPatientName}$`, 'g'))
				.first()
		).toBeVisible();

		// Click to clear all the grouping
		poManager.homePage.clearFilterCapsule().click();
		// Wait for LinearProgress to disappear (loading finished)
		await expect(linearProgress).toBeVisible({ timeout: 5000 });
		await expect(linearProgress).toBeHidden({ timeout: 30000 });
		// Verify the grouping is cleared
		await expect(page.locator('[data-testid="expand-row-0"]')).not.toBeVisible();
	});
});


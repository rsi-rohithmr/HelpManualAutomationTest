const { test, expect, request, chromium} = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const path = require('path');
const playwrightConfig = require('../../playwright.config');
const { TIMEOUT_IN_MSEC3 } = require('../POM/timeouts');

test.describe('TechnologistForm', () => {
	let studyInfo;
	const managingOrgId = playwrightConfig.managingOrg.organizationId;
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	const baseUrl = playwrightConfig.baseURL;
	const formIds = [];
	let browser;
	let page;
	let poManager;
	let apiContext;
	let api;
	let tokenObj = {};

	test.beforeAll(async () => {
		apiContext = await request.newContext();
		api = new postStudyNGetToken(apiContext);
		tokenObj = await api.getTokenAndSessionId();
	});

	test.beforeEach('login and upload technologist form', async ({ }) => {
		browser = await chromium.launch();
		page = await browser.newPage();

		// Turn off FF before testing for selector
        await page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
            const response = await route.fetch();
            const bodyJson = await response.json(); // Parse response JSON
			if (bodyJson.features && bodyJson.features['maven-1720-techform-mandatory']) {
				bodyJson.features['maven-1720-techform-mandatory'].variationName = 'Variation On';
				bodyJson.features['maven-1720-techform-mandatory'].variationKey = 'variation-on';
			}

			if (bodyJson.variables && bodyJson.variables['maven-1720-techform-mandatory']) {
				bodyJson.variables['maven-1720-techform-mandatory'].value = true;
			}

            // Fulfill request with modified data
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                body: JSON.stringify(bodyJson),
            });
        });

		poManager = new POManager(page);
		await poManager.loginPage.loginOmegaAI();
				
		await page.goto(`${baseUrl}organization/${managingOrgId}/blume-form`);

		const addBox = await page.getByTestId('add-box', { timeout: TIMEOUT_IN_MSEC3 });

		await expect(addBox).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });

		// wait to load the all forms
		await page.waitForTimeout(10000);

		await page.getByTestId('add-box').hover();

		console.log('Upload TechnologistTestForm.pdf to blume form');
		await page.getByTestId('FileUploadIcon').click();

		await page.getByTestId('upload-pdf-input').setInputFiles('./playwright/TestData/TechnologistTestForm.pdf');

		const formResponse = await poManager.apiWaitUtils.waitForAPI('fhir/Form', 'POST')
		if(formResponse?.id) {
			formIds.push(formResponse?.id);
		}
		// drag bookmark to form
		console.log('Open bookmark and drag Accession # to form last name field');
		const bookmark = page.getByText('Bookmark Selector').count();

		if (bookmark === 0) {
			await page.getByText('Bookmark', { exact: true }).click();
			await expect(page.getByText('Bookmark Selector')).toBeVisible();
		}

		await page.waitForTimeout(10000);

		console.log('Make sure there is Last name field in the pdf form');
		await expect(page.frameLocator('iFrame').getByTitle('Last Name')).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });
		await expect(page.frameLocator('iFrame').getByText('@{{accessionNumber}}')).toHaveCount(0);

		console.log('Start dragging bookmark to form');
		await page
			.getByRole('listitem')
			.filter({ hasText: 'Accession #Accession #' })
			.getByTestId('bookmark-item-label')
			.dragTo(page.frameLocator('iFrame').getByTitle('Last Name'));

		expect(page.frameLocator('iFrame').getByText('@{{accessionNumber}}').count()).toBeTruthy();

		await page.getByText('Publish').click();
		await page.locator('input#formType').click();

		await page.getByText('Technologist Form').click();

		// Check required view images
		const requiredCheckbox = page.locator('input[type="checkbox"]');
		if(requiredCheckbox.isVisible().catch(() => false)) {
			await requiredCheckbox.click();
		}

		await page.locator('input#codeType').click();

		await page.getByRole('option', { name: 'Modality' }).click();

		await page.locator('input#select-code').click();

		await page.getByText('XC-External-camera Photography').click();

		await page.getByTestId('publish-form').click();

		const publishSuccessMsg = page.getByText('The Form has been published');

		await expect(publishSuccessMsg).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });

		await page.goto(`${baseUrl}home`);

		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log('Post study result is', result);
			studyInfo = result;
		});

		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/XC.dcm'));
		await api.importDICOM(filePath, studyInfo.studyId);
	});

	test.afterAll(async () => {
		console.log('Deleting form');
		formIds.forEach(async formId => {
			const deleteUrl = playwrightConfig.baseURL + `fhir/Form/${formId}`;
			await apiContext.delete(deleteUrl, {
				method: 'DELETE',
				headers: {
					Authorization: 'Bearer ' + tokenObj?.accessToken,
					SessionID: tokenObj?.sessionId,
				},
			});
		});
	});

	test('Should see technologist form when opening image viewer', async ({ }, testInfo) => {
		// Double click to open the image viewer and wait for the page to load.
		await poManager.imageViewer.openImageViewer(studyInfo.patientName, managingOrgName, undefined, true);

		// submit button should be fully visibl
		await page.waitForSelector('#submitFormBtn', { state: 'visible', timeout: 20000 });

		const locator = page.locator('#submitFormBtn');

		await expect(locator).toBeInViewport({ ratio: 1 });

		await page.waitForTimeout(5000);

		expect(page.frameLocator('iFrame').getByText(studyInfo.accessionNum).count()).toBeTruthy();

		await locator.click({ force: true });
		// Check tech form display in new area
		await page.getByTestId('ImageViewerSplitButton').getByRole('button').click();
		await page.waitForTimeout(5000);
		await expect(poManager.imageViewer.DocumentSpiltView()).toBeVisible({ timeout: TIMEOUT_IN_MSEC3 });

		// Open tech form
		await poManager.imageViewer.openTechFormInSplitView();
		await page.waitForTimeout(5000);

		// Edit tech form
		await expect(poManager.imageViewer.editTechFormBtn()).toBeVisible();
		await poManager.imageViewer.editTechFormBtn().click({ force: true });
		await expect(locator).toBeInViewport({ ratio: 1 });
		await locator.click({ force: true });
	});
});

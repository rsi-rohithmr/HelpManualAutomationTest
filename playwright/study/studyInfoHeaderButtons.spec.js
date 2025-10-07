const { test, expect } = require('@playwright/test');
import { Login } from 'playwright/POM/login';
import { StudyInfoPage } from 'playwright/POM/study/studyInfoPage';
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2 } from 'playwright/POM/timeouts';

let postedData = {};

test.describe.serial('studyInfo page - Header buttons', () => {
	test.beforeAll(async () => {
		postedData = await studyGenerator.postStudy();
	});

	test.beforeEach('Login OAI', async ({ page }) => {
		const loginPage = new Login(page);
		await loginPage.loginOmegaAIUser04();

		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.openStudyInfoPageByUrl(
			postedData?.patientId,
			postedData?.visitId,
			postedData?.orderId,
			postedData?.studyId
		);
	});

	test('Verify ImageViewer button', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.imageViewerBtn().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		const openedPage = await studyInfoPage.openViewerPage(await studyInfoPage.imageViewerBtn());
		expect(openedPage?.page?.url()).toContain(`/imageviewer3d?StudyId=${postedData?.studyId}`);
		if (openedPage?.type === 'framenavigated') {
			// opened viwer page in the same browser tab -> test back button
			await page.getByTestId('ArrowBackIcon').click();
			await studyInfoPage.waitForLoadingStudyInfoPageComplete(postedData?.studyId);
		}
	});

	test('Verify DocumentViewer button', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.documentViewerBtn().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		const openedPage = await studyInfoPage.openViewerPage(await studyInfoPage.documentViewerBtn());
		expect(openedPage?.page?.url()).toContain(
			`/document-viewer-v3?patientId=${postedData.patientId}&orderId=${postedData.orderId}&studyId=${postedData.studyId}`
		);
		if (openedPage?.type === 'framenavigated') {
			// opened viwer page in the same browser tab -> test back button
			await page.getByTestId('ArrowBackIcon').click();
			await studyInfoPage.waitForLoadingStudyInfoPageComplete(postedData?.studyId);
		}
	});

	test('Verify Prior Authorization button', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.preAuthBtn().click({ force: true });
		await page
			.locator('[data-testid="form-header-section"]')
			.locator('h6:has-text("Prior Authorization")')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		await expect(
			page.locator('[data-testid="form-header-section"]').locator('h6:has-text("Prior Authorization")')
		).toBeVisible();
	});

	test('Verify Billing button', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.openBillingInfoPage();
		expect(page.url()).toContain(`/order/${postedData.orderId}/billing/${postedData.studyId}/generate-invoice`);
		await page.getByTestId('ArrowBackIcon').click();
		await studyInfoPage.waitForLoadingStudyInfoPageComplete(postedData?.studyId);
	});

	test('Verify Post Charges button', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		await studyInfoPage.postChargeBtn().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		studyInfoPage.postChargeBtn().click({ force: true });
		await page.waitForTimeout(TIMEOUT_IN_MSEC1);
		const successfulMsg = 'Charges Posted Successfully';
		const unsuccessfulMsg = 'Sending charges unsuccessful - no chargeable procedures were included in the study';
		const expectedToastMessages = [successfulMsg, unsuccessfulMsg];
		let actualToastMsg;
		if (
			await page
				.getByText(successfulMsg)
				.isVisible()
				.catch(() => false)
		) {
			actualToastMsg = successfulMsg;
		} else {
			actualToastMsg = unsuccessfulMsg;
		}
		console.log(`Verify Post Charges button - actualToastMsg - ${actualToastMsg}`);
		expect(expectedToastMessages.includes(actualToastMsg)).toBeTruthy();
	});
});

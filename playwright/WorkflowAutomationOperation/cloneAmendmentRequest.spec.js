const { test, request, expect, chromium } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const ACTION = 'Amendment Request';
test.describe.serial('Clone Amendment Request', { tags: ['@sf-cloneamendmentrequest'] }, () => {
	const managingrganizationId = playwrightConfig.managingOrg.organizationId;
	let browser;
	let page;
	test.beforeAll(async () => {
		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);
		const apiContext = await request.newContext();
		const apiRequests = new APIRequests(apiContext);
		await poManager.loginPage.loginOmegaAI();
		await poManager.workflowAutomationPage.clearWorkflowAutomation(
			apiRequests,
			ACTION,
			'Operation',
			managingrganizationId
		);
		await poManager.workflowAutomationPage.openWorkflowAutomationPageByUrl(managingrganizationId);
	});

	test('Test Clone Amendment Request', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.copyDefaultWorkflowAutomation(1);
		await expect(poManager.workflowAutomationPage.backBtn()).toBeDisabled();
		await expect(poManager.workflowAutomationPage.defaultLabelName()).not.toBeVisible();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('Amendment Request(1)');
		await expect(poManager.workflowAutomationPage.editWorkflowNameBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.undoBtn()).toBeDisabled();
		await expect(poManager.workflowAutomationPage.redoBtn()).toBeDisabled();
		await expect(poManager.workflowAutomationPage.saveBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.cancelBtn()).toBeVisible();
		const warningErrorLbl = await poManager.workflowAutomationPage.warningErrorLbl().innerText();
		expect(warningErrorLbl.replace(/\s+/g, ' ').trim()).toBe(
			'WARNING The changes made in the workflow have not been saved. Please click the "Save" icon to save changes or click "Cancel" to discard them.'
		);
	});

	test('Test Cancel Clone Amendment Request', async () => {
		const poManager = new POManager(page);
		await page.route('**/fhir/WorkflowAutomation?*', route => route.continue());
		await poManager.workflowAutomationPage.cancelBtn().click();
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		expect(workflowNames).not.toContain('Amendment Request(1)');
		const popupMessage = await poManager.workflowAutomationPage.popupMessage().innerText();
		expect(popupMessage).toBe('The changes on the workflow "Amendment Request(1)" has been discarded');
	});

	test('Test Update Clone Amendment Request', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.copyDefaultWorkflowAutomation(1);
		await poManager.workflowAutomationPage.editWorkflowNameBtn().click();
		await poManager.workflowAutomationPage.editWorkflowNameTxt().fill('Clone Amendment Request');
		await poManager.workflowAutomationPage.confirmEditBtn().click();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('Clone Amendment Request');
	});

	test('Test Save Clone Amendment Request', async () => {
		const poManager = new POManager(page);

		await poManager.workflowAutomationPage.saveBtn().click();
		await expect(poManager.workflowAutomationPage.backBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.defaultLabelName()).not.toBeVisible();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('Clone Amendment Request');
		await expect(poManager.workflowAutomationPage.editWorkflowNameBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.undoBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.redoBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.saveBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.cancelBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.warningErrorLbl()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.editWorkflowBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.menuBtn()).toBeVisible();
	});

	test('Test Clone Amendment Request Editor', async () => {
		const poManager = new POManager(page);

		const triggerText = await poManager.workflowAutomationPage.triggerWhenOperationIsAmendmentRequest().innerText();
		expect(triggerText.replace(/\s+/g, ' ').trim()).toBe('Trigger When Operation is Amendment Request');
		const conditionText = await poManager.workflowAutomationPage.conditionStudyStatusisSIGNED().innerText();
		expect(conditionText.replace(/\s+/g, ' ').trim()).toBe('Condition Condition Study Status is SIGNED');
		const notificationText = await poManager.workflowAutomationPage
			.actionSendNotificationtoAssignedReadingPhysician()
			.innerText();
		expect(notificationText.trim().replace(/\s+/g, ' ').trim()).toBe(
			`Action Send Notification to Assigned Reading Physician @Patient Name 's study has an amendment request. 48/9999`
		);
		const emailText = await poManager.workflowAutomationPage
			.actionSendEmailtoAssignedReadingPhysician()
			.innerText();
		expect(emailText.replace(/\s+/g, ' ').trim()).toBe(
			`Action Send Email to Assigned Reading Physician @Patient Name 's study has an amendment request. 48/9999`
		);
	});

	test('Test Card Clone Amendment Request', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.backBtn().click({ force: true });
		await page.waitForTimeout(5000);
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		const stepsLabel = await poManager.workflowAutomationPage.stepsLabel().allInnerTexts();
		for (let i = 0; i < workflowNames.length; i++) {
			if (workflowNames[i].includes('Clone Amendment Request')) {
				expect(await stepsLabel[i].replace(/\s+/g, ' ').trim()).toContain('Clone Amendment Request 6 steps');
				break;
			}
		}
	});

	test('Test Delete Clone Amendment Request', async () => {
		const poManager = new POManager(page);
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		for (let i = 0; i < workflowNames.length; i++) {
			if (workflowNames[i].includes('Clone Amendment Request')) {
				await poManager.workflowAutomationPage
					.menuBtn()
					.nth(i - 1)
					.click();
				break;
			}
		}
		await poManager.workflowAutomationPage.deleteOption().click({ force: true });
		const updatedWorkflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		expect(updatedWorkflowNames).not.toContain('Clone Amendment Request');
	});
});

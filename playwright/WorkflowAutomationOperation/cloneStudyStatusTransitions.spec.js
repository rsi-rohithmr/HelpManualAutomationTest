const { test, request, expect, chromium } = require('@playwright/test');
const { APIRequests } = require('../APIutils/APIRequests');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const ACTION = 'Study Sign Off';
test.describe.serial('Clone Study Status Transition', { tags: ['@sf-clonestudystatustransition'] }, () => {
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

	test('Test Clone Study Status Transition', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.copyDefaultWorkflowAutomation(0);
		await expect(poManager.workflowAutomationPage.backBtn()).toBeDisabled();
		await expect(poManager.workflowAutomationPage.defaultLabelName()).not.toBeVisible();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('OAI Study Status Transitions(1)');
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

	test('Test Cancel Clone Study Status Transitions', async () => {
		const poManager = new POManager(page);
		await page.route('**/fhir/WorkflowAutomation?*', route => route.continue());
		await poManager.workflowAutomationPage.cancelBtn().click();
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		expect(workflowNames).not.toContain('OAI Study Status Transitions(1)');
		const popupMessage = await poManager.workflowAutomationPage.popupMessage().innerText();
		expect(popupMessage).toBe('The changes on the workflow "OAI Study Status Transitions(1)" has been discarded');
	});

	test('Test Update Clone Study Status Transitions', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.copyDefaultWorkflowAutomation(0);
		await poManager.workflowAutomationPage.editWorkflowNameBtn().click();
		await poManager.workflowAutomationPage.editWorkflowNameTxt().fill('Clone OAI Study Status Transitions');
		await poManager.workflowAutomationPage.confirmEditBtn().click();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('Clone OAI Study Status Transitions');
	});

	test('Test Save Clone Study Status Transitions', async () => {
		const poManager = new POManager(page);

		await poManager.workflowAutomationPage.saveBtn().click();
		await expect(poManager.workflowAutomationPage.backBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.defaultLabelName()).not.toBeVisible();
		const workflowNameLbl = await poManager.workflowAutomationPage.workflowNameLbl().nth(0).innerText();
		expect(workflowNameLbl).toBe('Clone OAI Study Status Transitions');
		await expect(poManager.workflowAutomationPage.editWorkflowNameBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.undoBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.redoBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.saveBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.cancelBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.warningErrorLbl()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.editWorkflowBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.menuBtn()).toBeVisible();
	});

	test('Test Clone Study Status Transitions Editor', async () => {
		const poManager = new POManager(page);

		const triggerText = await poManager.workflowAutomationPage.triggerWhenOperationIsDone().innerText();
		expect(triggerText.replace(/\s+/g, ' ').trim()).toBe('Trigger When Operation is Done');
		const conditionReadingPhysician = await poManager.workflowAutomationPage
			.conditionReadingPhysician()
			.innerText();
		expect(conditionReadingPhysician.replace(/\s+/g, ' ').trim()).toBe(
			'Condition Condition User Reading Physician | Performing Physician'
		);
		const actionStudyReportSignOff = await poManager.workflowAutomationPage.actionStudyReportSignOff().innerText();
		expect(actionStudyReportSignOff.trim().replace(/\s+/g, ' ').trim()).toBe(`Action Study Report Sign Off`);
		const conditionPerformingTechnologist = await poManager.workflowAutomationPage
			.conditionPerformingTechnologist()
			.innerText();
		expect(conditionPerformingTechnologist.replace(/\s+/g, ' ').trim()).toBe(
			'Condition Condition User Performing Technologist'
		);
		const conditionStudyStatusisCompleted = await poManager.workflowAutomationPage
			.conditionStudyStatusisCompletedClone()
			.innerText();
		expect(conditionStudyStatusisCompleted.replace(/\s+/g, ' ').trim()).toBe(
			'Condition Condition Study Status is COMPLETED'
		);
		const actionChangeStudyStatustoVerified = await poManager.workflowAutomationPage
			.actionChangeStudyStatustoVerified()
			.innerText();
		expect(actionChangeStudyStatustoVerified.replace(/\s+/g, ' ').trim()).toBe(
			`Action Change Study Status to VERIFIED`
		);
	});

	test('Test Card Clone Study Status Transitions', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.backBtn().click({ force: true });
		await page.waitForTimeout(5000);
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		const stepsLabel = await poManager.workflowAutomationPage.stepsLabel().allInnerTexts();
		for (let i = 0; i < workflowNames.length; i++) {
			if (workflowNames[i].includes('Clone OAI Study Status Transitions')) {
				expect(await stepsLabel[i].replace(/\s+/g, ' ').trim()).toContain(
					'Clone OAI Study Status Transitions 8 steps'
				);
				break;
			}
		}
	});

	test('Test Delete Clone Study Status Transitions', async () => {
		const poManager = new POManager(page);
		const workflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		for (let i = 0; i < workflowNames.length; i++) {
			if (workflowNames[i].includes('Clone OAI Study Status Transitions')) {
				await poManager.workflowAutomationPage
					.menuBtn()
					.nth(i - 1)
					.click();
				break;
			}
		}
		await poManager.workflowAutomationPage.deleteOption().click({ force: true });
		const updatedWorkflowNames = await poManager.workflowAutomationPage.workflowName().allInnerTexts();
		expect(updatedWorkflowNames).not.toContain('Clone OAI Study Status Transitions');
	});
});

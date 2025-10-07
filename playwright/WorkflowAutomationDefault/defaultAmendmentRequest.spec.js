const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');
const faker = require('community-faker');
const fs = require('fs');
const path = require('path');

test.describe.serial('Default Amendment Request Tests', { tags: ['@sf-defaultamendmentrequest'] }, () => {
	const managingOrgName = playwrightConfig.managingOrg.organizationName;
	let studyInfo = {};
	let name = '';
	let browser;
	let page;
	let userdetails;
	test.beforeAll(async () => {
		browser = await chromium.launch();
		page = await browser.newPage();
		const poManager = new POManager(page);

		const apiContext = await request.newContext();
		const api = new postStudyNGetToken(apiContext);

		await api.postStudy().then(result => {
			console.log(result);
			studyInfo = result;
		});

		await api.getUserDetails().then(result => {
			// console.log(result)
			userdetails = result;
			console.log(userdetails.name[0].text);
			name = userdetails.name[0].text;
		});

		await poManager.loginPage.loginOmegaAI();
		await poManager.workflowAutomationPage.openWorkflowAutomationPage(managingOrgName);
	});

	test('Test Amendment Request Card', async () => {
		const poManager = new POManager(page);
		await expect(poManager.workflowAutomationPage.defaultLabel().nth(1)).toHaveText('DEFAULT');
		await expect(poManager.workflowAutomationPage.workflowName().nth(1)).toHaveText('Amendment Request');
		await expect(poManager.workflowAutomationPage.stepsLabel().nth(1)).toContainText('6 steps');

		// Get all workflow cards
		const workflowCards = await page.locator('[data-testid="workflow-card"]');

		// Check if any workflow card contains 'Amendment'
		let amendmentFound = false;

		for (let i = 0; i < (await workflowCards.count()); i++) {
			const workflowCard = workflowCards.nth(i);

			// Check if this card contains 'Amendment'
			const cardText = await workflowCard.innerText();
			if (cardText.includes('Amendment Request')) {
				amendmentFound = true;

				// Check if the corresponding change-enable element has the correct attribute
				const changeEnable = workflowCard.locator('[data-testid="change-enable"]');
				await expect(changeEnable).toHaveAttribute('aria-disabled', 'true');
				break; // No need to continue once 'Amendment' is found
			}
		}

		// If no 'Amendment' was found, fail the test
		if (!amendmentFound) {
			throw new Error('No workflow card contains Amendment text');
		}
	});

	test('Test Amendment Request Details', async () => {
		const poManager = new POManager(page);
		await poManager.workflowAutomationPage.workflowName().nth(1).click({ force: true });
		await expect(poManager.workflowAutomationPage.backBtn()).toBeVisible();
		await expect(poManager.workflowAutomationPage.defaultLabelName()).toHaveText('DEFAULT');
		await expect(poManager.workflowAutomationPage.workflowNameLbl().nth(0)).toHaveText('Amendment Request');
		await expect(poManager.workflowAutomationPage.changeEnableBtn()).toHaveAttribute('aria-disabled', 'true');
		await expect(poManager.workflowAutomationPage.lockIcon()).toBeVisible();
		await expect(poManager.workflowAutomationPage.readOnlyLabel()).toHaveText('Read only');
		await expect(poManager.workflowAutomationPage.editWorkflowNameBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.menuBtn()).not.toBeVisible();
		await expect(poManager.workflowAutomationPage.editWorkflowBtn()).not.toBeVisible();
	});

	test('Test Amendment Request Editor', async () => {
		const poManager = new POManager(page);
		await expect(poManager.workflowAutomationPage.triggerWhenOperationIsAmendmentRequest()).toHaveText(
			'TriggerWhenOperationisAmendment Request'
		);
		await page.waitForTimeout(5000);
		await expect(poManager.workflowAutomationPage.conditionStudyStatusisSIGNED()).toHaveText(
			' Condition ConditionStudyStatusisSIGNED'
		);

		await expect(poManager.workflowAutomationPage.actionSendNotificationtoAssignedReadingPhysician()).toHaveText(
			`ActionSend Notification to Assigned Reading Physician@Patient Name 's study has an amendment request. @Patient Name 's study has an amendment request. 48/9999`
		);
		await expect(poManager.workflowAutomationPage.actionSendEmailtoAssignedReadingPhysician()).toHaveText(
			`ActionSend Email to Assigned Reading Physician@Patient Name 's study has an amendment request. @Patient Name 's study has an amendment request. 48/9999`
		);
	});

	test('Test Amendment Report', async () => {
		const poManager = new POManager(page);
		const reportTxt = 'Test report final';
		await page.route('**/fhir/DiagnosticReport/*', route => route.continue());

		await poManager.documentViewer.openHomePage();
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName);

		await poManager.documentViewer.addDiagnosticReportForNewEditor(reportTxt, false);
		console.log(await poManager.documentViewer.getElementCount('[data-code="signature"]'));
		await poManager.documentViewer.signDiagnosticReport();

		await page.route('**/DiagnosticReport/**/ReportContent?*', route => route.continue());
		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.apiWaitUtils.waitForAPI('ReportContent', 'GET');
		await poManager.documentViewer.finalReportCardValidation(name, managingOrgName, reportTxt);

		await poManager.documentViewer.openHomePage();
		await page.locator('[id="studyStatusText"]').nth(0).getByText('SIGNED').waitFor({ state: 'visible' });
		await expect(page.locator('[id="studyStatusText"]').nth(0)).toHaveText('SIGNED');

		await poManager.documentViewer.openDocumentViewer(studyInfo.patientName, managingOrgName, true);
		await poManager.documentViewer.amendReportCheck();
	});

	test('Test Study Status Change After Amendment Request', async () => {
		const poManager = new POManager(page);
		await poManager.documentViewer.openHomePage();
		await page.locator('[id="studyStatusText"]').nth(0).getByText('TO BE AMENDED').waitFor({ state: 'visible' });
		await expect(page.locator('[id="studyStatusText"]').nth(0)).toHaveText('TO BE AMENDED');
	});
});

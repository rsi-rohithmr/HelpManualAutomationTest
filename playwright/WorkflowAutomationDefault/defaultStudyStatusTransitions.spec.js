const { test, request, expect, chromium } = require('@playwright/test');
const { postStudyNGetToken } = require('../APIutils/postStudyNGetToken');
const { POManager } = require('../POM/POManager');
const playwrightConfig = require('../../playwright.config');

test.describe.serial(
	'Default OAI Study Status Transitions Tests',
	{ tags: ['@sf-defaultstudystatustransitions'] },
	() => {
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

		test('Test OAI Study Status Transitions Card', async () => {
			const poManager = new POManager(page);
			await expect(poManager.workflowAutomationPage.defaultLabel().nth(0)).toHaveText('DEFAULT');
			await expect(poManager.workflowAutomationPage.workflowName().nth(0)).toHaveText(
				'OAI Study Status Transitions'
			);
			await expect(poManager.workflowAutomationPage.stepsLabel().nth(0)).toContainText('8 steps');

			// Get all workflow cards
			const workflowCards = await page.locator('[data-testid="workflow-card"]');

			// Check if any workflow card contains 'OAI Study Status Transitions'
			let transitionsFound = false;

			for (let i = 0; i < (await workflowCards.count()); i++) {
				const workflowCard = workflowCards.nth(i);

				// Check if this card contains 'OAI Study Status Transitions'
				const cardText = await workflowCard.innerText();
				if (cardText.includes('OAI Study Status Transitions')) {
					transitionsFound = true;

					// Check if the corresponding change-enable element has the correct attribute
					const changeEnable = workflowCard.locator('[data-testid="change-enable"]');
					await expect(changeEnable).toHaveAttribute('aria-disabled', 'true');
					break; // No need to continue once 'OAI Study Status Transitions' is found
				}
			}

			// If no 'OAI Study Status Transitions' was found, fail the test
			if (!transitionsFound) {
				throw new Error('No workflow card contains Study Status Transitions text');
			}
		});

		test('Test OAI Study Status Transitions Details', async () => {
			const poManager = new POManager(page);
			await poManager.workflowAutomationPage.workflowName().nth(0).click({ force: true });
			await expect(poManager.workflowAutomationPage.backBtn()).toBeVisible();
			await expect(poManager.workflowAutomationPage.defaultLabelName()).toHaveText('DEFAULT');
			await expect(poManager.workflowAutomationPage.workflowNameLbl().nth(0)).toHaveText(
				'OAI Study Status Transitions'
			);
			await expect(poManager.workflowAutomationPage.changeEnableBtn()).toHaveAttribute('aria-disabled', 'true');
			await expect(poManager.workflowAutomationPage.lockIcon()).toBeVisible();
			await expect(poManager.workflowAutomationPage.readOnlyLabel()).toHaveText('Read only');
			await expect(poManager.workflowAutomationPage.editWorkflowNameBtn()).not.toBeVisible();
			await expect(poManager.workflowAutomationPage.menuBtn()).not.toBeVisible();
			await expect(poManager.workflowAutomationPage.editWorkflowBtn()).not.toBeVisible();
		});

		test('Test OAI Study Status Transitions Editor', async () => {
			const poManager = new POManager(page);
			await expect(poManager.workflowAutomationPage.triggerWhenOperationIsDone()).toHaveText(
				'TriggerWhenOperationisDone'
			);
			await page.waitForTimeout(5000);
			await expect(poManager.workflowAutomationPage.conditionReadingPhysician()).toHaveText(
				'Condition ConditionUserReading Physician | Performing Physician'
			);

			await expect(poManager.workflowAutomationPage.actionStudyReportSignOff()).toHaveText(
				'ActionStudy Report Sign Off'
			);
			await expect(poManager.workflowAutomationPage.conditionPerformingTechnologist()).toHaveText(
				'Condition ConditionUserPerforming Technologist'
			);
			await expect(poManager.workflowAutomationPage.conditionStudyStatusisCompleted()).toHaveText(
				'StudyStatusisCOMPLETED'
			);
			await expect(poManager.workflowAutomationPage.actionChangeStudyStatustoVerified()).toHaveText(
				'ActionChange StudyStatustoVERIFIED'
			);
		});

		test('Test Final Report', async () => {
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
		});

		test('Test Study Status Change After Signed Report', async () => {
			const poManager = new POManager(page);
			await poManager.documentViewer.openHomePage();
			await page.waitForTimeout(20000); // Wait for study status to change to SIGNED
			await expect(page.locator('[id="studyStatusText"]').nth(0)).toHaveText('SIGNED');
		});
	}
);

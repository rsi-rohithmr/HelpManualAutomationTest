import { OrganizationDetailPage } from './organizationDetailPage';
const { ApiWaitUtils } = require('./apiWaitUtils');
const playwrightConfig = require('../../playwright.config');
export class WorkflowAutomationPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	// Elements for WFA Cards View
	newWorkflowBtn() {
		return this.page.locator('[data-testid="AddIcon"]');
	}

	defaultLabel() {
		return this.page.locator('[data-cy="default-label"] span');
	}

	menuBtn() {
		return this.page.locator('[id="menu-button"]');
	}

	copyOption() {
		return this.page.locator('[data-cy="copy-option"]');
	}

	deleteOption() {
		return this.page.locator('[data-cy="delete-option"]');
	}

	workflowName() {
		return this.page.locator('[data-cy="workflow-name"]');
	}

	stepsLabel() {
		return this.page.locator('[data-cy="workflow-name"]').locator('..'); // Adjust for siblings selection
	}

	changeEnableBtn() {
		return this.page.locator('[data-testid="change-enable"]');
	}

	// Elements for WFA Details View
	lockIcon() {
		return this.page.locator('[data-testid="LockOutlinedIcon"]');
	}

	readOnlyLabel() {
		return this.page.locator('[data-testid="LockOutlinedIcon"]').locator('..').locator('span');
	}

	backBtn() {
		return this.page.locator('[data-cy="back-button"]');
	}

	defaultLabelName() {
		return this.page.locator('[data-cy="default-workflow"]');
	}

	editWorkflowNameBtn() {
		return this.page.locator('[data-cy="edit-wfa-name-button"]');
	}

	editWorkflowNameTxt() {
		return this.page.locator('[data-cy="name-field"]').locator('input');
	}

	confirmEditBtn() {
		return this.page.locator('[data-cy="confirm-edit"]');
	}

	cancelEditBtn() {
		return this.page.locator('[data-cy="cancel-edit"]');
	}

	workflowNameLbl() {
		return this.page.locator('[data-cy="workflow-name"]');
	}

	deleteWorkflowBtn() {
		return this.page.locator('[data-cy="delete-workflow"]');
	}

	editWorkflowBtn() {
		return this.page.locator('[data-cy="edit-button"]');
	}

	undoBtn() {
		return this.page.locator('[data-cy="undo-button"]');
	}

	redoBtn() {
		return this.page.locator('[data-cy="redo-button"]');
	}

	saveBtn() {
		return this.page.locator('[data-cy="save-button"]');
	}

	cancelBtn() {
		return this.page.locator('[data-cy="cancel-button"]');
	}

	warningErrorLbl() {
		return this.page.locator('[data-cy="warning-error"]');
	}

	popupMessage() {
		return this.page.locator('[id="notistack-snackbar"]');
	}

	//-- Default Trigger, Condition, Action Editor Elements
	triggerWhenOperationIsDone() {
		return this.page.locator('#a36f3a48-d2f1-b93b-2e84-c6a73bc95c98');
	}

	conditionReadingPhysician() {
		return this.page.locator('#dc0a2a10-2f28-524c-8e94-daba41282fce').first();
	}

	conditionPerformingTechnologist() {
		return this.page.locator('#a0529f4b-6524-0f8b-b056-48674156fa1b').first();
	}

	actionStudyReportSignOff() {
		return this.page.locator('#\\35 ed1e4dd-43f5-06a0-37c2-e5552ded7a34');
	}

	conditionStudyStatusisCompleted() {
		return this.page.locator('#\\34 96b718b-ce19-cf41-d540-277ff6b4b995 > .MuiBox-root').first();
	}

	conditionStudyStatusisCompletedClone() {
		return this.page.getByTestId('rf__node-496b718b-ce19-cf41-d540-277ff6b4b995');
	}

	actionChangeStudyStatustoVerified() {
		return this.page.locator('#\\36 9b6605a-cb18-b7bb-049e-592b53778c5e');
	}

	triggerWhenOperationIsAmendmentRequest() {
		return this.page.locator('#\\35 a59563d-afcc-e8c2-8d39-0b23f52cfbac');
	}

	conditionStudyStatusisSIGNED() {
		return this.page.getByTestId('rf__node-54c5dce8-8808-e2f3-2bca-3ddd874a7b7e').first();
	}

	actionChangeStudyStatustoTOBEAMENDED() {
		return this.page.locator('#\\33 11e9823-8b0f-d45f-b2b9-08035aef6ac9');
	}

	actionSendNotificationtoAssignedReadingPhysician() {
		return this.page.locator('#\\32 1d74ccb-0a27-9aca-e9bf-f23eecfaae25');
	}

	actionSendEmailtoAssignedReadingPhysician() {
		return this.page.locator('#\\34 80d5297-35ef-ee3f-cfbb-2aff431263d3');
	}

	async openWorkflowAutomationPageByUrl(orgId) {
		// await this.page.route('**/fhir/WorkflowAutomation?*', route => route.continue());
		await this.page.goto(`${playwrightConfig.baseURL}organization/${orgId}/workflow-automation`);
		await this.apiWaitUtils.waitForAPI('fhir/WorkflowAutomation', 'GET');
	}

	async openWorkflowAutomationPage(masterOrgName) {
		const organizationDetailPage = new OrganizationDetailPage(this.page);
		await organizationDetailPage.openOrganizationDetailPage(masterOrgName, '');
		await this.page.route('**/fhir/WorkflowAutomation?*', route => route.continue());
		await organizationDetailPage.workflowAutomationNav().click();
		await this.apiWaitUtils.waitForAPI('fhir/WorkflowAutomation', 'GET');
	}

	async openWorkflowAutomationPageDetailsView(workflowName) {
		const workflowNames = await this.workflowName().allTextContents();
		for (const [index, name] of workflowNames.entries()) {
			if (name.includes(workflowName)) {
				await this.workflowName().nth(index).click({ force: true });
				break;
			}
		}
	}

	async copyDefaultWorkflowAutomation(index) {
		await this.menuBtn().nth(index).click({ force: true });
		await this.copyOption().click({ force: true });
	}

	async createStudyStatusTrigger(status) {
		await this.page.getByLabel('add-button').click();
		await this.page.getByTestId('fade-button').click();
		await this.page.getByText('Study', { exact: true }).click();
		await this.page.getByTestId('studyTriggerProperty').click();
		await this.page.getByText('Status', { exact: true }).click();
		await this.page.getByTestId('studyTrigger-Status').click();
		await this.page.getByText(status, { exact: true }).click();
		console.log(`Study Trigger Set to ${status}`);
	}

	async createAppointmentStatusTrigger(status) {
		await this.page.getByLabel('add-button').click();
		await this.page.getByTestId('fade-button').click();
		await this.page.getByText('Appointment Status', { exact: true }).click();
		await this.page.getByTestId('appointmentTriggerStatus').click();
		await this.page.getByText(status, { exact: true }).click();
		console.log(`Appointment Status Trigger Set to ${status}`);
	}

	getDefaultAction(triggerType) {
		let defautAction = '';
		switch (triggerType) {
			case 'OPERATION':
				defautAction = 'operationAction';
				break;
			case 'STATUS':
				defautAction = 'MissingInfoAction';
				break;
			case 'APPOINTMENT':
				defautAction = 'appointmentAction';
				break;
		}
		return defautAction;
	}

	async createSendEmailActionToSpecificUser(actionName, triggerType, isFirstAction, isLastAction) {
		let defautAction = this.getDefaultAction(triggerType);
		if (!isFirstAction) {
			await this.page.getByTestId('condition-button').first().click();
		} else {
			await this.page.getByTestId('action-button').first().click();
		}
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Send Email').last().click();
		await this.page.getByTestId('sendEmailUserType').click();
		console.log('Email Send Action Selected');
		// Send to Specific User(s)
		await this.page.getByText('Specific User(s)').click();
		await this.page.getByLabel('Select User(s)').click();
		await this.page.getByLabel('Select User(s)').fill('r');
		console.log('Select User(s)');
		await this.page.waitForTimeout(1000);
		await this.page.getByRole('option', { name: 'R RAMSOFTLOCAL^USER02' }).click();
		const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
		textarea.last().fill(`Note:Test Email Send to Specific User(s) by Workflow Automation on ${actionName}`);
		console.log('Note Added');
		if (isLastAction) {
			await this.page.getByLabel('save-button').click();
			await this.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
			await this.page.getByTestId('change-enable').click();
			console.log('Workflow Automation Created');
		}
	}

	async createSendSMSActionToPatient(actionName, triggerType, isFirstAction, isLastAction) {
		let defautAction = this.getDefaultAction(triggerType);
		if (!isFirstAction) {
			await this.page.getByTestId('condition-button').click();
		} else {
			await this.page.getByTestId('action-button').click();
		}
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Send Message').last().click();
		await this.page.getByTestId('sendMessageBy').last().click();
		console.log('SMS Send Action Selected');
		// Send to Specific User(s)
		await this.page.getByText('SMS').click();
		console.log('SMS');
		await this.page.waitForTimeout(1000);
		const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
		textarea.last().fill(`Note:Test Send SMS Message to Patient by Workflow Automation on ${actionName}`);
		console.log('Note Added');
		if (isLastAction) {
			await this.page.getByLabel('save-button').click();
			await this.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
			await this.page.getByTestId('change-enable').click();
			console.log('Workflow Automation Created');
		}
	}

	async createSendEmailActionToPatient(actionName, triggerType, isFirstAction, isLastAction) {
		let defautAction = this.getDefaultAction(triggerType);
		if (!isFirstAction) {
			await this.page.getByTestId('condition-button').click();
		} else {
			await this.page.getByTestId('action-button').click();
		}
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Send Message').last().click();
		await this.page.getByTestId('sendMessageBy').last().click();
		console.log('Email Send Action Selected');
		// Send to Specific User(s)
		await this.page.getByText('Email').click();
		console.log('Email');
		await this.page.waitForTimeout(1000);
		const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
		textarea.last().fill(`Note:Test Send Email Message to Patient by Workflow Automation on ${actionName}`);
		console.log('Note Added');
		console.log('Workflow Automation Created');
		if (isLastAction) {
			await this.page.getByLabel('save-button').click();
			await this.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
			await this.page.getByTestId('change-enable').click();
			console.log('Workflow Automation Created');
		}
	}

	async createSendBlumeNotificationActionToPatient(actionName, triggerType, isFirstAction, isLastAction) {
		let defautAction = this.getDefaultAction(triggerType);
		if (!isFirstAction) {
			await this.page.getByTestId('condition-button').click();
		} else {
			await this.page.getByTestId('action-button').click();
		}
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Send Message').last().click();
		await this.page.getByTestId('sendMessageBy').last().click();
		console.log('Blume Notification Action Selected');
		// Send to Specific User(s)
		await this.page.getByText('Blume Notification').click();
		console.log('Blume Notification');
		await this.page.waitForTimeout(1000);
		const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
		textarea.last().fill(`Note:Test Blume Notification Message to Patient by Workflow Automation on ${actionName}`);
		console.log('Note Added');
		console.log('Workflow Automation Created');
		if (isLastAction) {
			await this.page.getByLabel('save-button').click();
			await this.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
			await this.page.getByTestId('change-enable').click();
			console.log('Workflow Automation Created');
		}
	}

	async createSendEmailActionToReadingPhysician(actionName, triggerType, isFirstAction, isLastAction,triggerSource) {
		let defautAction = this.getDefaultAction(triggerType);
		if (!isFirstAction) {
			await this.page.getByTestId('condition-button').click();
		} else {
			await this.page.getByTestId('action-button').click();
		}
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Send Email').last().click();
		await this.page.getByTestId('sendEmailUserType').last().click();
		await this.page.getByText('Reading Physician', { exact: true }).click();
		const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
		textarea.last().fill(`Note:Test Email Send to Reading Physician by Workflow Automation on ${actionName}${triggerSource?`TriggerSource${triggerSource}`: ''}`);
		if (isLastAction) {
			await this.page.getByLabel('save-button').click();
			await this.apiWaitUtils.waitForAPI('WorkflowAutomation', 'POST');
			await this.page.getByTestId('change-enable').click();
		}
	}
	async distributeReportViaEmail(actionName, triggerType,channel='Email') {
		let defautAction = this.getDefaultAction(triggerType);
		await this.page.getByTestId('condition-button').click();
		await this.page.getByTestId(defautAction).click();
		await this.page.getByText('Distribute Report').last().click();
		await this.page.getByTestId('distributeReportChannel').last().click();
		await this.page.getByText(channel).last().click();

		await this.page.getByTestId('distributeReportTarget').last().click();
		
		await this.page.getByText('Referring Physician', { exact: true }).last().click();
		await this.page.getByText('Managing Organization', { exact: true }).last().click();
		if (channel === 'Email') {
			// await this.page.getByText('Patient Email', { exact: true }).last().click();
			const textarea = await this.page.locator('textarea[placeholder="Enter @Patient Name to mention"]');
			textarea.last().fill(`Note:Test Distribute Report ${channel} by Workflow Automation on ${actionName}`);
		}
		await this.page.locator('.MuiBackdrop-root').click();
	}
	async createOperationTrigger(actionName) {
		await this.page.getByLabel('add-button').click();
		await this.page.getByTestId('fade-button').click();
		await this.page.getByText('Operation', { exact: true }).click();
		await this.page.getByTestId('OperationTrigger').click();
		await this.page.getByText(actionName, { exact: true }).click();
	}

	async clearWorkflowAutomation(apiRequest, action, triggerType, organizationid) {
		const wfaList = await apiRequest.getFhirResourceByCriteria(
			'WorkflowAutomation',
			'organizationid=' + organizationid
		);
		for (const wfa of wfaList.entry) {
			if (!wfa.resource.default && wfa.resource.workflow) {
				var wfaConfig = JSON.parse(wfa.resource.workflow);
				if (wfaConfig.target === triggerType && wfaConfig.when === action) {
					await apiRequest.deleteResource('WorkflowAutomation', wfa.resource.id);
					console.log(
						'Cleared Workflow Automation for Action:',
						action,
						'Trigger Type:',
						triggerType,
						'ID:',
						wfa.resource.id
					);
				}
			}
		}
	}
	async addMissMatchStudyCondition() {
		await this.page.getByTestId('add-condition-button').click();
		await this.page.getByTestId('studyCondition').click();
		await this.page.getByTestId('Study').click();
		await this.page.getByTestId('selectTypeCondition').click();
		await this.page.getByTestId('If Missing Study Information').click();
		await this.page.getByTestId('fade-button').click();
		await this.page.getByText('Diagnosis Code').click();
		await this.page.getByText('Reading Physician', { exact: true }).click();
		await this.page.getByText('Reading Physician NPI', { exact: true }).click();
		await this.page.locator('.MuiBackdrop-root').click();
	}
}

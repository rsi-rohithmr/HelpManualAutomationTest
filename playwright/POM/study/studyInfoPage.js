import cloneDeep from 'lodash/cloneDeep';
const { differenceInSeconds } = require('date-fns');
import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, TIMEOUT_IN_MSEC4 } from '../timeouts';
import { studyDO } from 'playwright/dataObjects/studyDO';
import { PageHelper } from '../../POM/utils/pageHelper';
const playwrightConfig = require('../../../playwright.config');
const { ApiWaitUtils } = require('../apiWaitUtils');
import { dateTimeHelper } from 'playwright/POM/utils/dateTimeHelper';

export class StudyInfoPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.pageHelper = new PageHelper(this.page);
	}

	//#region studyNavigationBar
	backToOrderDetailIcon() {
		return this.page.getByTestId('study-section-back-icon');
	}

	studyIdLinkOnNavBar(studyId) {
		return this.page.getByTestId(`study-item-${studyId}`);
	}
	//#endregion studyNavigationBar

	//#region breadcrumb
	studyIdLabelOnBreadcrumb(studyId) {
		return this.page.getByRole('heading', { name: `Study ID - ${studyId}` });
	}

	accessionNumLinkOnBreadcrumb(accessionNum) {
		return this.page.getByRole('heading', { name: `Accession Number - ${accessionNum}` });
	}
	//#endregion breadcrumb

	//#region header buttons
	imageViewerBtn() {
		return this.page.getByTestId('ImageOutlinedIcon');
	}

	documentViewerBtn() {
		return this.page.getByTestId('ArticleOutlinedIcon');
	}

	preAuthBtn() {
		return this.page.getByTestId('FingerprintOutlinedIcon');
	}

	billingBtn() {
		return this.page.getByTestId('CreditCardOutlinedIcon');
	}

	postChargeBtn() {
		return this.page.locator('button[data-testid="collapse-button"]:has(svg[name="postChargeIcon"])');
	}

	async openViewerPage(viewerButton) {
		let openedPage;

		// Set up event listeners
		const popupPromise = this.page.waitForEvent('popup').then(newPage => {
			openedPage = { type: 'popup', page: newPage };
		});
		const navigationPromise = new Promise(resolve => {
			this.page.once('framenavigated', frame => {
				if (frame === this.page.mainFrame()) {
					openedPage = { type: 'navigation', page: this.page };
					resolve();
				}
			});
		});

		// Try up to 4 clicks
		for (let i = 0; i < 4; i++) {
			await viewerButton?.click();
			console.log(`StudyInfoPage - openViewerPage - clicking on ${viewerButton} button - attempt ${i + 1}`);
			try {
				// Wait briefly to allow popup or navigation to trigger
				await Promise.race([
					popupPromise,
					navigationPromise,
					this.page.waitForTimeout(500), // short wait to prevent instant loop
				]);

				if (openedPage) break;
			} catch (e) {
				// Ignore and retry
			}
		}

		if (!openedPage) {
			throw new Error(
				`StudyInfoPage - openViewerPage - ${viewerButton} button did not work after multiple clicks`
			);
		}

		await openedPage.page.waitForLoadState();
		const documentViewerUrl = openedPage.page.url();
		console.log(
			`StudyInfoPage - openViewerPage - ${viewerButton} - Opened page via: ${openedPage.type} - URL: ${documentViewerUrl}`
		);

		return openedPage;
	}

	async openBillingInfoPage() {
		await this.billingBtn().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		await this.billingBtn().hover();
		await this.billingBtn().click();
		await this.page.waitForTimeout(5000);
		if (
			await this.billingBtn()
				.isVisible()
				.catch(() => false)
		) {
			console.log(
				`StudyInfoPage - openBillingInfoPage - The first click didn't work. Retrying the button click.`
			);
			await this.billingBtn().click();
		}
		await this.page.getByText('Generate Invoice').waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC4 });
		await this.page.getByTestId('ArrowBackIcon').waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
	}
	//#endregion header buttons

	//#region General section
	studyStatusComboInView() {
		return this.page.getByTestId('form-field-studyStatus');
	}

	studyStatusComboInEdit() {
		return this.page.getByTestId('autocomplete-field-Study Status');
	}

	studyDateTimeDatePickerInView() {
		return this.page.getByTestId('form-field-started');
	}

	studyDateTimeDatePickerInEdit() {
		return this.page.locator('[name="started"]');
	}

	studySetCodeComboInView() {
		return this.page.getByTestId('form-field-studySetCode');
	}

	studySetCodeComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Study Set Code' });
	}

	studyDescriptionTxtInView() {
		return this.page.getByTestId('form-field-description');
	}

	studyDescriptionTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Study Description' });
	}

	requestedProcedureIdTxtInView() {
		return this.page.getByTestId('form-field-requestedProcedureID');
	}

	requestedProcedureIdTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Requested Procedure ID' });
	}

	imagingOrganizationComboInView() {
		return this.page.getByTestId('form-field-imagingOrganization');
	}

	departmentTxtInView() {
		return this.page.getByTestId('form-field-department');
	}

	departmentTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'department' });
	}

	healthcareServiceTxtInView() {
		return this.page.getByTestId('form-field-healthcareService');
	}

	patientLocationTxtInView() {
		return this.page.getByTestId('form-field-location');
	}

	patientLocationTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Patient Location' });
	}

	examRoomTxtInView() {
		return this.page.getByTestId('form-field-examRoom');
	}

	examRoomTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Exam Room' });
	}

	modalityComboInView() {
		return this.page.getByTestId('form-field-modality');
	}

	modalityComboInEdit() {
		return this.page.getByRole('button', { name: 'Modality' });
	}

	modalityModifierComboInView() {
		return this.page.getByTestId('form-field-modalityModifier');
	}

	modalityModifierComboInEdit() {
		return this.page.locator('[id="form-field-Modality\\ Modifier"]');
	}

	loincCodeComboInView() {
		return this.page.getByTestId('form-field-loincCode');
	}

	loincCodeComboInEdit() {
		return this.page.locator('[id="form-field-LOINC\\ Code"]');
	}
	//#endregion General section

	//#region Clinical section
	clinicalSectionExpandBtn() {
		return this.page.getByTestId('visit-section-Clinical').getByTestId('expand-visit-section-button');
	}

	pharmaceuticalTypeComboInView() {
		return this.page.getByTestId('form-field-pharmaceuticalType');
	}

	pharmaceuticalTypeComboInEdit() {
		return this.page.getByRole('button', { name: 'Type' });
	}

	dosageTxtInView() {
		return this.page.getByTestId('form-field-dosage');
	}

	dosageTxtInEdit() {
		return this.page.getByRole('spinbutton', { name: 'Dosage (ml)' });
	}

	nameComboInView() {
		return this.page.getByTestId('form-field-name');
	}

	nameComboInEdit() {
		return this.page.getByRole('button', { name: 'Name' });
	}

	lateralityComboInView() {
		return this.page.getByTestId('form-field-laterality');
	}

	lateralityComboInEdit() {
		return this.page.getByRole('button', { name: 'Laterality' });
	}

	typeOfViewComboInView() {
		return this.page.getByTestId('form-field-typeOfView');
	}

	typeOfViewComboInEdit() {
		return this.page.locator('[id="form-field-Type\\ Of\\ View"]');
	}

	anatomicFocusComboInView() {
		return this.page.getByTestId('form-field-anatomicFocus');
	}

	anatomicFocusComboInEdit() {
		return this.page.locator('[id="form-field-Anatomic\\ Focus"]');
	}

	techniqueComboInView() {
		return this.page.getByTestId('form-field-technique');
	}

	techniqueComboInEdit() {
		return this.page.getByRole('button', { name: 'Technique' });
	}

	bodyPartComboInView() {
		return this.page.getByTestId('form-field-bodyPart');
	}

	bodyPartComboInEdit() {
		return this.page.locator('[id="form-field-Body\\ Part"]');
	}

	preparationComboInView() {
		return this.page.getByTestId('form-field-preparation');
	}

	durationComboInView() {
		return this.page.getByTestId('form-field-duration');
	}

	recoveryDurationComboInView() {
		return this.page.getByTestId('form-field-recoveryDuration');
	}

	clinicalCommentsTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Clinical comments Study' });
	}

	studyReasonTxtInEdit() {
		return this.page.getByRole('textbox', { name: 'Enter reason for the study' });
	}

	customField1TxtInEdit() {
		return this.page.locator('textarea[name="customField1"]');
	}

	customField2TxtInEdit() {
		return this.page.locator('textarea[name="customField2"]');
	}
	//#endregion Clinical section

	//#region Care Team section
	careTeamSectionExpandBtn() {
		return this.page.getByTestId('visit-section-Care Team').getByTestId('expand-visit-section-button');
	}

	performingTechnologistComboInView() {
		return this.page.getByTestId('form-field-performingTechnologist');
	}

	performingTechnologistComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Performing Technologist' });
	}

	performingPhysicianComboInView() {
		return this.page.getByTestId('form-field-performingPhysician');
	}

	performingPhysicianComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Performing Physician' });
	}

	readingPhysicianComboInView() {
		return this.page.getByTestId('form-field-readingPhysician');
	}

	readingPhysicianComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Reading Physician' });
	}

	readingOrganizationComboInView() {
		return this.page.getByTestId('form-field-readingOrganization');
	}

	readingOrganizationComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Reading Organization' });
	}

	transcriptionistComboInView() {
		return this.page.getByTestId('form-field-transcriptionist');
	}

	transcriptionistComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Transcriptionist' });
	}

	transcriptionOrganizationComboInView() {
		return this.page.getByTestId('form-field-transcriptionOrganization');
	}

	transcriptionOrganizationComboInEdit() {
		return this.page.getByRole('combobox', { name: 'Transcription Organization' });
	}
	//#endregion Care Team section

	//#region Procedure Code section
	procedureCodeCount() {
		return this.page.getByTestId('visit-section-Procedure Code').locator('p').first().textContent();
	}

	addProcedureCodeBtn() {
		return this.page.getByTestId('visit-section-Procedure Code').getByRole('button');
	}

	deleteProcedureCodeBtn() {
		return this.page.getByRole('button', { name: 'DELETE' });
	}

	editProcedureCodeBtn() {
		return this.page.getByRole('button', { name: 'EDIT' });
	}

	procedureCodeComboInEdit() {
		return this.page.locator('[data-testid="procedureCodeTextField"] input');
	}

	procedureCodeOrDescriptionInView(codeOrDes) {
		return this.page.getByLabel(codeOrDes);
	}

	procedureCodeModifierinEdit() {
		return this.page
			.locator('[data-testid="procedureCodeContained"]')
			.locator('div:has(svg[data-testid="CancelIcon"]) input[type="text"]')
			.nth(2);
	}

	saveProcedureCodeBtn() {
		return this.page.getByTestId('save-icon-button');
	}

	diagnosisCodeRows() {
		return this.page.locator('[data-testid="SubdirectoryArrowRightIcon"]');
	}

	dxCodeComboInEdit() {
		return this.page.locator('input[placeholder="Enter Dx code"]');
	}

	saveDxCodeBtn(rowIndex) {
		return this.page.getByTestId(`save-edit-button-${rowIndex}`);
	}

	addDxCodeBtn(rowIndex) {
		return this.page.getByTestId(`add-button-${rowIndex}`);
	}

	deleteDxCodeBtn(rowIndex) {
		return this.page.getByTestId(`delete-button-${rowIndex}`);
	}

	async getDxCodeValue(rowIndex) {
		const value = await this.diagnosisCodeRows()
			.nth(rowIndex)
			.locator('xpath=..')
			.locator('xpath=..')
			.locator('[aria-label]')
			.nth(0)
			.getAttribute('aria-label');

		return value;
	}

	async getDxReasonValue(rowIndex) {
		const value = await this.diagnosisCodeRows()
			.nth(rowIndex)
			.locator('xpath=..')
			.locator('xpath=..')
			.locator('[aria-label]')
			.nth(1)
			.getAttribute('aria-label');

		return value;
	}
	//#endregion Procedure Code section

	//#region Study Notes
	studyNotesSectionExpandBtn() {
		return this.page.getByTestId('visit-section-Study Notes').getByTestId('expand-visit-section-button');
	}

	noteCards() {
		return this.page.locator('[data-testid="NotesCard"]');
	}

	addStudyNoteBtn() {
		return this.page.getByTestId('noNotes');
	}

	editNoteBtn() {
		return this.page.getByTestId('edit-icon-button');
	}

	studyNoteTxt() {
		return this.page.getByRole('textbox', { name: 'Add a Note' });
	}

	saveNoteBtn() {
		return this.page.getByTestId('save-icon-button');
	}

	deleteNoteBtn() {
		return this.page.locator('[data-testid="hold-to-delete-tooltip"]');
	}

	noteCreatedBy() {
		return this.page.locator('text=Created by').locator('b');
	}

	noteDateTime() {
		return this.page.locator('text=Created by').locator('xpath=../following-sibling::p');
	}
	//#endregion Study Notes

	//#region Action buttons and common elements
	gobackBtn() {
		return page.getByTestId('ArrowBackIcon');
	}

	saveBtn() {
		return this.page.getByTestId('save-button');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-button');
	}

	successfulToastMsg() {
		return this.page.getByText('Study details updated successfully').first();
	}

	//#endregion Action buttons and common elements

	//#region Functions
	async waitForLoadingStudyInfoPageComplete(studyId) {
		await this.studyIdLabelOnBreadcrumb(studyId).waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async openStudyInfoPageByUrl(patientId, visitId, orderId, studyId) {
		const url = `${playwrightConfig.logInOaiUrl}patient/${patientId}/visit/${visitId}/order/${orderId}#study=${studyId}`;

		await this.page.route('**/fhir/ImagingStudy/*', route => route.continue());

		await Promise.all([this.page.goto(url), this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy', 'GET')]);

		await this.waitForLoadingStudyInfoPageComplete(studyId);
	}

	async getFieldValue(fieldLocator) {
		return fieldLocator?.locator('span').textContent();
	}

	async getSectionName(sectionName) {
		return this.page.getByRole('heading', { name: sectionName }).textContent();
	}

	async getSubSectionName(subSectionName) {
		return this.page.locator('p', { hasText: subSectionName }).textContent();
	}

	async getPlaceholderTextByName(name) {
		return this.page.locator(`textarea[name="${name}"]`).getAttribute('placeholder');
	}

	async getValueOfTextareaByName(name) {
		return this.page.locator(`textarea[name="${name}"]`).inputValue();
	}

	async getProcedureCodeFieldValueByName(name) {
		const count = +(await this.procedureCodeCount());
		if (count === 0) {
			return name === 'MODIFIER' ? 'N/A' : '';
		}
		const parent = this.page.locator('p', { hasText: name });
		return name === 'MODIFIER'
			? parent.locator('xpath=following-sibling::div[1]//p').textContent()
			: parent.locator('xpath=following-sibling::p[1]').textContent();
	}

	async getGeneralInfoFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.general.sectionHeader = await this.getSectionName('General');
		formValues.general['Study Status'] = await this.getFieldValue(await this.studyStatusComboInView());

		// Workaround for the issue where Study Date/Time is still in edit mode after saving
		if (
			await this.studyDateTimeDatePickerInView()
				.isVisible()
				.catch(() => false)
		) {
			console.log('StudyInfoPage - getFormValues - studyDateTimeDatePickerInView was visible');

			formValues.general['Study Date/Time'] = await this.getFieldValue(
				await this.studyDateTimeDatePickerInView()
			);
		} else if (
			await this.studyDateTimeDatePickerInEdit()
				.isVisible()
				.catch(() => false)
		) {
			console.log('StudyInfoPage - getFormValues - studyDateTimeDatePickerInEdit was visible');
			const dateTimeValue = await this.studyDateTimeDatePickerInEdit().inputValue();
			// The date time value in edit mode has 'MM/DD/YYYY, hh:mm A' -> need to convert it to 'MM/DD/YYYY, h:mm A' which is the format in view mode
			formValues.general['Study Date/Time'] = dateTimeHelper.formatDateTime(dateTimeValue, 'MM/DD/YYYY, h:mm A');
		}
		formValues.general['Study Set Code'] = await this.getFieldValue(await this.studySetCodeComboInView());
		formValues.general['Study Description'] = await this.getFieldValue(await this.studyDescriptionTxtInView());
		formValues.general['Requested Procedure ID'] = await this.getFieldValue(
			await this.requestedProcedureIdTxtInView()
		);
		formValues.general['Imaging Organization'] = await this.getFieldValue(
			await this.imagingOrganizationComboInView()
		);
		formValues.general.Department = await this.getFieldValue(await this.departmentTxtInView());
		formValues.general['Healthcare Service'] = await this.getFieldValue(await this.healthcareServiceTxtInView());
		formValues.general['Patient Location'] = await this.getFieldValue(await this.patientLocationTxtInView());
		formValues.general['Exam Room'] = await this.getFieldValue(await this.examRoomTxtInView());
		formValues.general.Modality = await this.getFieldValue(await this.modalityComboInView());
		formValues.general['Modality Modifier'] = await this.getFieldValue(await this.modalityModifierComboInView());
		formValues.general['LOINC Code'] = await this.getFieldValue(await this.loincCodeComboInView());

		return formValues.general;
	}

	async getClinicalFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.clinical.sectionHeader = await this.getSectionName('Clinical');

		formValues.clinical.pharmaceutical.subSectionHeader = await this.getSubSectionName('PHARMACEUTICAL');
		formValues.clinical.pharmaceutical.Type = await this.getFieldValue(await this.pharmaceuticalTypeComboInView());

		if (
			await this.page
				.locator('input[name="dosage"]')
				.isVisible()
				.catch(() => false)
		) {
			formValues.clinical.pharmaceutical['Dosage (ml)'] = await this.page
				.locator('input[name="dosage"]')
				.getAttribute('value');
		} else {
			formValues.clinical.pharmaceutical['Dosage (ml)'] = await this.getFieldValue(await this.dosageTxtInView());
		}

		formValues.clinical.pharmaceutical.Name = await this.getFieldValue(await this.nameComboInView());

		formValues.clinical.scanDetails.subSectionHeader = await this.getSubSectionName('SCAN DETAILS');
		formValues.clinical.scanDetails.Laterality = await this.getFieldValue(await this.lateralityComboInView());
		formValues.clinical.scanDetails['Type Of View'] = await this.getFieldValue(await this.typeOfViewComboInView());
		formValues.clinical.scanDetails['Anatomic Focus'] = await this.getFieldValue(
			await this.anatomicFocusComboInView()
		);
		formValues.clinical.scanDetails.Technique = await this.getFieldValue(await this.techniqueComboInView());
		formValues.clinical.scanDetails['Body Part'] = await this.getFieldValue(await this.bodyPartComboInView());
		formValues.clinical.scanDetails['Preparation (HH: MM)'] = await this.getFieldValue(
			await this.preparationComboInView()
		);
		formValues.clinical.scanDetails['Duration (HH: MM)'] = await this.getFieldValue(
			await this.durationComboInView()
		);
		formValues.clinical.scanDetails['Recovery (HH: MM)'] = await this.getFieldValue(
			await this.recoveryDurationComboInView()
		);

		formValues.clinical.clinicalComments.subSectionHeader = await this.getSubSectionName('Clinical comments');
		formValues.clinical.clinicalComments.placeHolderText = await this.getPlaceholderTextByName('clinicalComments');
		formValues.clinical.clinicalComments.comments = await this.getValueOfTextareaByName('clinicalComments');

		formValues.clinical.studyReason.subSectionHeader = await this.getSubSectionName('Study Reason/History');
		formValues.clinical.studyReason.placeHolderText = await this.getPlaceholderTextByName('studyReason');
		formValues.clinical.studyReason.comments = await this.getValueOfTextareaByName('studyReason');

		formValues.clinical.customField1.subSectionHeader = await this.getSubSectionName('Custom Field 1');
		formValues.clinical.customField1.placeHolderText = await this.getPlaceholderTextByName('customField1');
		formValues.clinical.customField1.content = await this.getValueOfTextareaByName('customField1');

		formValues.clinical.customField2.subSectionHeader = await this.getSubSectionName('Custom Field 2');
		formValues.clinical.customField2.placeHolderText = await this.getPlaceholderTextByName('customField2');
		formValues.clinical.customField2.content = await this.getValueOfTextareaByName('customField2');

		return formValues.clinical;
	}

	async getCareTeamFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.careTeam.sectionHeader = await this.getSectionName('Care Team');
		formValues.careTeam['Performing Technologist'] = await this.getFieldValue(
			await this.performingTechnologistComboInView()
		);
		formValues.careTeam['Performing Physician'] = await this.getFieldValue(
			await this.performingPhysicianComboInView()
		);
		formValues.careTeam['Reading Physician'] = await this.getFieldValue(await this.readingPhysicianComboInView());
		formValues.careTeam['Reading Organization'] = await this.getFieldValue(
			await this.readingOrganizationComboInView()
		);
		formValues.careTeam.Transcriptionist = await this.getFieldValue(await this.transcriptionistComboInView());

		// Workaround for the issue where Study Date/Time is still in edit mode after saving
		if (
			await this.transcriptionOrganizationComboInView()
				.isVisible()
				.catch(() => false)
		) {
			console.log('StudyInfoPage - getFormValues - transcriptionOrganizationComboInView was visible');

			formValues.careTeam['Transcription Organization'] = await this.getFieldValue(
				await this.transcriptionOrganizationComboInView()
			);
		} else if (
			await this.transcriptionOrganizationComboInEdit()
				.isVisible()
				.catch(() => false)
		) {
			console.log('StudyInfoPage - getFormValues - transcriptionOrganizationComboInEdit was visible');
			formValues.careTeam['Transcription Organization'] =
				await this.transcriptionOrganizationComboInEdit().inputValue();
		}

		return formValues.careTeam;
	}

	async getProcedureCodeFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.procedureCode.sectionHeader = await this.getSectionName('Procedure Code');
		formValues.procedureCode.count = +(await this.procedureCodeCount());

		formValues.procedureCode['PROCEDURE CODE'] = await this.getProcedureCodeFieldValueByName('PROCEDURE CODE');
		formValues.procedureCode.DESCRIPTION = await this.getProcedureCodeFieldValueByName('DESCRIPTION');
		formValues.procedureCode.MODIFIER = await this.getProcedureCodeFieldValueByName('MODIFIER');

		const rowCount = +(await this.diagnosisCodeRows().count());

		for (let i = 0; i < rowCount; i++) {
			formValues.procedureCode[`DX CODE ${i}`] = await this.getDxCodeValue(i);
			formValues.procedureCode[`DX REASON ${i}`] = await this.getDxReasonValue(i);
			console.log(
				`getDiagnosisFieldValueByName - row: ${i}, DX CODE: ${formValues.procedureCode[`DX CODE ${i}`]}`
			);
			console.log(
				`getDiagnosisFieldValueByName - row: ${i}, DX REASON: ${formValues.procedureCode[`DX REASON ${i}`]}`
			);
			console.log(
				`getDiagnosisFieldValueByName - row: ${i}, DX CODE: ${formValues.procedureCode[`DX CODE ${i}`]}`
			);
			console.log(
				`getDiagnosisFieldValueByName - row: ${i}, DX REASON: ${formValues.procedureCode[`DX REASON ${i}`]}`
			);
		}

		if (rowCount === 0) {
			console.log(`getDiagnosisFieldValueByName - rowCount: ${rowCount}`);
			formValues.procedureCode['DX CODE 0'] = '';
			formValues.procedureCode['DX REASON 0'] = '';
			formValues.procedureCode['DX CODE 1'] = '';
			formValues.procedureCode['DX REASON 1'] = '';
		}

		return formValues.procedureCode;
	}

	async getNoteFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.studyNotes.sectionHeader = await this.getSectionName('Study Notes');
		formValues.studyNotes.count = +(await this.page
			.getByTestId('visit-section-Study Notes')
			.locator('p')
			.first()
			.textContent());

		const noteCardCount = +(await this.noteCards().count());
		for (let i = 0; i < noteCardCount; i++) {
			const noteCard = await this.noteCards().nth(i);
			formValues.studyNotes[`note${i}Header`] = await noteCard.getByText('Study Notes').textContent();
			formValues.studyNotes[`note${i}Content`] = await noteCard
				.locator('textarea[placeholder="Add a Note"]')
				.first()
				.inputValue();
			formValues.studyNotes[`note${i}CreatedBy`] = await noteCard
				.locator('p')
				.filter({ hasText: 'Created by' })
				.locator('b')
				.textContent();
			formValues.studyNotes[`note${i}CreatedDate`] = await noteCard
				.locator('p', { hasText: 'Created by' })
				.locator('xpath=following-sibling::p[1]')
				.textContent();
		}

		return formValues.studyNotes;
	}

	async getFormValues() {
		const formValues = cloneDeep(studyDO);

		formValues.general = await this.getGeneralInfoFormValues();
		formValues.clinical = await this.getClinicalFormValues();
		formValues.careTeam = await this.getCareTeamFormValues();
		formValues.procedureCode = await this.getProcedureCodeFormValues();
		formValues.studyNotes = await this.getNoteFormValues();

		return formValues;
	}

	async clickSaveBtnAndWaitForSavingComplete(saveButton) {
		const button = saveButton || this.saveBtn();
		await this.page.route('/fhir/ImagingStudy/', route => route.continue());
		await Promise.all([button.click(), this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy/', 'PUT')]);
		await this.successfulToastMsg().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async inputGeneralInfo(generalInfo) {
		// Intentionally input the fields in the order as below to solve the issue that sometimes the fields in view mode or edit mode are
		//  not visible due to the hover action
		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.studyStatusComboInView(),
			await this.studyStatusComboInEdit(),
			generalInfo['Study Status']
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.studySetCodeComboInView(),
			await this.studySetCodeComboInEdit(),
			`${generalInfo['Study Set Code']} - ${generalInfo['Study Description']}`,
			generalInfo['Study Set Code'],
			false
		);

		await this.pageHelper.inputValueForTextField(
			await this.requestedProcedureIdTxtInView(),
			await this.requestedProcedureIdTxtInEdit(),
			generalInfo['Requested Procedure ID']
		);

		await this.pageHelper.inputValueForTextField(
			await this.departmentTxtInView(),
			await this.departmentTxtInEdit(),
			generalInfo['Department']
		);

		await this.pageHelper.inputValueForTextField(
			await this.patientLocationTxtInView(),
			await this.patientLocationTxtInEdit(),
			generalInfo['Patient Location']
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.modalityComboInView(),
			await this.modalityComboInEdit(),
			generalInfo?.Modality,
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.modalityModifierComboInView(),
			await this.modalityModifierComboInEdit(),
			generalInfo['Modality Modifier'],
			true
		);

		await this.pageHelper.inputValueForTextField(
			await this.examRoomTxtInView(),
			await this.examRoomTxtInEdit(),
			generalInfo['Exam Room']
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.loincCodeComboInView(),
			await this.loincCodeComboInEdit(),
			generalInfo['LOINC Code']
		);

		await this.studyDateTimeDatePickerInView().hover();
		await this.pageHelper.selectDateFromDatePicker(
			this.studyDateTimeDatePickerInEdit(),
			generalInfo['Study Date/Time']
		);
	}

	async inputClinicalInfo(clinicalInfo) {
		await this.clinicalSectionExpandBtn().click();
		await this.clinicalCommentsTxtInEdit().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });

		await this.pageHelper.selectOptionFromCombo(
			await this.pharmaceuticalTypeComboInView(),
			await this.pharmaceuticalTypeComboInEdit(),
			clinicalInfo?.pharmaceutical?.Type,
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.nameComboInView(),
			await this.nameComboInEdit(),
			clinicalInfo?.pharmaceutical?.Name,
			true
		);

		await this.pageHelper.inputValueForTextField(
			await this.dosageTxtInView(),
			await this.dosageTxtInEdit(),
			clinicalInfo?.pharmaceutical['Dosage (ml)']
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.lateralityComboInView(),
			await this.lateralityComboInEdit(),
			clinicalInfo?.scanDetails?.Laterality,
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.typeOfViewComboInView(),
			await this.typeOfViewComboInEdit(),
			clinicalInfo?.scanDetails['Type Of View'],
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.anatomicFocusComboInView(),
			await this.anatomicFocusComboInEdit(),
			clinicalInfo?.scanDetails['Anatomic Focus'],
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.bodyPartComboInView(),
			await this.bodyPartComboInEdit(),
			clinicalInfo?.scanDetails['Body Part'],
			true
		);

		await this.pageHelper.selectOptionFromCombo(
			await this.techniqueComboInView(),
			await this.techniqueComboInEdit(),
			clinicalInfo?.scanDetails?.Technique
		);

		await this.clinicalCommentsTxtInEdit().fill(clinicalInfo?.clinicalComments?.comments);
		await this.studyReasonTxtInEdit().fill(clinicalInfo?.studyReason?.comments);
		await this.customField1TxtInEdit().fill(clinicalInfo?.customField1?.content);
		await this.customField2TxtInEdit().fill(clinicalInfo?.customField2?.content);
	}

	async inputCareTeamInfo(careTeamInfo) {
		await this.careTeamSectionExpandBtn().click();

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.performingTechnologistComboInView(),
			await this.performingTechnologistComboInEdit(),
			careTeamInfo['Performing Technologist']
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.performingPhysicianComboInView(),
			await this.performingPhysicianComboInEdit(),
			careTeamInfo['Performing Physician']
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.readingPhysicianComboInView(),
			await this.readingPhysicianComboInEdit(),
			careTeamInfo['Reading Physician']
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.readingOrganizationComboInView(),
			await this.readingOrganizationComboInEdit(),
			careTeamInfo['Reading Organization']
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.transcriptionistComboInView(),
			await this.transcriptionistComboInEdit(),
			careTeamInfo?.Transcriptionist
		);

		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			await this.transcriptionOrganizationComboInView(),
			await this.transcriptionOrganizationComboInEdit(),
			careTeamInfo['Transcription Organization']
		);
	}

	async deleteProcedureCode(procedureCode) {
		await this.procedureCodeOrDescriptionInView(procedureCode).hover();
		await this.page.route('/fhir/ImagingStudy/', route => route.continue());
		await Promise.all([
			this.deleteProcedureCodeBtn().click(),
			this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy/', 'PUT'),
		]);
		await this.successfulToastMsg().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async addProcedureCodeAndDiagnosis(procedureCodeObj, modifier, diagnosisObj) {
		await this.addProcedureCodeBtn().click();
		await this.saveProcedureCodeBtn().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });

		// Select procedure code
		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			null,
			await this.procedureCodeComboInEdit(),
			`${procedureCodeObj?.procedureCode} - ${procedureCodeObj?.description}`,
			procedureCodeObj?.procedureCode,
			false
		);

		// Input modifier
		await this.procedureCodeModifierinEdit().fill(modifier);

		// Add diagnosis code
		await this.#addNewDiagnosisRow(diagnosisObj);

		// Save the procedure code
		await this.clickSaveBtnAndWaitForSavingComplete(this.saveProcedureCodeBtn());
	}

	async addDiagnosisToProcedureCode(procedureCode, diagnosisObj) {
		await this.procedureCodeOrDescriptionInView(procedureCode).hover();
		await this.editProcedureCodeBtn().click();
		await this.#addNewDiagnosisRow(diagnosisObj);
		await this.clickSaveBtnAndWaitForSavingComplete(this.saveProcedureCodeBtn());
	}

	async #addNewDiagnosisRow(diagnosisObj) {
		const diagnosisRowCount = +(await this.diagnosisCodeRows().count());
		// When adding or editting a procedure code, there will be at least one diagnosis row
		if (diagnosisRowCount >= 1) {
			const lastRowIndex = diagnosisRowCount - 1;
			await this.diagnosisCodeRows().nth(lastRowIndex).hover();
			// if the row is not empty, the Add button will be visible
			if (
				await this.addDxCodeBtn(lastRowIndex)
					.isVisible()
					.catch(() => false)
			) {
				await this.addDxCodeBtn(lastRowIndex).click();
				const newLastRowIndex = lastRowIndex + 1;
				await this.#inputDiagnosis(diagnosisObj, newLastRowIndex);
			} else {
				// The row is empty now -> input diagnosis into this row
				await this.#inputDiagnosis(diagnosisObj, lastRowIndex);
			}
		}
	}

	async #inputDiagnosis(diagnosisObj, rowIndex) {
		// Select diagnosis code
		await this.pageHelper.searchAndSelectOptionFromAutocompleteCombo(
			null,
			await this.dxCodeComboInEdit().nth(rowIndex),
			`${diagnosisObj?.code} - ${diagnosisObj?.reason}`,
			diagnosisObj?.code
		);
		// Hover on the row and click Save
		await this.diagnosisCodeRows().nth(rowIndex).hover();
		await this.saveDxCodeBtn(rowIndex ?? 0).click();
	}

	async saveNoteAndWaitForSavingComplete() {
		await this.page.route('/fhir/ImagingStudy/', route => route.continue());
		await Promise.all([this.saveNoteBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy/', 'PATCH')]);
	}

	async addNote(note) {
		await this.addStudyNoteBtn().click();
		await this.studyNoteTxt().fill(note);
		await this.saveNoteAndWaitForSavingComplete();
		await this.page
			.getByText('Study notes successfully saved')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async updateNote(oldNote, newNote) {
		await this.page.getByText(oldNote).hover();
		await this.editNoteBtn().click();
		await this.studyNoteTxt().fill(newNote);
		await this.saveNoteAndWaitForSavingComplete();
	}

	async deleteNote(note) {
		await this.page.getByText(note).hover();
		await this.deleteNoteBtn().click(),
			await this.page.mouse.down(),
			await this.page.waitForTimeout(3000),
			await this.page.mouse.up(),
			await this.page
				.getByText('Note deleted successfully')
				.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	reverseName = (name, needSeparator) => {
		if ([playwrightConfig.userFullName, playwrightConfig.userFullName2].includes(name)) {
			return name
				.split(' ')
				.reverse()
				.join(needSeparator ? ', ' : ' ');
		} else return name;
	};

	/**
	 * Checks if the difference between two date/time values is greater than 180 seconds (3 minutes).
	 * This function is very specific for testing the date time fields that the actual value is the current
	 * time when saving data such as study note createdDate, and the expected value is usually generated before saving the data
	 * The difference should be less than or equal to 3 mins depending on the app performance
	 *
	 * @param {string|Date} date1 - The first date/time value to compare (expected value).
	 * @param {string|Date} date2 - The second date/time value to compare (actual value).
	 * @param {string} fieldName - The name of the field being compared (for logging/debugging).
	 * @returns {boolean} Returns true if the absolute difference is greater than 180 seconds, otherwise false.
	 */
	areDatesDifferentAndAcceptable(date1, date2, fieldName) {
		const diffInSecs = differenceInSeconds(new Date(date1), new Date(date2));
		console.log(
			`studyInfoPage -areDatesDifferentAndAcceptable - fieldName: ${fieldName}, date1: ${date1}, date2: ${date2}, diffInSecs: ${diffInSecs}`
		);

		return Math.abs(diffInSecs) === 0 || Math.abs(diffInSecs) <= 180;
	}
	//#endregion Functions
}

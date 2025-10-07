const { expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const fs1 = require('fs').promises;
const path = require('path');
const { ApiWaitUtils } = require('./apiWaitUtils');
const { AIUtils } = require('./aiUtils');

const TIMEOUT_IN_MSEC2 = 20000;
const TIMEOUT_IN_MSEC1 = 10000;
const TIMEOUT_IN_MSEC3 = 60000;

/**
 * @class DocumentViewer
 * @description A class representing the document viewer functionality in the application
 */
exports.DocumentViewer = class DocumentViewer {
	/**
	 * @constructor
	 * @param {import('@playwright/test').Page} page - The Playwright page object
	 * @param {import('@playwright/test').TestInfo} testInfo - The test information object
	 */
	constructor(page, testInfo) {
		this.page = page;
		this.testInfo = testInfo; // Store the test object
		this.aiUtils = new AIUtils(page, null, testInfo);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	reportSelectCheckBox() {
		return this.page.locator('.report-check');
	}

	reportDeleteBtn() {
		return this.page.locator('[data-testid="DeleteOutlinedIcon"]:visible');
	}

	reportCardDeleteBtn() {
		return this.page.locator('[id="Final Report"] [data-testid="DeleteOutlineIcon"]');
	}

	preliminaryReportCardDeleteBtn() {
		return this.page.locator('[id="Preliminary Report"] [data-testid="DeleteOutlineIcon"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	signBtn() {
		return this.page.locator('[name="actionDone"]');
	}

	nextStudyBtn() {
		return this.page.locator('[aria-label="Done & Open Next"]');
	}

	versionHistoryOption() {
		return this.page.locator('ul > li:has-text("Version History")');
	}

	BookmarkOption() {
		return this.page.locator('[data-testid="bookmarks-menu-item"]');
	}

	popOutWindowOption() {
		return this.page.locator('ul > li:has-text("Pop out Window")');
	}

	printOption() {
		return this.page.locator('ul > li:has-text("Print Report")');
	}

	editSignatureOption() {
		return this.page.locator('ul > li:has-text("Edit Signature")');
	}

	criticalFindingOption() {
		return this.page.locator('ul > li:has-text("Critical Findings")');
	}

	peerReviewOption() {
		return this.page.locator('ul > li:has-text("Peer Review")');
	}

	vrDicationBtn() {
		return this.page.locator('[aria-label="Voice Dictation"]');
	}

	vrDicationBtnPoweredByAugnito() {
		return this.page.locator('[aria-label="Voice Dictation - Powered by Augnito"]');
	}

	criticalFindingMarkbtn() {
		return this.page.locator('[aria-label="controlled"]');
	}

	amendBtn() {
		return this.page.locator('[aria-label="Amend"]');
	}

	amendingIcon() {
		return this.page.locator('[data-testid="navigator-card-amending"]');
	}

	amendedIcon() {
		return this.page.locator('[data-testid="navigator-card-amended"]');
	}

	SubmitAmendRequestBtn() {
		return this.page.locator('[data-cy="Submit_"]');
	}

	amendRequestTxtBox() {
		return this.page.locator('[id="multiline-RequestedReason"]');
	}

	loadBlankTemplateBtn() {
		return this.page.locator('[data-cy="Continue_"]');
	}

	reportEditorTextArea() {
		return this.page.locator('[id="editor-wrapper"]', { timeout: TIMEOUT_IN_MSEC2 });
	}

	loadDocuments() {
		return this.page.locator('text=Documents');
	}

	documentViewerTextArea() {
		return this.page.locator('[data-testid="core__viewer"]', { timeout: 6000 });
	}

	addReportBtn() {
		return this.page.locator('[class="file-drop"] [data-cy="add-new-btn"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	pdfViewerArea() {
		return this.page.locator('[data-testid="core__viewer"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	pdfViewerAreaZoomCheck() {
		return this.page.locator('[class="rpv-core__canvas-layer"] ', { timeout: TIMEOUT_IN_MSEC1 }).first();
	}

	criticalFindingMark(index) {
		return this.page.locator(`[data-cy="study-status-cell-${index}_flagCol"] [data-testid="FlagOutlinedIcon"]`);
	}

	criticalFindingIcon() {
		return this.page.locator('[data-testid="navigator-card-critical"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	reportCardReferringPhysician() {
		return this.page.locator('[id="Preliminary Report"] [id="name"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	reportCardCreationDateTime() {
		return this.page.locator('[id="Preliminary Report"] [id="dateTime"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	reportCardReportTitle() {
		return this.page.locator('[id="Preliminary Report"] [id="title"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	reportCardManagingOrganization() {
		return this.page.locator('[id="Preliminary Report"] [id="managingOrganization"]', {
			timeout: TIMEOUT_IN_MSEC1,
		});
	}

	preliminaryReportEditBtn() {
		return this.page.locator('[id="Preliminary Report"] [alt="edit-icon"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	finalCardReferringPhysician() {
		return this.page.locator('[id="Final Report"] [id="name"]');
	}

	finalCardCreationDateTime() {
		return this.page.locator('[id="Final Report"] [id="dateTime"]');
	}

	finalCardReportTitle() {
		return this.page.locator('[id="Final Report"] [id="title"]', { timeout: TIMEOUT_IN_MSEC2 });
	}

	finalCardManagingOrganization() {
		return this.page.locator('[id="Final Report"] [id="managingOrganization"]');
	}

	finalReportEditBtn() {
		return this.page.locator('[id="Final Report"] [alt="edit-icon"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	imageViewerBtn() {
		return this.page.locator('[data-testid="imageViewerButton"]', { timeout: TIMEOUT_IN_MSEC2 });
	}

	studyCardRefferringPhysician() {
		return this.page.locator('[id="Visit Document"] [id="name"]');
	}

	studyCardCreationDateTime() {
		return this.page.locator('[id="Visit Document"] [id="dateTime"]');
	}

	studyCardReportTitle() {
		return this.page.locator('[id="Visit Document"] [id="title"]');
	}

	studyCardManagingOrganization() {
		return this.page.locator('[id="Visit Document"] [id="managingOrganization"]');
	}

	studyCardDeleteBtn() {
		return this.page.locator('[id="Visit Document"] [data-testid="DeleteOutlineIcon"]');
	}

	studyCardEditBtn() {
		return this.page.locator('[id="Visit Document"] [alt="edit-icon"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	newReportEditorTextArea() {
		return this.page.locator('#TipTapProseMirrorEditorMain .ProseMirror', { timeout: TIMEOUT_IN_MSEC3 });
	}

	newReportEditorTextAreaPerformance() {
		return this.page.locator('#TipTapProseMirrorEditorMain .ProseMirror', { timeout: 3000 });
	}

	newReportEditorSection() {
		return this.page.locator('#TipTapProseMirrorEditorMain', { timeout: TIMEOUT_IN_MSEC3 });
	}

	saveReportBtn() {
		return this.page.locator('[aria-label="Save"]');
	}

	documentsTypeDropdown() {
		return this.page.locator('[name="documentReportDrawerArrowDown"]');
	}

	documentTemplatedrawerExpandBtn() {
		return this.page.locator('[data-testid="ArticleOutlinedIcon"]');
	}

	editorDotMenu() {
		return this.page.locator('[data-testid="more-options-toolbar-button"]');
	}

	/**
	 * Gets the total count of reports
	 * @returns {Promise<number>} The number of reports
	 */
	async getAllReportCount() {
		return this.page.evaluate(() => document.querySelectorAll('.report-check').length);
	}

	/**
	 * Gets the count of elements matching the given selector
	 * @param {string} element - The CSS selector to count elements for
	 * @returns {Promise<number>} The number of matching elements
	 */
	async getElementCount(element) {
		return this.page.evaluate(selector => document.querySelectorAll(selector).length, element);
	}

	/**
	 * Gets the count of preliminary reports
	 * @returns {Promise<number>} The number of preliminary reports
	 */
	async getPreliminaryReport() {
		return this.page.evaluate(() => document.querySelectorAll('#Preliminary Report .report-check').length);
	}

	getCreateOutlinedTextContainer() {
		return this.page.locator('p:has([data-testid="CreateOutlinedIcon"])');
	}

	getLockedUserIcon() {
		return this.page.locator('div.MuiBox-root.css-bs4d4s p');
	}

	getLockOutlinedIcon() {
		return this.page.locator('p:has(svg[data-testid="LockOutlinedIcon"])');
	}

	getReadOnlyElement() {
		return this.page.locator('p:has(svg[data-testid="LockOutlinedIcon"])');
	}

	getTakeoverEditingButton() {
		return this.page.locator('button:has-text("Takeover Editing")');
	}

	templateIcon() {
		return this.page.locator(
			'[id="Preliminary Report"] [aria-label="Templates"] [data-testid="BusinessCenterOutlinedIcon"]'
		);
	}

	addTemplateButton() {
		return this.page.locator('[id="templateManager"] [data-testid="AddIcon"]');
	}

	publishButton() {
		return this.page.locator('[data-testid="PublishedWithChangesOutlinedIcon"]');
	}

	previewBtn() {
		return this.page.locator('[aria-label="Preview"]');
	}

	pageSetupBtn() {
		return this.page.locator('[aria-label="Page Setup"]');
	}

	openTemplateDrawerBtn() {
		return this.page.locator('[data-testid="BusinessCenterOutlinedIcon"]');
	}

	templateCard(id) {
		return this.page.locator(`[id="TemplateCard_${id}"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateName(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [id="templatename"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateDate(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [id="date"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateCreatedBy(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [id="organizationName"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateOrg(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [id="organizationName"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateDelete(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [data-testid="DeleteOutlineIcon"]`, {
			timeout: TIMEOUT_IN_MSEC2,
		});
	}

	templateManagerOption() {
		return this.page.locator('ul > li:has-text("Template Manager")');
	}

	templatePreview() {
		return this.page.locator('[data-testid="viewport-preview"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateNameTxtField() {
		return this.page.locator('[name="name"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateCategorySelectField() {
		return this.page.locator('#mui-component-select-category');
	}

	templateOrgSelectField() {
		return this.page.locator('[placeholder="Organization"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateStartStatusField() {
		return this.page.locator('[id=mui-component-select-fromStatus]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateToStatusField() {
		return this.page.locator('[id=mui-component-select-toStatus]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateModalitySelectField() {
		return this.page.locator('[placeholder="Modality"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateBodyPartSelectField() {
		return this.page.locator('[placeholder="Select Body Part"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	templateLateralitySelectField() {
		return this.page.locator('#mui-component-select-laterality');
	}

	templateGenderSelectField() {
		return this.page.locator('#mui-component-select-sex');
	}

	templateProcedureCodeSelectField() {
		return this.page.locator('[placeholder="Procedure Code"]');
	}

	templatePublishBtn() {
		return this.page.locator('button:has-text("PUBLISH")');
	}

	templatePublishAsNewTemplateBtn() {
		return this.page.locator('[aria-labelledby="Primary Button Menu"]');
	}

	templateEditBtn() {
		return this.page.locator('[data-testid="EditOutlinedIcon"]', { timeout: TIMEOUT_IN_MSEC2 });
	}

	templateCardEditBtn(id) {
		return this.page.locator(`[id="TemplateCard_${id}"] [alt="edit-icon"]`, { timeout: TIMEOUT_IN_MSEC2 });
	}

	applyTemplateIcon() {
		return this.page.locator('.css-10pe3u5', { timeout: TIMEOUT_IN_MSEC2 });
	}

	searchTemplateIcon() {
		return this.page.locator('[aria-label="Search Template"]');
	}

	searchTemplateTextField() {
		return this.page.locator('[placeholder="Search Templates"]');
	}

	expandBtn() {
		return this.page.locator('[data-testid="KeyboardArrowRightOutlinedIcon"]:visible');
	}

	backBtnforTemplatemanagerDV() {
		return this.page.locator('[data-testid="ArrowBackIcon"]');
	}

	fontToolbarHeaderOption() {
		return this.page.locator('[data-testid="bubble-menu"]');
	}

	fontToolbarFontTypOption() {
		return this.page.locator('.css-q2ms4q');
	}

	fontToolbarFontSizeOption() {
		return this.page.locator('.css-1xok4pd .css-d8110q');
	}

	fontToolbarBoldOption() {
		return this.page.locator('[data-testid="FormatBoldIcon"]');
	}

	fontToolbarItalicOption() {
		return this.page.locator('[data-testid="FormatItalicIcon"]');
	}

	fontToolbarUnderlineOption() {
		return this.page.locator('[data-testid="FormatUnderlinedIcon"]');
	}

	fontToolbarStrikeOption() {
		return this.page.locator('[data-testid="StrikethroughSIcon"]');
	}

	fontToolbarColorOption() {
		return this.page.locator('[data-testid="FormatColorTextIcon"]');
	}

	fontToolbarHighlighterOption() {
		return this.page.locator('.css-1yd5avr .css-10rh3fx');
	}

	fontToolbarAlignmentOption() {
		return this.page.locator('[data-testid="FormatAlignLeftOutlinedIcon"]');
	}

	fontToolbarLeftAlignmentOption() {
		return this.page.locator('[data-testid="FormatAlignLeftOutlinedIcon"]');
	}

	fontToolbarCenterAlignmentOption() {
		return this.page.locator('[data-testid="FormatAlignCenterOutlinedIcon"]');
	}

	fontToolbarRightAlignmentOption() {
		return this.page.locator('[data-testid="FormatAlignRightOutlinedIcon"]');
	}

	fontToolbarDecreaseIndentationOption() {
		return this.page.locator('[data-testid="FormatIndentDecreaseIcon"]');
	}

	fontToolbarIncreaseIndentationOption() {
		return this.page.locator('[data-testid="FormatIndentIncreaseIcon"]');
	}

	fontToolbarLineSpaceOption() {
		return this.page.locator('[data-testid="FormatLineSpacingIcon"]');
	}

	fontToolbarInsertOptionButton() {
		return this.page.locator('[data-testid="button-insert"]');
	}

	fontToolbarTableOptions() {
		return this.page.locator('[data-testid="TableRowsOutlinedIcon"]');
	}

	fontToolbarImageOptions() {
		return this.page.locator('[data-testid="ImageOutlinedIcon"]');
	}

	fontToolbarNumberingOption() {
		return this.page.locator('[data-testid="ImageOutlinedIcon"]');
	}

	bookmarkOpenCollapseBtn() {
		return this.page.locator('[data-testid="BookmarkBorderOutlinedIcon"]').nth(0);
	}

	pickListSettingBtn() {
		return this.page.locator('[data-testid="settings-button"]').nth(0);
	}

	customFieldSettingBtn() {
		return this.page.locator('[data-testid="settings-button"]').nth(1);
	}

	draggedPickListBookmark(picklistName) {
		return this.page.locator(`[aria-label="${picklistName}"]`);
	}

	pickListInEditor() {
		return this.page.locator('.custom-picklist');
	}

	pickListInEditMode() {
		return this.page.locator('.css-1457yrt');
	}

	customFieldEditMode() {
		return this.page.locator('.css-1wri7kj');
	}

	pickListEditBtn() {
		return this.page.locator('[data-testid="EditOutlinedIcon"]');
	}

	addBtn() {
		return this.page.locator('[data-cy="add-new-btn"]');
	}

	pickListOptionsTxtField() {
		return this.page.locator('[placeholder="option"]');
	}

	createPickListBtn() {
		return this.page.locator('[data-cy="Create_"]');
	}

	customFieldTxtField(customFieldName) {
		return this.page
			.locator(`[data-type="custom-field"] [title="${customFieldName}"]`)
			.locator(':scope + *')
			.getByRole('paragraph');
	}

	currentStudyAccordionSummaryContent() {
		return this.page.locator('[id="currentStudy"] .MuiAccordionSummary-content');
	}

	priorStudyAccordionSummaryContent() {
		return this.page.locator('[id="prior"] .MuiAccordionSummary-content');
	}

	// Prior stiuidy card
	priorStudyCardRefferringPhysician() {
		return this.page.locator('[id="Visit Document"] [id="name"]');
	}

	priortudyCardCreationDateTime() {
		return this.page.locator('[id="Visit Document"] [id="dateTime"]');
	}

	priorStudyCardReportTitle() {
		return this.page.locator('[id="Visit Document"] [id="title"]');
	}

	priorStudyCardManagingOrganization() {
		return this.page.locator('[id="Visit Document"] [id="managingOrganization"]');
	}

	priorStudyCardDeleteBtn() {
		return this.page.locator('[id="Visit Document"] [data-testid="DeleteOutlineIcon"]');
	}

	priorStudyCardEditBtn() {
		return this.page.locator('[id="Visit Document"] [alt="edit-icon"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	// Prior final reportCard

	priorFinalCardRefferringPhysician() {
		return this.page.locator('#prior [id="Final Report"] [id="name"]');
	}

	priorFinalCardCreationDateTime() {
		return this.page.locator('#prior [id="Final Report"] [id="dateTime"]');
	}

	priorFinalCardReportTitle() {
		return this.page.locator('#prior [id="Final Report"] [id="title"]');
	}

	priorFinalCardManagingOrganization() {
		return this.page.locator('#prior [id="Final Report"] [id="managingOrganization"]');
	}

	priorFinalReportEditBtn() {
		return this.page.locator('#prior [id="Final Report"] [alt="edit-icon"]', { timeout: TIMEOUT_IN_MSEC1 });
	}

	// study Filter
	priorStudyFilter() {
		return this.page.locator('.css-19uj5av').getByText('Prior Studies');
	}

	currentStudyFilter() {
		return this.page.locator('.css-19uj5av').getByText('Current Study');
	}

	priorStudySection() {
		return this.page.locator('#prior');
	}

	currentStudySection() {
		return this.page.locator('[id="currentStudy"]');
	}

	/**
	 * Deletes all existing reports
	 * @param {number} reportsCount - The number of reports to delete
	 * @returns {Promise<void>}
	 */
	async deleteAllExistingReports(reportsCount) {
		if (reportsCount > 0) {
			for (let i = reportsCount - 1; i >= 0; i--) {
				await this.reportSelectCheckBox().nth(i).click({ force: true });
			}
			await this.reportDeleteBtn().dispatchEvent('mousedown', { force: true });
			await this.page.waitForTimeout(1000);
		}
	}

	async deleteReport() {
		await this.page.route('**/fhir/DiagnosticReport**', async route => {
			if (route.request().method() === 'DELETE') {
				await new Promise(resolve => setTimeout(resolve, 2000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.finalCardReferringPhysician().nth(0).hover();
		await this.reportCardDeleteBtn().nth(0).hover();
		await this.page.mouse.down();
		await this.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport', 'DELETE');
	}

	/**
	 * Deletes a preliminary report
	 * @returns {Promise<void>}
	 */
	async deletePreliminaryReport() {
		await this.page.route('**/DiagnosticReport/*', async route => route.continue());
		await this.reportCardReferringPhysician().hover();
		await this.preliminaryReportCardDeleteBtn().hover();
		await this.page.mouse.down();
		await this.apiWaitUtils.waitForAPI('DiagnosticReport', 'DELETE');
	}

	/**
	 * Deletes a study document
	 * @returns {Promise<void>}
	 * @throws {Error} If the delete request fails
	 */
	async deleteStudyDocument() {
		await this.page.route('**/DocumentReference/*', async route => route.continue());

		await this.studyCardRefferringPhysician().hover();
		await this.studyCardDeleteBtn().hover();
		const requestPromise = this.page.waitForResponse(
			response => response.url().includes('DocumentReference') && response.request().method() === 'DELETE'
		);
		await this.page.mouse.down();
		const deleteResponse = await requestPromise;

		if (!deleteResponse.ok()) {
			throw new Error(`Delete request failed with status ${deleteResponse.status()}`);
		}
		console.log('Delete request was successful');
		await this.page.mouse.up();
	}

	/**
	 * Validates a preliminary report card
	 * @param {string} name - The referring physician name
	 * @param {string} reportTitle - The report title
	 * @param {string} managingOrgName - The managing organization name
	 * @param {string} reportTxt - The report text
	 * @param {string} reportDate - The report date
	 * @returns {Promise<void>}
	 */
	async preliminaryReportCardValidation(name, reportTitle, managingOrgName, reportTxt, reportDate) {
		if (reportTxt !== 'skip') {
			await expect(this.newReportEditorTextAreaPerformance(), { timeout: 3000 }).toContainText(reportTxt);
			await expect(this.reportCardCreationDateTime().nth(0)).toContainText(reportDate);
		}
		await expect(this.reportCardReferringPhysician().nth(0)).toHaveText(name);
		await expect(this.reportCardReportTitle().nth(0)).toContainText(reportTitle);
	}

	/**
	 * Validates a final report card
	 * @param {string} name - The referring physician name
	 * @param {string} managingOrgName - The managing organization name
	 * @param {string} reportTxt - The report text
	 * @returns {Promise<void>}
	 */
	async finalReportCardValidation(name, managingOrgName, reportTxt) {
		await expect(this.finalCardCreationDateTime()).not.toHaveText('Date/Time');
		await expect(this.finalCardReferringPhysician()).toHaveText(name.toLowerCase());
		await expect(this.finalCardReportTitle()).toContainText('Final Report');
		await expect(this.pdfViewerArea()).toContainText(reportTxt);
	}

	/**
	 * Adds report text to editor from a file
	 * @returns {Promise<string>} The file content
	 * @throws {Error} If there's an error reading or processing the file
	 */
	async addReportTxtToEditorFromFile() {
		try {
			// Construct the file path and read file content
			const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/SameReportText.txt'));
			const fileContent = await fs1.readFile(filePath, 'utf-8');
			console.log('File content:', fileContent);
			// Route handling for API
			await this.page.route('**/fhir/DiagnosticReport?_count*', route => route.continue());
			// Fill the editor with the file content
			await this.page.fill('#TipTapProseMirrorEditorMain .ProseMirror', fileContent);
			await this.newReportEditorTextArea().pressSequentially('reportTxt');
			// Wait for the API request to complete
			await this.apiWaitUtils.waitForAPI('fhir/DiagnosticReport', 'POST');
			console.log('Content added and API call verified.');
			return fileContent;
		} catch (error) {
			console.error('Error in addReportTxtToEditorFromFile:', error);
			throw error;
		}
	}

	/**
	 * Adds a diagnostic report for the new editor
	 * @param {string} reportTxt - The report text to add
	 * @param {boolean} edit - Whether this is an edit operation
	 * @returns {Promise<void>}
	 */
	async addDiagnosticReportForNewEditor(reportTxt, edit) {
		await this.page.route('**/fhir/DiagnosticReport?*', async route => {
			if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
				await route.continue();
			} else {
				await route.continue();
			}
		});
		if (!edit) {
			await Promise.all([
				this.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport?', 'POST'),
				this.newReportEditorTextArea().pressSequentially(reportTxt),
			]);
		} else {
			await Promise.all([
				this.apiWaitUtils.waitForAPI('/save', 'PUT'),
				this.newReportEditorTextArea().pressSequentially(reportTxt),
			]);
		}
	}

	/**
	 * Opens the template manager
	 * @returns {Promise<void>}
	 */
	async openTemplateMgr() {
		await this.editorDotMenu().hover();
		await this.editorDotMenu().click();

		const shouldClickEditorDotMenu =
			(await this.page.locator('ul > li:has-text("Template Manager")').count()) === 0;

		if (shouldClickEditorDotMenu) {
			await this.editorDotMenu().click();
		}

		// Ensure route is set up before the action that triggers the request
		await this.page.route('**/template?_count*', async route => {
			await new Promise(resolve => setTimeout(resolve, 1000));
			await route.continue();
		});

		await Promise.all([
			// Wait for the  get template API request
			this.apiWaitUtils.waitForAPI('/template?_count', 'GET'),
			// Click the Template Manager option and wait for the API call
			this.templateManagerOption().click(),
		]);
	}

	headerTextArea() {
		return this.page.locator('#TipTapProseMirrorEditorHeader .ProseMirror');
	}

	headerSection() {
		return this.page.locator('#TipTapProseMirrorEditorHeader');
	}

	footerTextArea() {
		return this.page.locator('#TipTapProseMirrorEditorFooter .ProseMirror', { timeout: TIMEOUT_IN_MSEC1 });
	}

	footerSection() {
		return this.page.locator('[id="TipTapProseMirrorEditorFooter"]');
	}

	versionHistoryTxt() {
		return this.page.locator('.css-13moeg1');
	}

	versionHistoryEventIcon() {
		return this.page.locator('.css-9iedg7');
	}

	async verifyTemplateCard(
		reportID,
		templateText,
		templateName,
		managingOrgName,
		templateEdit,
		name,
		date,
		uploaded,
		bookmarksList
	) {
		await this.page.waitForTimeout(2000);
		if (!uploaded) {
			await expect(this.templatePreview()).toContainText(templateText);
		}
		await expect(this.templateName(reportID)).toContainText(templateName);
		await expect(this.templateOrg(reportID)).toContainText(name);
	}

	async openClosePreviewForTemplate(close) {
		if (!close) {
			await this.publishButton().hover();
			await this.previewBtn().click();
		} else {
			await this.previewBtn().hover();
			await this.previewBtn().click();
		}
	}

	async addEditPickList(picklistName, edit, options) {
		await this.page.waitForTimeout(4000);
		await this.page.route('**/fhir/CustomField?type=picklist*', async route => {
			await route.continue();
		});

		await this.bookmarkOpenCollapseBtn().click({ force: true });
		await this.apiWaitUtils.waitForAPI('/fhir/CustomField?type=picklist', 'GET');

		await this.pickListSettingBtn().click();

		if (!edit) {
			await this.deletePickLists();
			for (let index = 0; index < options.length; index++) {
				await this.addBtn().click();
				await this.pickListOptionsTxtField().nth(index).pressSequentially(options[index]);
			}

			await this.templateNameTxtField().clear();
			await this.templateNameTxtField().fill(picklistName);
			await this.page.route('**/fhir/CustomField', async route => {
				await route.continue();
			});
			await this.page.waitForTimeout(4000);
			await this.createPickListBtn().click({ force: true });
			await this.apiWaitUtils.waitForAPI('/fhir/CustomField', 'POST');
			await this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]').click();
		} else {
			await this.pickListInEditMode().nth(0).hover();
			await this.pickListEditBtn().click();

			for (let index = 0; index < options.length; index++) {
				await this.page.locator('[placeholder="option"]').nth(index).clear();
				await this.page.locator('[placeholder="option"]').nth(index).fill(options[index]);
			}

			await this.page.route('**/fhir/CustomField/*', async route => {
				await route.continue();
			});
			await this.page.waitForTimeout(4000);
			await this.page.locator('[data-cy="Update_"]').click();
			await this.apiWaitUtils.waitForAPI('/fhir/CustomField/', 'PUT');
			await this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]').click();
		}
	}

	async addCustomField(picklistName, edit) {
		await this.page.waitForTimeout(4000);
		await this.page.route('**/fhir/CustomField?type=field*', async route => {
			await route.continue();
		});

		await this.bookmarkOpenCollapseBtn().click({ force: true });
		await this.apiWaitUtils.waitForAPI('/fhir/CustomField?type=field', 'GET');

		await this.customFieldSettingBtn().click();

		if (!edit) {
			await this.deleteCustomfield();
			await this.addBtn().click();
			await this.templateNameTxtField().clear();
			await this.templateNameTxtField().fill(picklistName);
			await this.page.waitForTimeout(4000);

			await this.createPickListBtn().click({ force: true });
			await this.apiWaitUtils.waitForAPI('/fhir/CustomField', 'POST');

			await this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]').click();
		} else {
			await this.customFieldEditMode().nth(0).hover();
			await this.pickListEditBtn().click();

			await this.templateNameTxtField().clear();
			await this.templateNameTxtField().fill(picklistName);
			await this.page.route('**/fhir/CustomField/*', async route => {
				await route.continue();
			});
			await this.page.waitForTimeout(4000);
			await this.page.locator('[data-cy="Update_"]').click();
			await this.apiWaitUtils.waitForAPI('/fhir/CustomField/', 'PUT');

			await this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]').click();
		}
	}

	async verifyPL(pickListName, checkCustomField) {
		await this.page.waitForTimeout(4000);
		await this.bookmarkOpenCollapseBtn().click({ force: true });

		if (!checkCustomField) await this.pickListSettingBtn().click();
		else await this.customFieldSettingBtn().click();

		await this.page.waitForTimeout(3000);
		const searchField = await this.page.locator('[placeholder="Search"]').nth(2);
		await searchField.clear();
		await searchField.pressSequentially(pickListName);
		await expect(this.pickListInEditMode().nth(0)).toContainText(pickListName);
		await this.page.locator('[data-testid="KeyboardArrowLeftOutlinedIcon"]').click();
		await this.page.locator(`[id="${pickListName}"]`, { timeout: 60000 }).waitFor();
		// await searchField.clear();
	}

	async deletePickLists() {
		const count = await this.getElementCount('.css-1457yrt');
		if (count > 0) {
			for (let index = count; index > 0; index--) {
				await this.page.route('**/fhir/CustomField/*', async route => {
					await route.continue();
				});
				await this.pickListInEditMode()
					.nth(index - 1)
					.hover();
				await this.deleteBtn().click({ force: true });
				await this.apiWaitUtils.waitForAPI('/fhir/CustomField/', 'DELETE');
			}
		}
	}

	async deleteCustomfield() {
		const count = await this.getElementCount('.css-1wri7kj');
		if (count > 0) {
			for (let index = count; index > 0; index--) {
				await this.page.route('**/fhir/CustomField/*', async route => {
					await route.continue();
				});
				await this.customFieldEditMode()
					.nth(index - 1)
					.hover();
				await this.deleteBtn().click({ force: true });
				await this.apiWaitUtils.waitForAPI('/fhir/CustomField/', 'DELETE');
			}
		}
	}

	async selectBookmarkUsingSuggestionsToTiptapEditor(bookmarkName) {
		await this.newReportEditorTextArea().pressSequentially(`#${bookmarkName.split(' ')[0]}`);
		await this.page
			.locator('.BookmarkItems')
			.filter({ hasText: new RegExp(`^${bookmarkName}$`) })
			.click();
	}

	async addTemplateForNewEditor(
		templateTxt,
		headerText,
		footerText,
		managingOrgName,
		name,
		templateName,
		templateEdit,
		reportId,
		asNewTemplate,
		gender,
		bookmarksList
	) {
		const reportID = reportId;

		if (!templateEdit) {
			await this.openTemplateMgr();
			await this.validateTemplateToolbar(true);
		} else {
			await this.templateCard(reportID).click({ force: true });
			await this.templateEditBtn().click({ force: true });
		}

		await this.newReportEditorTextArea().waitFor();
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/SameReportText.txt'));
		const reportContent = await fs1.readFile(filePath, 'utf-8');
		console.log('File content:', reportContent);

		if (!templateEdit) {
			//Enable header and footer
			await this.page
				.locator('[data-testid="viewport-tiptap-running-placeholder-text"]')
				.nth(1)
				.click({ force: true });
			await this.bookmarkOpenCollapseBtn().click({ force: true });
			await this.page.waitForTimeout(3000);
			await this.newReportEditorTextArea().fill(reportContent);
			await this.page.waitForTimeout(3000);
			await this.dragAndDropBookmarkToTiptapEditor('Initial Cursor Position');
			await this.dragAndDropBookmarkToTiptapEditor('Patient Name');
			await this.dragAndDropBookmarkToTiptapEditor('Signature');
			await this.dragAndDropBookmarkToTiptapEditor('Patient ID');
			await this.addVerifyTableInHeader(false, bookmarksList);
			await this.bookmarkOpenCollapseBtn().click({ force: true });
			await this.openTemplateDrawerBtn().click({ force: true });
		} else {
			await this.newReportEditorTextArea().click();
			await this.newReportEditorTextArea().focus();

			await this.page.keyboard.down('Control');
			await this.page.keyboard.press('End');
			await this.page.keyboard.up('Control');
			await this.page.waitForTimeout(3000);
			await this.newReportEditorTextArea().pressSequentially(templateTxt);
			await this.newReportEditorTextArea().pressSequentially(templateTxt);
			await this.addVerifyTableInHeader(true, bookmarksList);
			await this.footerTextArea().click({ force: true });
			// It's causing flakyness in the test
			// const fileInput = await this.page.locator('input[data-testid="viewport-image-uploader"]').nth(2);
			// const imagePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/image.png'));
			// // Upload the file even if the input is hidden
			// await fileInput.setInputFiles(imagePath, { force: true });
		}

		await this.headerTextArea().click({ force: true });
		await this.page.keyboard.down('Control');
		await this.page.keyboard.press('End');
		await this.page.keyboard.up('Control');
		await this.headerTextArea().pressSequentially(headerText);
		await this.footerTextArea().click({ force: true });
		await this.footerTextArea().pressSequentially(footerText);
		// open the preview
		await this.openClosePreviewForTemplate(false);

		// Verify that the template preview contains the text
		const templatePreview = await this.page.locator('.EditorMain main').nth(1);
		await expect(templatePreview).toContainText(templateTxt);

		// Check that the elements exist within the preview
		await templatePreview.locator('[data-code="signature"]').scrollIntoViewIfNeeded({ behavior: 'smooth' });

		await expect(templatePreview.locator('[data-code="patientName"]')).toBeVisible();
		await expect(templatePreview.locator('[data-code="patientID"]')).toBeVisible();
		await expect(templatePreview.locator('[data-code="signature"]')).toBeVisible();

		// close the preview
		await this.openClosePreviewForTemplate(true);
		await this.openTemplateDrawerBtn().click({ force: true });
		console.log(`template is getting edited:${templateEdit}`);
		await this.fillPublishDrawerNPublish(templateName, templateEdit, asNewTemplate, gender, false, reportId);
	}

	async fillPublishDrawerNPublish(templateName, templateEdit, asNewTemplate, gender, skipGender, reportId) {
		await this.page.route('**/fhir/StudyStatus?**', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.publishButton().hover();
		await Promise.all([this.publishButton().click(), this.apiWaitUtils.waitForAPI('/fhir/StudyStatus?', 'GET')]);

		await this.templateNameTxtField().click();
		await this.templateNameTxtField().clear();
		await this.templateNameTxtField().fill(templateName);
		console.log(`template is getting edited:${templateEdit}`);

		if (!templateEdit) {
			await this.page.waitForTimeout(3000);
			await this.selectFromPopOver(this.templateStartStatusField(), 'ORDERED');
			await this.page.waitForTimeout(2000);
			await this.selectFromPopOver(this.templateToStatusField(), 'SIGNED');
			await this.filterRecordsByMultiSelectionColumn(this.templateModalitySelectField(), ['MR', 'CT']);
			if (!skipGender) {
				await this.filterRecordsByMultiSelectionColumn(this.templateBodyPartSelectField(), [
					'Acromioclavicular joint',
					'Abdomen',
				]);
				await this.selectFromPopOver(this.templateLateralitySelectField(), 'Bilateral');
				await this.selectFromPopOver(this.templateGenderSelectField(), gender);
			}
			await this.page.route('**/fhir/organization/*/template?_dc**', async route => {
				if (route.request().method() === 'POST') {
					await new Promise(resolve => setTimeout(resolve, 10000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
		} else {
			await expect(this.templateStartStatusField()).toContainText('ORDERED');
			await expect(this.templateToStatusField()).toContainText('SIGNED');
			await expect(this.page.locator('[aria-label="MR"]')).toBeVisible();
			await expect(this.page.locator('[aria-label="CT"]')).toBeVisible();
			if (!skipGender) {
				await expect(this.page.locator('[aria-label="Acromioclavicular joint"]')).toBeVisible();
				await expect(this.page.locator('[aria-label="Abdomen"]')).toBeVisible();
				await expect(this.templateGenderSelectField()).toContainText(gender);
				await expect(this.templateLateralitySelectField()).toContainText('Bilateral');
			}

			await this.page.route(`**/fhir/organization/template/${reportId}`, async route => route.continue());
		}

		if (!asNewTemplate) {
			await this.templatePublishBtn().click();
		} else {
			await this.page.locator('[data-cy="ArrowDropDownIcon"]').click();
			await this.templatePublishAsNewTemplateBtn().click();
		}
	}

	async loadTemplateinEditor(reportId, newTemplateTxt, headerText, footerText, bookmarksList) {
		await this.page.route('**/fhir/DiagnosticReport?_count=50&page=1&_dc*', async route => route.continue());
		await Promise.all([
			this.templateLoad(reportId),
			this.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport?_count=50&page=1&_dc', 'POST'),
		]);
		await expect(this.newReportEditorTextArea()).toContainText(newTemplateTxt);
		await expect(this.newReportEditorTextArea().locator('[data-code="patientName"]')).toHaveCount(1);
		await expect(this.newReportEditorTextArea().locator('[data-code="patientID"]')).toHaveCount(1);
		await expect(this.newReportEditorTextArea().locator('[data-type="signature"]')).toHaveCount(1);
		if (!(typeof bookmarksList === 'undefined')) await this.addVerifyTableInHeader(true, bookmarksList);
		await expect(this.headerTextArea()).toContainText(headerText);
		await expect(this.footerTextArea()).toContainText(footerText);
	}

	async templateLoad(reportId) {
		await this.page.waitForTimeout(TIMEOUT_IN_MSEC1);
		await this.page.route('**/template?_count=50&criteria=*', async route => {
			if (route.request().method() === 'GET') {
				await new Promise(resolve => setTimeout(resolve, 2000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.reportCardReportTitle().hover();
		await Promise.all([
			await this.templateIcon().click({ force: true }),
			(async () => {
				const searchIconCount = await this.page.locator(`[aria-label="Search Template"]`).count();
				if (searchIconCount === 0) {
					await this.templateIcon().click({ force: true });
				}
			})(),
			this.apiWaitUtils.waitForAPI(`/template?_count=50&criteria=`, 'GET'),
		]);
		await Promise.all([
			this.templateCard(reportId).click(),
			this.apiWaitUtils.waitForAPI(`/fhir/Organization/template/${reportId}/TemplateContent?`, 'GET'),
		]);
	}

	async deleteTemplate(reportId) {
		await this.page.route(`**/fhir/Organization/template/${reportId}`, async route => route.continue());

		if ((await this.getElementCount('.css-trh608')) === 0) {
			await this.openTemplateMgr();
		}

		await this.templateCard(reportId).hover();
		await this.templateDelete(reportId).hover();
		await this.page.mouse.down();
		await this.apiWaitUtils.waitForAPI(`/fhir/Organization/template/${reportId}`, 'DELETE');
	}

	async deleteMultipleTemplates(reportId) {
		// Open the template manager if needed
		if ((await this.getElementCount('.css-trh608')) === 0) {
			await this.openTemplateMgr();
		}

		// Set up request interception once before the loop
		await this.page.route(`**/fhir/Organization/template/**`, async route => {
			const url = route.request().url();
			if (reportId.some(id => url.includes(id))) {
				await route.continue();
			}
		});

		// Loop through each reportId to perform the actions
		for (const element of reportId) {
			await this.page
				.locator(`[id="TemplateCard_${element}"] [data-testid="navigator-card-toggle-select"]`)
				.click({ force: true });
		}

		// Ensure that the correct number of templates is selected
		await expect(this.page.locator('.css-oq2bv9')).toContainText(`${reportId.length}`);

		// Trigger the delete action
		await this.page.locator('.css-o5or3m [data-testid="DeleteOutlineIcon"]').hover();
		await this.page.mouse.down();

		// Wait for the DELETE requests to be triggered and processed
		await Promise.all(
			reportId.map(element => this.apiWaitUtils.waitForAPI(`/fhir/Organization/template/${element}`, 'DELETE'))
		);
	}

	async uploadDocumentInStudyList(documentName, final) {
		const filePath = path.relative(process.cwd(), path.join(__dirname, '../TestData/Upload.pdf'));
		console.log('filePath');
		console.log(filePath);
		await this.page.setInputFiles('.study-navigator-content input[type="file"]', filePath);
		await this.page.locator('[placeholder="Enter Name"]').clear();
		await this.page.locator('[placeholder="Enter Name"]').fill(documentName);
		await this.page.route('**/fhir/fhir?studyuid*', async route => {
			if (route.request().method() === 'POST') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		if (final) await this.page.locator('[name="Report"]').click();
		await this.page.locator('button:has-text("UPLOAD")').click();
		const proceedBtn = this.page.locator('#proceed-btn');
		this.page.waitForTimeout(2000);
		// Check if the button exists on the page.
		if ((await proceedBtn.count()) > 0) {
			if ((await proceedBtn.isVisible()) && (await proceedBtn.isEnabled())) {
				await proceedBtn.click();
			} else {
				console.warn('Proceed button exists but is either not visible or not enabled.');
			}
		}
		await this.apiWaitUtils.waitForAPI('/fhir/fhir?studyuid', 'POST');
	}

	async filterRecordsBySingleColumn(element, criteria) {
		await element()
			.click({ force: true })
			.clear()
			.pressSequentially(criteria.trim().toLowerCase())
			.waitForTimeout(6000);
		await this.page.locator(`text=${criteria}`).click();
	}

	async selectFromPopOver(element, criteria) {
		await element.click();
		await this.page
			.locator('.MuiPaper-root > .MuiList-root li', { timeout: TIMEOUT_IN_MSEC2 })
			.filter({ hasText: new RegExp(`^${criteria}$`) })
			.scrollIntoViewIfNeeded();
		await this.page
			.locator('.MuiPaper-root > .MuiList-root li', { timeout: TIMEOUT_IN_MSEC1 })
			.filter({ hasText: new RegExp(`^${criteria}$`) })
			.click({ force: true });
	}

	async filterRecordsByMultiSelectionColumn(element, criteria) {
		await element.click();
		for (const criterion of criteria) {
			await this.page
				.locator('.MuiAutocomplete-listbox li', { timeout: TIMEOUT_IN_MSEC1 })
				.filter({ hasText: new RegExp(`^${criterion}$`) })
				.click();
		}

		await element.click({ force: true });
	}

	async markReportAsCritical(remove) {
		try {
			// Unroute all requests first to avoid conflicts
			await this.page.unroute('**');

			// Set up specific routes for the required endpoints
			await this.page.route('**/fhir/ImagingStudy/*', async route => route.continue());
			await this.page.route('**/fhir/DiagnosticReport/*', async route => route.continue());

			// Open the editor menu
			await this.editorDotMenu().click();

			// Set up API wait promises before clicking
			const apiWaitPromises = [];
			if (!remove) {
				// Mark as critical
				apiWaitPromises.push(
					this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy/', 'PATCH'),
					this.apiWaitUtils.waitForAPI('/save', 'PUT')
				);
			} else {
				// Remove critical status
				apiWaitPromises.push(
					this.apiWaitUtils.waitForAPI('/fhir/DiagnosticReport', 'PUT'),
					this.apiWaitUtils.waitForAPI('/fhir/ImagingStudy/', 'PUT')
				);
			}

			// Perform the critical finding operation and wait for API calls
			await Promise.all([await this.criticalFindingMarkbtn().click(), ...apiWaitPromises]);
		} catch (error) {
			throw new Error(`Failed to ${remove ? 'remove' : 'set'} critical status: ${error.message}`);
		}
	}

	async reportPrint() {
		await this.page.locator('[data-testid="PrintOutlinedIcon"]').click({ force: true });
		await this.page.locator('text=Cancel').click();
	}

	async openVersionHistory() {
		await this.editorDotMenu().click();
		await this.versionHistoryOption().click({ force: true });
	}

	checkFinalReportCard() {
		return this.page.locator('[id="Final Report"] [data-testid="navigator-card-toggle-select"]');
	}

	checkStudyCard() {
		return this.page.locator('[id="Visit Document"] [data-testid="navigator-card-toggle-select"]');
	}

	checkPreliminaryReportCard() {
		return this.page.locator('[id="Preliminary Report"] [data-testid="navigator-card-toggle-select"]');
	}

	multiDownloadBtn() {
		return this.page.locator('[data-testid="DownloadOutlinedIcon"]');
	}

	deleteBtn() {
		return this.page.locator('[data-testid="DeleteOutlineIcon"]');
	}

	multideleteBtn() {
		return this.page.locator('.css-o5or3m [data-testid="DeleteOutlineIcon"]');
	}

	async validateToolbar(report) {
		try {
			// Ensure screenshots directory exists
			const screenshotsDir = './screenshots-testdata';
			if (!fs.existsSync(screenshotsDir)) {
				console.log('Creating screenshots directory...');
				fs.mkdirSync(screenshotsDir, { recursive: true });
			}

			// Take a screenshot of the toolbar
			console.log('Taking toolbar screenshot...');
			const toolbarOptions = await this.page.locator('[data-testid="toolbar-wrapper"]').nth(1);
			const editorDotMenuOptions = await this.page.locator('[role="menu"]').nth(1);
			const screenshotBuffer = await toolbarOptions.screenshot();
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const screenshotPath = path.join(screenshotsDir, `toolbar_${report}_${timestamp}.png`);
			fs.writeFileSync(screenshotPath, screenshotBuffer);
			console.log(`Screenshot saved to: ${screenshotPath}`);

			// Attach the screenshot to the test
			try {
				console.log('Attempting to attach screenshot to test...');
				if (typeof this.testInfo.attach === 'function') {
					await this.testInfo.attach('toolbar-screenshot', {
						path: screenshotPath,
						contentType: 'image/png',
						name: `Toolbar Screenshot (${report})`,
					});
					console.log(`Screenshot attached successfully: ${screenshotPath}`);
				} else if (typeof this.testInfo.info === 'function') {
					await this.testInfo.info('toolbar-screenshot', {
						path: screenshotPath,
						contentType: 'image/png',
						name: `Toolbar Screenshot (${report})`,
					});
					console.log(`Screenshot info added successfully: ${screenshotPath}`);
				} else {
					console.error('No suitable method found for attaching files to test');
				}
			} catch (attachError) {
				console.error('Error attaching screenshot:', attachError);
				console.error('Error details:', {
					message: attachError.message,
					stack: attachError.stack,
					test: this.testInfo,
					hasAttach: typeof this.testInfo?.attach === 'function',
					hasInfo: typeof this.testInfo?.info === 'function',
				});
			}

			// Rest of the validation logic...
			console.log('Starting toolbar validation logic...');
			await this.editorDotMenu().click({ force: true });
			await this.page.waitForTimeout(2000);
			console.log('Clicked editor dot menu');

			console.log('Found toolbar and menu options');

			const blankToolbarImgPath = path.join(__dirname, '../../screenshots-testdata/BlankToolbar.png');
			const blankMoreOptionsImgPath = path.join(__dirname, '../../screenshots-testdata/blankMoreOptions.png');
			const preliminaryReportToolbarImgPath = path.join(
				__dirname,
				'../../screenshots-testdata/preliminaryReportToolbar.png'
			);
			const preliminaryReportMoreOptionsImgPath = path.join(
				__dirname,
				'../../screenshots-testdata/preliminaryReportMoreOptions.png'
			);
			console.log('Image paths prepared');

			if (report === 'blank') {
				console.log('Processing blank report type...');
				await expect(this.criticalFindingOption()).not.toBeVisible();
				console.log('Starting image comparison for blank toolbar...');
				const result = await this.aiUtils.compareImages(toolbarOptions, blankToolbarImgPath, 'blankToolbar');
				console.log('Blank toolbar comparison result:', result);
				await expect(result.hasDifferences).toBe(false);

				console.log('Starting image comparison for blank menu options...');
				const result2 = await this.aiUtils.compareImages(
					editorDotMenuOptions,
					blankMoreOptionsImgPath,
					'blankMoreOptions'
				);
				console.log('Blank menu options comparison result:', result2);
				await expect(result2.hasDifferences).toBe(false);

				await expect(this.signBtn()).not.toBeVisible();
				await expect(this.nextStudyBtn()).not.toBeVisible();
				await expect(this.BookmarkOption()).toBeVisible();
				//await expect(this.vrDicationBtn()).toBeVisible();
				console.log('Blank report validation completed');
			} else {
				await expect(this.criticalFindingOption()).toBeVisible();
				await expect(this.versionHistoryOption()).toBeVisible();
			}

			if (report === 'preliminary') {
				console.log('Processing preliminary report type...');
				console.log('Starting image comparison for preliminary toolbar...');
				const result5 = await this.aiUtils.compareImages(
					toolbarOptions,
					preliminaryReportToolbarImgPath,
					'preliminaryToolbar'
				);
				console.log('Preliminary toolbar comparison result:', result5);
				await expect(result5.hasDifferences).toBe(false);
				console.log('Starting image comparison for preliminary menu options...');
				const result6 = await this.aiUtils.compareImages(
					editorDotMenuOptions,
					preliminaryReportMoreOptionsImgPath,
					'preliminaryMoreOptions'
				);
				console.log('Preliminary menu options comparison result:', result6);
				await expect(result6.hasDifferences).toBe(false);
				await expect(this.BookmarkOption()).toBeVisible();
				//await expect(this.vrDicationBtn()).toBeVisible();
				await expect(this.signBtn()).toBeVisible();
				await expect(this.nextStudyBtn()).toBeVisible();
			}

			await expect(this.templateManagerOption()).toBeVisible();
			await expect(this.editSignatureOption()).toBeVisible();
			await this.page.keyboard.press('Escape');
		} catch (error) {
			console.error('Error in validateToolbar:', error);
			console.error('Error stack:', error.stack);
			throw error;
		}
	}

	async signDiagnosticReport() {
		const count = await this.getElementCount('[data-type="signature"]');
		if (count === 0) {
			await this.signBtn().hover();
			await this.signBtn().click();
			await this.page.route('**/fhir/DiagnosticReport/*/save', async route => route.continue());
			await this.dragAndDropBookmarkToTiptapEditor('Signature');
			await this.apiWaitUtils.waitForAPI('/save', 'PUT');
			await expect(this.page.locator('[data-type="signature"]')).toBeVisible();
		}

		await this.page.route('**?callDone=true', async route => route.continue());
		await this.page.route('**/ImagingStudyWorklist/elk*', async route => route.continue());
		await this.signBtn().hover();
		await this.signBtn().click({ force: true });
		await Promise.all([
			this.apiWaitUtils.waitForAPI('/ImagingStudyWorklist/elk', 'GET'),
			this.apiWaitUtils.waitForAPI('?callDone=true', 'PUT'),
		]);
	}

	async signAndNextStudy() {
		const count = await this.getElementCount('[data-type="signature"]');
		if (count === 0) {
			await this.nextStudyBtn().hover();
			await this.nextStudyBtn().click();
			await this.page.route('**/fhir/DiagnosticReport/*/save', async route => route.continue());
			await Promise.all([
				this.dragAndDropBookmarkToTiptapEditor('Signature'),
				this.apiWaitUtils.waitForAPI('/save', 'PUT'),
			]);
			await expect(this.page.locator('[data-type="signature"]')).toBeVisible();
		}

		await this.page.route('**?callDone=true', async route => route.continue());
		await this.page.route('**/ImagingStudyWorklist/elk*', async route => route.continue());

		await this.nextStudyBtn().hover();
		await this.nextStudyBtn().click({ force: true });

		await Promise.all([
			this.apiWaitUtils.waitForAPI('/ImagingStudyWorklist/elk', 'GET'),
			this.apiWaitUtils.waitForAPI('?callDone=true', 'PUT'),
		]);
	}

	async signDiagnosticReportMM(mainPageContext, signFromIV, poManager) {
		const count = await this.getElementCount('[data-type="signature"]');
		if (count === 0) {
			await this.signBtn().hover();
			await this.signBtn().click();
			await this.page.route('**/fhir/DiagnosticReport/*/save', async route => route.continue());
			await Promise.all([
				this.dragAndDropBookmarkToTiptapEditor('Signature'),
				this.apiWaitUtils.waitForAPI('/save', 'PUT'),
			]);
			await expect(this.page.locator('[data-type="signature"]')).toBeVisible();
		}

		await this.page.route('**?callDone=true', async route => route.continue());
		await mainPageContext.route('**/ImagingStudyWorklist/elk*', async route => route.continue());
		if (!signFromIV) {
			await this.signBtn().hover();
			await this.signBtn().click({ force: true });
		} else {
			await poManager.imageViewer.signBtnIV().click({ force: true });
		}
		await Promise.all([
			poManager.apiWaitUtils.waitForAPI('/ImagingStudyWorklist/elk', 'GET'),
			this.apiWaitUtils.waitForAPI('?callDone=true', 'PUT'),
		]);
	}

	async signAndNextStudyMM(mainPageContext, signFromIV, poManager) {
		const signatureCount = await this.getElementCount('[data-type="signature"]');
		if (signatureCount === 0) {
			console.log(signatureCount);
			await this.nextStudyBtn().hover();
			await this.nextStudyBtn().click({ force: true });

			// Intercept API call for report update
			await this.page.route('**/fhir/DiagnosticReport/*/save', async route => route.continue());
			await Promise.all([
				this.dragAndDropBookmarkToTiptapEditor('Signature'),
				this.apiWaitUtils.waitForAPI('/save', 'PUT'),
			]);

			await expect(this.page.locator('[data-type="signature"]')).toBeVisible();
		}

		// await mainPageContext.route('**?callDone=true', async route => route.continue());
		await this.page.route('**/ImagingStudyWorklist/elk*', async route => route.continue());
		await this.page.route('**/ImagingStudyWorklist/elk/*/nextstudy?*', async route => route.continue());

		if (!signFromIV) {
			// Click the next study button
			await this.nextStudyBtn().hover();
			await Promise.all([
				// poManager.apiWaitUtils.waitForAPI('?callDone=true', 'PUT'),
				this.apiWaitUtils.waitForAPI('nextstudy?', 'GET'),
				await this.nextStudyBtn().click({ force: true }),
			]);
		} else {
			await Promise.all([
				await poManager.imageViewer.nextStudyBtnIV().click({ force: true }),
				// poManager.apiWaitUtils.waitForAPI('?callDone=true', 'PUT'),
				this.apiWaitUtils.waitForAPI('nextstudy?', 'GET'),
			]);
		}
	}

	async dragAndDropBookmarkToTiptapEditor(bookmarkName) {
		try {
			const elements = await this.page.$$('[id="TipTapProseMirrorEditorMain"] div p');
			if (elements.length > 0) {
				// Interact with the search field to locate the bookmark
				await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').click();
				await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').clear();
				await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').fill(bookmarkName);

				await this.page
					.locator(`[data-testid="bookmark-item-label"]`)
					.filter({ hasText: new RegExp(`^${bookmarkName}$`) })
					.hover();
				await this.page.mouse.down();
				// Select the last element
				const lastElement = elements[elements.length - 1];
				await lastElement.hover();

				await this.page.mouse.up();

				console.log('Drag and drop performed successfully.');
			} else {
				console.log('No matching elements found.');
			}
		} catch (error) {
			console.error('Error during drag and drop:', error);
		}
	}

	async dragAndDropBookmarkToElement(bookmarkName, element) {
		try {
			// Interact with the search field to locate the bookmark
			const searchField = this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]');
			await searchField.click();
			await searchField.clear();
			await searchField.type(bookmarkName);

			// Locate the bookmark by name and hover over it
			const bookmarkLocator = this.page
				.locator('[data-testid="bookmark-item-label"]')
				.filter({ hasText: new RegExp(`^${bookmarkName}$`) });

			await bookmarkLocator.hover();
			await this.page.mouse.down();

			// Hover over the target element and drop the bookmark
			await element.hover();
			const box = await element.boundingBox();
			if (box) {
				const { x, y, width, height } = box;
				// Move the mouse to the bottom-right corner of the target element
				await this.page.mouse.move(x + width, y + height);
			}

			await this.page.mouse.up();

			console.log('Drag and drop performed successfully.');
		} catch (error) {
			console.error('Error during drag and drop:', error);
		}
	}

	async validateTemplateToolbar(empty) {
		if (!empty) {
			await this.publishButton().hover();
			await expect(this.publishButton()).toBeVisible();
			await expect(this.previewBtn()).toBeVisible();
		} else {
			await expect(this.publishButton()).not.toBeVisible();
			await expect(this.previewBtn()).not.toBeVisible();
		}
		await expect(this.pageSetupBtn()).toBeVisible();
	}

	async templateSearch(templateName) {
		await this.page.route('**/fhir/Organization/*/template?_count*', async route => route.continue());
		await this.searchTemplateTextField().pressSequentially(templateName);
		await this.apiWaitUtils.waitForAPI('/template?_count', 'GET');
	}

	async diagnosticReportTitleCategoryChange(title, category, categoryChange, reportId) {
		if (category === 'FR') await this.finalReportEditBtn().click({ force: true });
		if (category === 'SD') await this.studyCardEditBtn().click({ force: true });
		if (category === 'PR') {
			await this.page.waitForTimeout(2000);
			await this.reportCardReportTitle().hover();
			await this.preliminaryReportEditBtn().click({ force: true });
		}
		if (category === 'T') await this.templateCardEditBtn(reportId).click({ force: true });

		await this.page.locator('.css-m53ae2').clear();
		await this.page.locator('.css-m53ae2').fill(title);

		if (categoryChange && category === 'PR') {
			await this.page.locator('.css-16ucnoo').click();
			await this.page.locator('[name="Document"]').click();
		}
		await this.page.route('**/fhir/DiagnosticReport**', async route => {
			if (route.request().method() === 'PUT') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.page.route('**/fhir/DocumentReference**', async route => {
			if (route.request().method() === 'PUT') {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.page.locator('[data-testid="CheckIcon"]').click();
		if (category === 'FR' || (category === 'PR' && !categoryChange)) {
			await this.apiWaitUtils.waitForAPI('fhir/DiagnosticReport', 'PUT');
		}

		if (category === 'SD') {
			await this.apiWaitUtils.waitForAPI('fhir/DocumentReference', 'PUT');
		}
	}

	async addVerifyTable(modifyText, verify) {
		if (!verify) {
			await this.newReportEditorTextArea().clear();
			await this.newReportEditorTextArea().pressSequentially(modifyText);
			await this.page.waitForTimeout(TIMEOUT_IN_MSEC1);
			await this.newReportEditorTextArea().locator(`text=${modifyText}`).nth(0).press('Control+A');
			await this.newReportEditorTextArea().locator(`text=${modifyText}`).nth(0).click({ button: 'right' });
			await this.fontToolbarInsertOptionButton().click();
			await this.fontToolbarTableOptions().click();
			await this.page.locator('.css-1cmld0g').nth(8).click({ force: true });

			for (let index = 0; index < 9; index++) {
				await this.page.locator('tr td p').nth(index).fill(`cell${index}`);
			}
		} else {
			for (let index = 0; index < 9; index++) {
				await expect(this.page.locator('tr td p').nth(index)).toHaveText(`cell${index}`);
			}
		}
	}

	async addVerifyTableInHeader(verify, bookmarksList) {
		if (!verify) {
			await this.headerTextArea().click({ force: true });
			await this.headerTextArea().clear(); // Clear the text area
			await this.headerTextArea().click({ button: 'right' }); // Right-click on the text area
			await this.fontToolbarInsertOptionButton().click(); // Click on the insert option from the toolbar
			await this.fontToolbarTableOptions().click(); // Click to insert a table
			await this.page.locator('.css-1cmld0g').nth(8).click(); // Click on the nth element, forcing it

			// Loop through each cell in the table and fill with bookmarks
			for (let index = 0; index < 9; index++) {
				await this.headerTextArea().locator('tr td p').nth(index).fill(`${bookmarksList[index]}`);
				// Drag and drop the corresponding bookmark into each cell
				await this.dragAndDropBookmarkToElement(
					`${bookmarksList[index]}`,
					this.headerTextArea().locator('tr td p').nth(index)
				);
			}
		} else {
			// Loop through each cell and verify the text matches
			for (let index = 0; index < 9; index++) {
				// Check if the text contains the expected value
				await expect(this.headerTextArea().locator('tr td p').nth(index)).toContainText(
					`${bookmarksList[index]}`
				);

				// Check if the aria-label contains the expected value
				await expect(
					this.headerTextArea().locator(`tr td p [aria-label="${bookmarksList[index]}"]`)
				).toHaveCount(1);
			}
		}
	}

	async downloadPreliminaryReport() {
		await this.checkPreliminaryReportCard().click({ force: true });
		const download1Promise = this.page.waitForEvent('download');
		await this.multiDownloadBtn().click(); // Trigger the first download

		// Wait for the first download to start
		const download1 = await download1Promise;

		const filename1 = await download1.suggestedFilename();

		console.log(`Download 1 suggested filename: ${filename1}`);

		// Define download paths
		const downloadPath1 = path.join(__dirname, 'downloads', filename1);
		// Save the first downloaded file
		await download1.saveAs(downloadPath1);
		console.log('First file downloaded:', downloadPath1);

		// Save the second downloaded file

		// Verify filenames contain expected names
		await expect(filename1).toContain('Preliminary Report');

		// Verify the first file exists and read its content
		if (fs.existsSync(downloadPath1)) {
			console.log('File 1 downloaded successfully:', downloadPath1);
			const fileContent1 = fs.readFileSync(downloadPath1, 'utf8');
			console.log('File 1 content:', fileContent1);
		} else {
			console.log('File 1 download failed');
		}
	}

	async deletePreliminaryReportUsingMultiDelete() {
		await this.checkPreliminaryReportCard().click({ force: true });

		// Intercept and allow the DELETE requests for both DiagnosticReport
		await this.page.route('**/DiagnosticReport/*', async route => {
			await route.continue();
		});

		// Trigger the delete action that sends both DELETE requests
		await this.multideleteBtn().dispatchEvent('mousedown', { force: true });

		// Wait for  DELETE requests to complete concurrently
		await this.apiWaitUtils.waitForAPI('DiagnosticReport', 'DELETE');
	}

	async multiDownload(finalReportName, documentName) {
		// Click to open the final report card and wait for the download event
		await this.checkFinalReportCard().click({ force: true });
		const download1Promise = this.page.waitForEvent('download');
		await this.multiDownloadBtn().click(); // Trigger the first download

		// Wait for the first download to start
		const download1 = await download1Promise;

		// Click to open the study card and trigger the second download
		await this.checkStudyCard().click({ force: true });
		const download2Promise = this.page.waitForEvent('download');
		await this.multiDownloadBtn().click(); // Trigger the second download

		// Wait for the second download to start
		const download2 = await download2Promise;

		// Get filenames suggested by the browser
		const filename1 = await download1.suggestedFilename();
		const filename2 = await download2.suggestedFilename();

		console.log(`Download 1 suggested filename: ${filename1}`);
		console.log(`Download 2 suggested filename: ${filename2}`);

		// Define download paths
		const downloadPath1 = path.join(__dirname, 'downloads', filename1);
		const downloadPath2 = path.join(__dirname, 'downloads', filename2);

		// Save the first downloaded file
		await download1.saveAs(downloadPath1);
		console.log('First file downloaded:', downloadPath1);

		// Save the second downloaded file
		await download2.saveAs(downloadPath2);
		console.log('Second file downloaded:', downloadPath2);

		// Verify filenames contain expected names
		await expect(filename1).toContain(finalReportName);
		await expect(filename2).toContain(documentName);

		// Verify the first file exists and read its content
		if (fs.existsSync(downloadPath1)) {
			console.log('File 1 downloaded successfully:', downloadPath1);
			const fileContent1 = fs.readFileSync(downloadPath1, 'utf8');
			console.log('File 1 content:', fileContent1);
		} else {
			console.log('File 1 download failed');
		}

		// Verify the second file exists and read its content
		if (fs.existsSync(downloadPath2)) {
			console.log('File 2 downloaded successfully:', downloadPath2);
			const fileContent2 = fs.readFileSync(downloadPath2, 'utf8');
			console.log('File 2 content:', fileContent2);
		} else {
			console.log('File 2 download failed');
		}
	}

	async multiDelete() {
		await this.checkFinalReportCard().click({ force: true });
		await this.checkStudyCard().click({ force: true });

		// Intercept and allow the DELETE requests for both DocumentReference and DiagnosticReport
		await this.page.route('**/DocumentReference/*', async route => {
			await route.continue();
		});
		await this.page.route('**/DiagnosticReport/*', async route => {
			await route.continue();
		});

		// Trigger the delete action that sends both DELETE requests
		await this.multideleteBtn().dispatchEvent('mousedown', { force: true });

		// Wait for both DELETE requests to complete concurrently
		await Promise.all([
			this.apiWaitUtils.waitForAPI('DiagnosticReport', 'DELETE'),
			this.apiWaitUtils.waitForAPI('DocumentReference', 'DELETE'),
		]);

		console.log('Both DELETE requests have been completed successfully.');
	}

	async amendReport() {
		await this.amendBtn().click();
		await this.amendRequestTxtBox().pressSequentially('Amend report');
		await this.page.route('**&originalform=true', async route => {
			await new Promise(resolve => setTimeout(resolve, 2000));
			await route.continue();
		});
		await this.page.route('**/save', async route => {
			await new Promise(resolve => setTimeout(resolve, 3000));
			await route.continue();
		});
		await this.page.route('**/fhir/DiagnosticReport/*/ReportContent?*&originalform=true', async route => {
			await route.continue();
		});
		await Promise.all([
			this.SubmitAmendRequestBtn().click(),
			this.apiWaitUtils.waitForAPI('&originalform=true', 'GET'),
		]);
		await this.page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await Promise.all([
			this.newReportEditorTextArea().pressSequentially('{enter}Amending the final report after upload', {
				force: true,
			}),
			this.apiWaitUtils.waitForAPI('/save', 'PUT'),
		]);

		await expect(this.amendingIcon()).toBeVisible();
		await this.signBtn().hover();
		await this.signBtn().click();
		await this.page.route('**/fhir/DiagnosticReport/*/save', async route => {
			await route.continue();
		});
		await this.dragAndDropBookmarkToTiptapEditor('Amendment Signature');
		await this.apiWaitUtils.waitForAPI('/save', 'PUT');
		await this.signBtn().hover();
		await this.signBtn().click();
	}

	async amendReportCheck() {
		await this.amendBtn().click();
		await this.amendRequestTxtBox().pressSequentially('Amend report');
		await this.page.route('**&originalform=true', async route => {
			await new Promise(resolve => setTimeout(resolve, 2000));
			await route.continue();
		});

		await Promise.all([
			this.SubmitAmendRequestBtn().click(),
			this.apiWaitUtils.waitForAPI('&originalform=true', 'GET'),
			// this.apiWaitUtils.waitForAPI('/save', 'PUT'),
		]);
		await this.page.route('**/save', async route => {
			await route.continue();
		});
		await Promise.all([
			await this.newReportEditorTextArea().pressSequentially('{enter}Amending the final report after upload', {
				force: true,
			}),

			await expect(this.amendingIcon()).toBeVisible(),
			this.apiWaitUtils.waitForAPI('/save', 'PUT'),
		]);
	}

	async addTemplateWithHFMargin(
		templateTxt,
		headerText,
		footerText,
		managingOrgName,
		name,
		templateName,
		templateEdit,
		reportId,
		deleteHF,
		margins
	) {
		const reportID = reportId;

		if (!templateEdit) {
			await this.openTemplateMgr();
		} else {
			await this.page.waitForTimeout(3000);

			await this.templateCard(reportID).click();
			await this.page.waitForTimeout(3000);
			await this.page.route(`**/fhir/Organization/template/${reportId}*`, async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 3000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await Promise.all([
				this.templateEditBtn().click(),
				this.apiWaitUtils.waitForAPI(`/fhir/Organization/template/${reportId}`, 'GET'),
			]);
		}

		await this.newReportEditorTextArea().waitFor();

		if (!templateEdit) {
			await this.page.locator('[data-testid="viewport-tiptap-running-placeholder-text"]').nth(1).click();
			console.log(margins);
			await this.page.locator('[data-testid="AssignmentOutlinedIcon"]').nth(1).click();
			await this.page.locator('.css-5lld3g').nth(0).fill(margins.headerMargin);
			await this.page.locator('.css-5lld3g').nth(1).fill(margins.footerMargin);
			await this.page.locator('[data-testid="CheckIcon"]').click();
			await this.page.waitForTimeout(6000);

			await this.pageSetupBtn().click();
			await this.page.locator('[name="margin-top"]').clear();
			await this.page.locator('[name="margin-top"]').fill(margins.pageTopMargin);
			await this.page.locator('[name="margin-bottom"]').clear();
			await this.page.locator('[name="margin-bottom"]').fill(margins.pageBottomMargin);
			await this.page.locator('[name="margin-left"]').clear();
			await this.page.locator('[name="margin-left"]').fill(margins.pageLeftMargin);
			await this.page.locator('[name="margin-right"]').clear();
			await this.page.locator('[name="margin-right"]').fill(margins.pageRightMargin);
			await this.page.locator('[type="submit"]').click();

			await this.openTemplateDrawerBtn().click({ force: true });
			await this.newReportEditorTextArea().fill(templateTxt);

			await this.headerTextArea().click({ force: true });
			await this.headerTextArea().pressSequentially(headerText, { force: true });
			await this.footerTextArea().click({ force: true });
			await this.footerTextArea().pressSequentially(footerText, { force: true });
			await this.bookmarkOpenCollapseBtn().click({ force: true });
			await this.dragAndDropBookmarkToTiptapEditor('Initial Cursor Position');
			await this.dragAndDropBookmarkToTiptapEditor('Patient ID');
			await this.dragAndDropBookmarkToTiptapEditor('Patient Name');
			await this.dragAndDropBookmarkToTiptapEditor('Signature');

			await expect(this.headerSection()).toHaveCSS(
				'padding-top',
				`${(37.7953 * margins.headerMargin).toFixed(3)}px`
			);
			await expect(this.footerSection()).toHaveCSS(
				'padding-bottom',
				`${(37.7953 * margins.footerMargin).toFixed(3)}px`
			);
			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-top',
			// 	`${(37.7953 * margins.pageTopMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-right',
				`${(37.7953 * margins.pageRightMargin).toFixed(3)}px`
			);
			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-bottom',
			// 	`${(37.7953 * margins.pageBottomMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-left',
				`${(37.7953 * margins.pageLeftMargin).toFixed(3)}px`
			);
		} else {
			await expect(this.headerSection()).toHaveCSS(
				'padding-top',
				`${(37.7953 * margins.headerMargin).toFixed(3)}px`
			);
			await expect(this.footerSection()).toHaveCSS(
				'padding-bottom',
				`${(37.7953 * margins.footerMargin).toFixed(3)}px`
			);
			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-top',
			// 	`${(37.7953 * margins.pageTopMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-right',
				`${(37.7953 * margins.pageRightMargin).toFixed(3)}px`
			);
			if (deleteHF) {
				await this.headerTextArea().click({ force: true });
				await this.page.locator('[data-testid="delete-button"]').nth(0).hover();
				// .dispatchEvent('mousedown', { force: true });
				await this.page.mouse.down();
				await this.page.waitForTimeout(1000);
				await this.footerTextArea().click({ force: true });
				await this.page
					.locator('[data-testid="delete-button"]')
					.nth(1)
					.dispatchEvent('mousedown', { force: true });
				await this.page.waitForTimeout(4000);
				const placeholderForHF = this.page.locator('[data-testid="viewport-tiptap-running-placeholder"]');
				await expect(placeholderForHF.getByText('Header')).toHaveCount(1);
				await expect(placeholderForHF.getByText('Footer')).toHaveCount(1);
				// await expect(this.headerTextArea()).toHaveAttribute('contenteditable', 'false');
				// await expect(this.footerTextArea()).toHaveAttribute('contenteditable', 'false');
			}

			await this.page.route(`**/fhir/Organization/template/${reportId}*`, async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 3000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
		}

		// open the preview
		await this.openClosePreviewForTemplate(false);

		// Verify that the template preview contains the text
		const templatePreview = await this.templatePreview();
		await expect(templatePreview).toContainText(templateTxt);

		// close the preview
		await this.openClosePreviewForTemplate(true);
		await this.openTemplateDrawerBtn().click({ force: true });

		await this.fillPublishDrawerNPublish(templateName, templateEdit, '', '', true, '');
	}

	async waitForAPICallTobeSuccessful(urlMatchingText) {
		await this.page.waitForResponse(urlMatchingText).then(async response => {
			try {
				if (response.ok) {
					const responseBody = await response.json(); // Parse response body as JSON
					console.log('Response body:', responseBody);
					return responseBody;
				}
			} catch (error) {
				console.error('Error creating:', error);
				throw error;
			}
		});
	}

	async openDocumentViewer(patientName, managingOrgName, skipFilter) {
		if (!skipFilter) {
			// Set up API interception before performing actions
			await this.page.route('**/organization?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000)); // Delay by 2 seconds
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await this.page.route('**/fhir/ImagingStudyWorklist/elk?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			// Action to trigger API call for Managing Organization filter
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).click({ force: true });
			await this.page.locator(`[data-cy="Managing Organization_filter"] [type="text"]`).clear();
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).pressSequentially(managingOrgName);
			await this.apiWaitUtils.waitForAPI(`/organization?`, 'GET');
			await this.page
				.locator(`[aria-labelledby="search-as-you-type-label"] :has-text("${managingOrgName}")`)
				.first()
				.click();
			await this.apiWaitUtils.waitForAPI('/fhir/ImagingStudyWorklist/elk?', 'GET');

			// Action to trigger API call for Patient Name filter
			await this.page.locator('[data-cy="Patient Name_filter"]').click();
			await this.page.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]').clear();
			await this.page
				.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]')
				.pressSequentially(patientName);

			await this.apiWaitUtils.waitForAPI('fhir/ImagingStudyWorklist/elk?', 'GET');
		}
		await this.page.waitForTimeout(6000);
		await this.page
			.locator('[data-cy="study-status-table"] tbody>tr')
			.getByText(new RegExp(`^${patientName}$`, 'g'))
			.first()
			.click();

		await this.page.evaluate(() => {
			const element = document.querySelector('svg[name="documentviewer"]');
			if (element) {
				element.scrollIntoView();
			}
		});
		await this.page.waitForTimeout(10000);
		await this.page.locator('svg[name="documentviewer"]').click({ force: true });
		await this.page.keyboard.press('Escape');
	}

	async openDocumentViewerAI(patientName, managingOrgName, skipFilter) {
		if (!skipFilter) {
			// Set up API interception before performing actions
			await this.page.route('**/organization?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000)); // Delay by 2 seconds
					await route.continue();
				} else {
					await route.continue();
				}
			});
			await this.page.route('**/fhir/ImagingStudyWorklist/elk?*', async route => {
				if (route.request().method() === 'GET') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					await route.continue();
				} else {
					await route.continue();
				}
			});
			// Action to trigger API call for Managing Organization filter
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).click({ force: true });
			await this.page.locator(`[data-cy="Managing Organization_filter"] [type="text"]`).clear();
			await this.page.locator(`[data-cy="Managing Organization_filter"]`).pressSequentially(managingOrgName);
			await this.apiWaitUtils.waitForAPI(`/organization?`, 'GET');
			await this.page
				.locator(`[aria-labelledby="search-as-you-type-label"] :has-text("${managingOrgName}")`)
				.first()
				.click();
			await this.apiWaitUtils.waitForAPI('/fhir/ImagingStudyWorklist/elk?', 'GET');

			// Action to trigger API call for Patient Name filter
			await this.page.locator('[data-cy="Patient Name_filter"]').click();
			await this.page.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]').clear();
			await this.page
				.locator('[data-cy="Patient Name_filter"] [placeholder="Search"]')
				.pressSequentially(patientName);

			await this.apiWaitUtils.waitForAPI('fhir/ImagingStudyWorklist/elk?', 'GET');
		}
		await this.page.waitForTimeout(6000);
		await this.page
			.locator('[data-cy="study-status-table"] tbody>tr')
			.getByText(new RegExp(`^${patientName}$`, 'g'))
			.first()
			.click();

		await this.page.evaluate(() => {
			const element = document.querySelector('svg[name="documentviewer"]');
			if (element) {
				element.scrollIntoView();
			}
		});
		await this.page.waitForTimeout(10000);
		await this.executeAICommand('click on Document Viewer icon');
		// await this.page.locator('svg[name="documentviewer"]').click({ force: true });
		await this.page.keyboard.press('Escape');
	}

	async openHomePage() {
		await this.page.route('**/ImagingStudyWorklist/elk*', async route => {
			if (route.request().method() === 'GET') {
				await route.continue();
			} else {
				await route.continue();
			}
		});
		await this.page.locator('[name="home"]').click();
		await this.apiWaitUtils.waitForAPI('ImagingStudyWorklist/elk', 'GET');
	}

	async waitForAPI(requestURL, method, timeout = 60000) {
		let responseBody;
		let isListenerRemoved = false;

		const apiCallToBeSuccessfulAndGetResponse = async response => {
			if (response.url().includes(requestURL) && response.request().method() === method) {
				console.log(`Received response for ${response.url()}`);
				if (response.ok()) {
					console.log(`Response successful for ${response.url()}`);
					const contentType = response.headers()['content-type'];
					if (contentType && contentType.includes('application/json')) {
						responseBody = await response.json(); // Parse response body as JSON
						console.log('Response body:', responseBody);
					} else {
						// Handle non-JSON response (e.g., PDF)
						responseBody = await response.body();
						console.log('Response body is not JSON. It might be binary data.');
					}

					// Remove listener after successful response
					if (!isListenerRemoved) {
						this.page.off('response', apiCallToBeSuccessfulAndGetResponse);
						isListenerRemoved = true;
					}
				} else {
					console.error(`Response failed for ${response.url()}`);
					expect(response.ok());
				}
			}
		};

		this.page.on('response', apiCallToBeSuccessfulAndGetResponse);

		try {
			await this.page.waitForResponse(
				response => response.url().includes(requestURL) && response.request().method() === method,
				{ timeout }
			);
		} catch (error) {
			console.error(`Timeout waiting for response to ${requestURL}`);
			if (!isListenerRemoved) {
				await this.page.off('response', apiCallToBeSuccessfulAndGetResponse);
			}
		}
		if (!this.page.isClosed()) {
			try {
				await this.page.unroute(url => url.includes(requestURL));
			} catch (error) {
				console.error('Error during unroute:', error);
			}
		}

		return responseBody;
	}

	//Header footer changes
	async headerFooterPageOption() {
		return await this.page.locator('ul > li').filter({ hasText: 'Update Header & Footer' });
	}

	async openHeaderFooterPageFromDV() {
		await this.editorDotMenu().click({ force: true });
		await (await this.headerFooterPageOption()).click({ force: true });
	}

	async dragAndDropBookmarkHeader(bookmarkName) {
		await this.bookmarkOpenCollapseBtn().click();
		const elements = await this.page.$$('#TipTapProseMirrorEditorHeader .ProseMirror p');
		await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').click();
		await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').clear();
		await this.page.locator('[data-testid="expandable-section"] [placeholder="Search"]').fill(bookmarkName);

		await this.page
			.locator(`[data-testid="bookmark-item-label"]`)
			.filter({ hasText: new RegExp(`^${bookmarkName}$`) })
			.hover();
		await this.page.mouse.down();
		// Select the last element

		const lastElement = elements[elements.length - 1];
		await lastElement.hover();
		await this.page.mouse.up();
		await this.bookmarkOpenCollapseBtn().click();
	}

	async dragAndDropBookmarkFooter(bookmarkName) {
		const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
		await this.bookmarkOpenCollapseBtn().click();
		await this.page
			.locator(`[id="${bookmarkName}"]`, { timeout: 60000 })
			.dispatchEvent('dragstart', { dataTransfer, force: true });
		await this.footerTextArea().dispatchEvent('drop', { dataTransfer, force: true });
		await this.footerTextArea().dispatchEvent('dragend', { force: true });
		await this.bookmarkOpenCollapseBtn().click();
	}

	async addRemoveHeaderFooter(headerText, footerText, deleteHF, margins) {
		await this.openHeaderFooterPageFromDV();
		await this.page.waitForTimeout(10000);
		if (!deleteHF) {
			await this.page.click('.css-n5mk66:has-text("Click here to create header")');
			await this.page.click('[data-testid="AssignmentOutlinedIcon"]:nth-of-type(1)');
			await this.page.locator('.css-5lld3g').nth(0).fill(margins.headerMargin);
			await this.page.locator('.css-5lld3g').nth(1).fill(margins.footerMargin);
			await this.page.click('[data-testid="CheckIcon"]');

			await this.headerTextArea().click();
			await this.headerTextArea().fill(headerText);
			await this.footerTextArea().click();
			await this.footerTextArea().fill(footerText);

			await expect(this.headerTextArea()).toHaveCSS(
				'padding-top',
				`${(37.7953 * margins.headerMargin).toFixed(3)}px`
			);
			await expect(this.footerTextArea()).toHaveCSS(
				'padding-bottom',
				`${(37.7953 * margins.footerMargin).toFixed(3)}px`
			);
			// await this.dragAndDropBookmarkToElement('Patient ID',this.headerTextArea());
			await this.dragAndDropBookmarkHeader('Patient ID');
			await this.footerTextArea().type(' #Name');
			await this.page.locator('.BookmarkItems:has-text("Patient Name")').click();

			await this.page.click('[aria-label="Preview"]');
			await expect(this.page.locator('header p').nth(0), {
				timeout: TIMEOUT_IN_MSEC2,
			}).toContainText(headerText);

			await expect(this.page.locator('footer p').nth(0), {
				timeout: TIMEOUT_IN_MSEC2,
			}).toContainText(footerText);
			await this.page.click('[data-testid="navigator-wrapper"]');
			await expect(this.page.locator('.css-hv2qxg .ProseMirrorPreview')).toContainText(headerText);
			await expect(this.page.locator('.css-xo6mix .ProseMirrorPreview')).toContainText(footerText);
			await expect(
				this.page.locator(
					'[data-testid="ViewportTipTapEditorWrapper"] [id="TipTapProseMirrorEditorHeader"] [data-code="patientID"]'
				)
			).toBeVisible();
			await expect(
				this.page.locator(
					'[data-testid="ViewportTipTapEditorWrapper"] [id="TipTapProseMirrorEditorFooter"] [data-code="patientName"]'
				)
			).toBeVisible();
			await expect(this.footerTextArea().locator('[data-code="patientName"]')).toBeVisible();
			await expect(this.headerTextArea().locator('[data-code="patientID"]')).toBeVisible();
		} else {
			await this.headerTextArea().click();
			await this.page.locator('[data-testid="delete-button"]:nth-of-type(1)').click({ force: true });
			await this.footerTextArea().click();
			await this.page.locator('[data-testid="delete-button"]:nth-of-type(1)').click({ force: true });

			await expect(this.page.locator('.css-3lvkq7:has-text("Click here to create footer")')).toBeVisible();
			await expect(this.page.locator('.css-3lvkq7:has-text("Click here to create header")')).toBeVisible();
			await expect(this.page.locator('.css-1qz9ujm:has-text("No Header")')).toBeVisible();
			await expect(this.page.locator('.css-1qz9ujm:has-text("No Footer")')).toBeVisible();
		}

		await this.page.route('**/fhir/Organization/reportAsset/apply', route => route.continue());
		await Promise.all([
			this.page.click('[data-cy="SAVE_"]'),
			this.page.waitForResponse(
				response =>
					response.url().includes(`//fhir/Organization/reportAsset/apply`) && response.status() === 200
			),
		]);
		await this.page.route('**/fhir/Organization/reportAsset?managingOrganizationId=**', route => route.continue());
		await this.page.click('[data-testid="go-back-btn"]');
		await this.apiWaitUtils.waitForAPI('/fhir/Organization/reportAsset?managingOrganizationId=', 'GET');
	}

	async templateWithMargins(templateTxt, templateName, templateEdit, reportId, margins) {
		const reportID = reportId;
		if (!templateEdit) {
			await this.page.route('**/fhir/Organization/*/template?_count*', async route => {
				await route.continue();
				route.fulfill({
					status: 200,
				});
			});
			await this.openTemplateMgr();
			await this.page.waitForResponse(
				response => response.url().includes('/fhir/Organization/') && response.status() === 200
			);
		} else {
			await this.templateCard(reportID).click({ force: true });
			await this.templateEditBtn().click({ force: true });
			await this.page.waitForResponse(
				response => response.url().includes('/fhir/Organization/') && response.status() === 200
			);
		}

		await expect(this.newReportEditorTextArea()).toBeVisible();

		if (!templateEdit) {
			await this.pageSetupBtn().click();
			await this.page.locator('[name="margin-top"]').clear();
			await this.page.locator('[name="margin-top"]').fill(margins.pageTopMargin.toString());
			await this.page.locator('[name="margin-bottom"]').clear();
			await this.page.locator('[name="margin-bottom"]').fill(margins.pageBottomMargin.toString());
			await this.page.locator('[name="margin-left"]').clear();
			await this.page.locator('[name="margin-left"]').fill(margins.pageLeftMargin.toString());
			await this.page.locator('[name="margin-right"]').clear();
			await this.page.locator('[name="margin-right"]').fill(margins.pageRightMargin.toString());
			await this.page.locator('[type="submit"]').click();

			await this.openTemplateDrawerBtn().click({ force: true });
			await this.newReportEditorTextArea().type(templateTxt, { force: true });

			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-top',
			// 	`${(37.7953 * margins.pageTopMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-right',
				`${(37.7953 * margins.pageRightMargin).toFixed(3)}px`
			);
			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-bottom',
			// 	`${(37.7953 * margins.pageBottomMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-left',
				`${(37.7953 * margins.pageLeftMargin).toFixed(3)}px`
			);
		} else {
			// await expect(this.newReportEditorSection()).toHaveCSS(
			// 	'margin-top',
			// 	`${(37.7953 * margins.pageTopMargin).toFixed(3)}px`
			// );
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-right',
				`${(37.7953 * margins.pageRightMargin).toFixed(3)}px`
			);
			await expect(this.newReportEditorSection()).toHaveCSS(
				'padding-left',
				`${(37.7953 * margins.pageLeftMargin).toFixed(3)}px`
			);
		}

		await this.fillPublishDrawerNPublish(templateName, templateEdit, '', '', true);
	}

	async openBookmarksFromDV() {
		await this.editorDotMenu().click({ force: true });
		await this.BookmarkOption().click();
	}

	async toggleLeftPanelFromDV() {
		return await this.page.click('[data-testid="navigator-wrapper"]');
	}

	leftPanelFromDV() {
		return this.page.locator('[data-testid="navigator-wrapper-container"]');
	}

	patientChartCardStackContainer() {
		return this.page.locator('[data-testid="patient-card-content"]');
	}

	patientChartCardTitle() {
		return this.page.locator('[data-testid="patient-card-title"]');
	}

	patientChartCardContainer(cardType = 'patient_info') {
		return this.page.locator(`[data-testid="card-main-${cardType}"]`);
	}

	patientChartPatientDocumentTabs(tab) {
		return this.page.getByRole('button', { name: tab });
	}

	preliminaryReportCard() {
		return this.page.locator('[id="Preliminary Report"] [id="title"]', { timeout: TIMEOUT_IN_MSEC2 });
	}

	// File Upload for Document Viewer - Patient Chart
	async documentFileUpload(pageObjectManager) {
		// Create temporary file with new name
		const tempDir = os.tmpdir();
		const originalFilePath = path.join(__dirname, '../TestData/Upload.pdf');
		const randomFilename = `${this.generateRandomFilename()}.pdf`;
		const newFilePath = path.join(tempDir, randomFilename);

		// Copy the file with new name
		fs.copyFileSync(originalFilePath, newFilePath);

		console.log(`Copied file to: ${newFilePath}`);

		// Upload the renamed file
		await this.page.setInputFiles('input[type="file"][name="files"]', newFilePath);

		// Wait for the document to be uploaded
		const uploadResponse = await this.apiWaitUtils.waitForAPI('/fhir/DocumentReference', 'POST');

		// Log the filename for reference
		console.log(`Uploaded file with name: ${randomFilename}`);

		// Clean up the temporary file after upload
		fs.unlinkSync(newFilePath);

		// Check if the document is uploaded
		uploadResponse?.content?.forEach(content => {
			expect(content?.attachment?.title).toBe(`${randomFilename}`);
		});

		console.log('File uploaded successfully - File found in API response');

		return randomFilename;
	}

	formatDateWithAge(dateString) {
		const [year, month, day] = dateString.split('-').map(Number);
		if (!year || !month || !day) return 'Invalid date';

		const birthDate = new Date(year, month - 1, day);
		const today = new Date();

		// Format date as MM/DD/YYYY
		const formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;

		// Calculate age
		let ageYears = today.getFullYear() - birthDate.getFullYear();
		let ageMonths = today.getMonth() - birthDate.getMonth();
		let ageDays = today.getDate() - birthDate.getDate();

		if (ageDays < 0) {
			ageMonths--;
			const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
			ageDays += prevMonth.getDate();
		}

		if (ageMonths < 0) {
			ageYears--;
			ageMonths += 12;
		}

		let ageText;
		if (ageYears > 0) {
			ageText = `Age ${ageYears}y`;
		} else if (ageMonths > 0) {
			ageText = `Age ${ageMonths}m`;
		} else {
			ageText = `Age ${ageDays}d`;
		}

		return `${formattedDate} (${ageText})`;
	}

	generateRandomFilename() {
		const prefixes = ['Report', 'Document', 'Analysis', 'Summary', 'Data'];
		const descriptors = ['Annual', 'Monthly', 'Quarterly', 'Final', 'Draft', 'Revised', 'Updated'];

		const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
		const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];

		// Add a random number for uniqueness
		const randomNum = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, '0');

		return `${randomPrefix}_${randomDescriptor}_${randomNum}`;
	}
};

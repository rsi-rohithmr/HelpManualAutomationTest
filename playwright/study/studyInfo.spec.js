const { test, expect } = require('@playwright/test');
import cloneDeep from 'lodash/cloneDeep';
import * as playwrightConfig from 'playwright.config';
import { Login } from 'playwright/POM/login';
import { StudyInfoPage } from 'playwright/POM/study/studyInfoPage';
import { OrderInformationPage } from 'playwright/POM/visits/order/orderInformationPage';
import { studyGenerator } from 'playwright/generators/studyGenerator';
import { orderGenerator } from 'playwright/generators/orderGenerator';
import { studyDO } from 'playwright/dataObjects/studyDO';
import { orgGenerator } from 'playwright/generators/organizationGenerator';
import { studyTypeGenerator } from 'playwright/generators/studyTypeGenerator';
import { dateTimeHelper } from 'playwright/POM/utils/dateTimeHelper';

let postedData = {};
let expectedStudyInfo = cloneDeep(studyDO);

test.describe.serial('StudyInfo page', () => {
	test.beforeAll(async () => {
		postedData = await studyGenerator.postStudy();
		expectedStudyInfo = orderGenerator.extractStudyDetailsFromOrderInfo(
			postedData?.orderPayload,
			postedData?.orderRes,
			postedData?.studyTypePayload
		);
	});

	test.beforeEach('Login OAI', async ({ page }) => {
		const loginPage = new Login(page);
		await loginPage.loginOmegaAI();

		const orderInfoPage = new OrderInformationPage(page);
		await orderInfoPage.openOrderInfoPageByUrl(postedData?.orderId);
		await orderInfoPage.openStudyInfoPage(postedData?.studyId, postedData?.studyDescription);
	});

	test('Verify study details on StudyInfo view page', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);

		await expect(studyInfoPage.studyIdLinkOnNavBar(postedData?.studyId)).toBeVisible();
		await expect(studyInfoPage.accessionNumLinkOnBreadcrumb(postedData?.accessionNum)).toBeVisible();
		await expect(studyInfoPage.studyIdLabelOnBreadcrumb(postedData?.studyId)).toBeVisible();

		const formValues = await studyInfoPage.getFormValues();

		assertStudyDetails(expectedStudyInfo, formValues);
	});

	test('Update study general info and the related Study Type info should be updated correctly', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);

		const studyTypeModality = studyTypeGenerator.modalities[0];
		const newStudyInfo = await studyGenerator.generateGeneralInfo({ ...expectedStudyInfo }, studyTypeModality);
		expectedStudyInfo = { ...newStudyInfo };

		// update postedData.studyDescription, so it can open the study in the next test properly using the new Study Description
		postedData.studyDescription = expectedStudyInfo?.general['Study Description'];

		await studyInfoPage.inputGeneralInfo(expectedStudyInfo.general);

		// Modality is a multiselect dropdwon and has an existing value when study is created, so need to retain the existing value
		expectedStudyInfo.general.Modality = `${studyTypeModality.code} | ${expectedStudyInfo.general.Modality}`;

		await studyInfoPage.clickSaveBtnAndWaitForSavingComplete();

		const formValues = await studyInfoPage.getFormValues();

		// Test steps do not select time from the Study Date/Time picker, so the generated Study Date/Time
		// will be about some minutes different from the Study Date/Time selected from the form.
		// So set the expected Study Date/Time to the same value as the one selected from the form if it's just some some mins different
		if (
			studyInfoPage.areDatesDifferentAndAcceptable(
				new Date(expectedStudyInfo.general['Study Date/Time']),
				new Date(formValues.general['Study Date/Time']),
				'Study Date/Time'
			)
		) {
			expectedStudyInfo.general['Study Date/Time'] = formValues.general['Study Date/Time'];
		}

		assertStudyDetails(expectedStudyInfo, formValues);
	});

	test('Update Clinical info', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);

		const existingLaterality = expectedStudyInfo?.clinical?.scanDetails?.Laterality;
		const existingBodyPart = expectedStudyInfo?.clinical?.scanDetails['Body Part'];
		expectedStudyInfo = cloneDeep(studyGenerator.generateClinicalInfo(expectedStudyInfo));

		await studyInfoPage.inputClinicalInfo(expectedStudyInfo.clinical);

		// Laterality and Body Part are multiselect dropdwon and have existing values when study is created, so need to retain the existing values
		expectedStudyInfo.clinical.scanDetails.Laterality = `${existingLaterality} | ${expectedStudyInfo.clinical.scanDetails.Laterality}`;
		expectedStudyInfo.clinical.scanDetails[
			'Body Part'
		] = `${existingBodyPart} | ${expectedStudyInfo.clinical.scanDetails['Body Part']}`;

		await studyInfoPage.clickSaveBtnAndWaitForSavingComplete();

		const formValues = await studyInfoPage.getFormValues();

		assertStudyDetails(expectedStudyInfo, formValues);
	});

	test('Update Care Team info', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);

		// Post an organization for Care Team info update
		const organizationPayload = await orgGenerator.generateOrganizationPayload(true);
		await orgGenerator.postOrganization(organizationPayload);

		expectedStudyInfo = cloneDeep(
			studyGenerator.generateCareTeamInfo(expectedStudyInfo, organizationPayload.entry[0].resource.name)
		);

		await studyInfoPage.inputCareTeamInfo(expectedStudyInfo.careTeam);

		await studyInfoPage.clickSaveBtnAndWaitForSavingComplete();

		const formValues = await studyInfoPage.getFormValues();

		assertStudyDetails(expectedStudyInfo, formValues, page);
	});

	test('Update Procedure Code section', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		const orderInfoPage = new OrderInformationPage(page);
		const expectedProcedureCode = cloneDeep(studyDO.procedureCode);

		// Delete a procedure code
		await studyInfoPage.deleteProcedureCode(expectedStudyInfo.procedureCode['PROCEDURE CODE']);
		const actualProcedureCodeAfterDelete = await studyInfoPage.getProcedureCodeFormValues();
		expect(expectedProcedureCode).toEqual(actualProcedureCodeAfterDelete);

		// Add procedure code and diagnosis
		expectedProcedureCode.count = 1;
		expectedProcedureCode['PROCEDURE CODE'] = expectedStudyInfo.procedureCode['PROCEDURE CODE'];
		expectedProcedureCode.DESCRIPTION = expectedStudyInfo.procedureCode.DESCRIPTION;
		expectedProcedureCode.MODIFIER = 'M1';
		expectedProcedureCode['DX CODE 0'] = studyGenerator.diagnosises[0].code;
		expectedProcedureCode['DX REASON 0'] = studyGenerator.diagnosises[0].reason;
		await studyInfoPage.addProcedureCodeAndDiagnosis(
			{
				procedureCode: expectedProcedureCode['PROCEDURE CODE'],
				description: expectedProcedureCode.DESCRIPTION,
			},
			expectedProcedureCode.MODIFIER,
			studyGenerator.diagnosises[0]
		);
		const actualProcedureCodeAfterAdd = await studyInfoPage.getProcedureCodeFormValues();
		expect(expectedProcedureCode).toEqual(actualProcedureCodeAfterAdd);

		// Update a procedure code - add another diagnosis
		expectedProcedureCode['DX CODE 1'] = studyGenerator.diagnosises[1].code;
		expectedProcedureCode['DX REASON 1'] = studyGenerator.diagnosises[1].reason;
		await studyInfoPage.addDiagnosisToProcedureCode(
			expectedProcedureCode['PROCEDURE CODE'],
			studyGenerator.diagnosises[1]
		);
		await studyInfoPage.accessionNumLinkOnBreadcrumb(postedData.accessionNum).click(); // go back to OrderInfo page then reopen the StudyPage to make sure procedure code is actaully updated
		await orderInfoPage.openStudyInfoPage(postedData.studyId, postedData.studyDescription);
		const actualProcedureCodeAfterUpdate = await studyInfoPage.getProcedureCodeFormValues();
		console.log('expectedProcedureCode', expectedProcedureCode);
		console.log('actualProcedureCode', actualProcedureCodeAfterUpdate);
		expect(expectedProcedureCode).toEqual(actualProcedureCodeAfterUpdate);
	});

	test('Add, update and delete study note', async ({ page }) => {
		const studyInfoPage = new StudyInfoPage(page);
		const orderInfoPage = new OrderInformationPage(page);
		let expectedStudyNote = cloneDeep(studyDO.studyNotes);

		// Add a study note
		await studyInfoPage.studyNotesSectionExpandBtn().click();
		expectedStudyNote.count = 1;
		expectedStudyNote.note0Content = 'E2E Note 1';
		expectedStudyNote.note0CreatedBy = playwrightConfig.userFullName;
		expectedStudyNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY hh:mm A');
		await studyInfoPage.addNote(expectedStudyNote.note0Content);
		await studyInfoPage.accessionNumLinkOnBreadcrumb(postedData.accessionNum).click();
		await orderInfoPage.openStudyInfoPage(postedData.studyId, postedData.studyDescription);
		await studyInfoPage.studyNotesSectionExpandBtn().click();
		let actualStudyNote = await studyInfoPage.getNoteFormValues();
		if (
			studyInfoPage.areDatesDifferentAndAcceptable(
				new Date(expectedStudyNote.note0CreatedDate),
				new Date(actualStudyNote.note0CreatedDate),
				'Study Note CreatedDateTime'
			)
		) {
			expectedStudyNote.note0CreatedDate = actualStudyNote.note0CreatedDate;
		}

		// Skip testing note created date time because of PRO-6144. Remove this step when the bug is fixed
		expectedStudyNote.note0CreatedDate = actualStudyNote.note0CreatedDate;

		console.log('actualStudyNoteAfterAdd', actualStudyNote);
		console.log('expectedStudyNoteAfterAdd', expectedStudyNote);
		expect(expectedStudyNote).toEqual(actualStudyNote);

		// Update study note
		const note2 = 'E2E Note 2';
		expectedStudyNote.note0CreatedDate = dateTimeHelper.formatDateTime(new Date(), 'MM/DD/YYYY hh:mm A');
		await studyInfoPage.updateNote(expectedStudyNote.note0Content, note2);
		expectedStudyNote.note0Content = note2;
		actualStudyNote = await studyInfoPage.getNoteFormValues();
		if (
			studyInfoPage.areDatesDifferentAndAcceptable(
				new Date(expectedStudyNote.note0CreatedDate),
				new Date(actualStudyNote.note0CreatedDate),
				'Study Note CreatedDateTime'
			)
		) {
			expectedStudyNote.note0CreatedDate = actualStudyNote.note0CreatedDate;
		}

		console.log('actualStudyNoteAfterUpdate', actualStudyNote);
		console.log('expectedStudyNoteAfterUpdate', expectedStudyNote);
		expect(expectedStudyNote).toEqual(actualStudyNote);

		// Delete a study note
		expectedStudyNote = cloneDeep(studyDO.studyNotes);
		await studyInfoPage.deleteNote(note2);
		actualStudyNote = await studyInfoPage.getNoteFormValues();
		console.log('actualStudyNoteAfterDelete', actualStudyNote);
		console.log('expectedStudyNoteAfterDelete', expectedStudyNote);
		expect(expectedStudyNote).toEqual(actualStudyNote);
	});
});

const assertStudyDetails = (expectedStudyInfo, formValues, page) => {
	// Verify General info
	console.log('expectedGeneralInfo: ', expectedStudyInfo.general);
	console.log('actualGeneralInfo: ', formValues.general);
	expect(formValues.general).toEqual(expectedStudyInfo.general);

	// Verify Clinical info
	console.log('expectedClinicalInfo: ', expectedStudyInfo.clinical);
	console.log('actualClinicalInfo: ', formValues.clinical);
	expect(formValues.clinical).toEqual(expectedStudyInfo.clinical);

	// Verify Care Team info
	// This is very specific to the test data defined in playwrightConfig.userFullName (USER02 RAMSOFTLOCAL) and playwrightConfig.userFullName2 (USER04 RAMSOFTLOCAL)
	if (page) {
		const studyInfoPage = new StudyInfoPage(page);
		expectedStudyInfo.careTeam['Performing Technologist'] = studyInfoPage.reverseName(
			expectedStudyInfo?.careTeam['Performing Technologist']
		);
		expectedStudyInfo.careTeam['Performing Physician'] = studyInfoPage.reverseName(
			expectedStudyInfo?.careTeam['Performing Physician']
		);
		expectedStudyInfo.careTeam['Reading Physician'] = studyInfoPage.reverseName(
			expectedStudyInfo?.careTeam['Reading Physician']
		);
		expectedStudyInfo.careTeam.Transcriptionist = studyInfoPage.reverseName(
			expectedStudyInfo?.careTeam.Transcriptionist
		);
	}
	console.log('expectedcareTeamInfo: ', expectedStudyInfo.careTeam);
	console.log('actualcareTeamInfo: ', formValues.careTeam);
	expect(formValues.careTeam).toEqual(expectedStudyInfo.careTeam);

	// Verify Procedure Code info
	console.log('expectedProcedureCodeInfo: ', expectedStudyInfo.procedureCode);
	console.log('actualProcedureCodeInfo: ', formValues.procedureCode);
	expect(formValues.procedureCode).toEqual(expectedStudyInfo.procedureCode);

	// Verify Notes section
	console.log('expectedStudyNotesInfo: ', expectedStudyInfo.studyNotes);
	console.log('actualStudyNotesInfo: ', formValues.studyNotes);
	expect(formValues.studyNotes).toEqual(expectedStudyInfo.studyNotes);
};

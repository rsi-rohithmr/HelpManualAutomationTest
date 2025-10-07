import addDays from 'date-fns/addDays';
const { faker } = require('@faker-js/faker');
import cloneDeep from 'lodash/cloneDeep';
import { procedureCodeGenerator } from './procedureCodeGenerator';
import { studyTypeGenerator } from './studyTypeGenerator';
import { patientGenerator } from './patientGenerator';
import { orderGenerator } from './orderGenerator';
import { studyDO } from 'playwright/dataObjects/studyDO';
import { postStudyNGetToken } from 'playwright/APIutils/postStudyNGetToken';
import { dateTimeHelper } from 'playwright/POM/utils/dateTimeHelper';
import * as playwrightConfig from 'playwright.config';

class StudyGenerator {
	studyStatus = ['ORDERED', 'SCHEDULED']; // temporarily hardcode the values. Query values from DB if needed
	modalities = ['PT/CT', 'CT', 'MR', 'US', 'XR'];
	modalityModifiers = ['PERFUSION', 'FLUOROSCOPY', 'REST'];
	loincCodes = ['RPID6011', 'RPID10', 'RPID926'];
	pharmaceuticalTypes = ['WITH IV CONTRAST', 'WITHOUT IV CONTRAST'];
	pharmaceuticalNames = ['XENON', 'RECTAL CONTRAST'];
	lateralities = ['Unilateral right', 'Unilateral left'];
	typeOfViews = ['UPRIGHT', 'INSPIRATION'];
	anatomicFocuses = ['CLAVICLE', 'RIBS'];
	techniques = ['INSPIRATION EXPIRATION', 'ROLL LATERAL'];
	bodyParts = ['Abdominal aorta', 'Acromioclavicular joint'];
	diagnosises = [
		{ code: 'Z98.811', reason: 'Dental restoration status' },
		{ code: 'Z99.3', reason: 'Dependence on wheelchair' },
		{ code: 'Z99.2', reason: 'Dependence on renal dialysis' },
	];

	/**
	 * Posts study related resouces such as
	 * - ProcedureCode, StudyType, Patient, Order, Study
	 * - and a department organization that is neccessary for some tests
	 *
	 * @returns a promise including resource payloads, responses, and the following data that can be used as input or expected data for tests:
	 * - patientPayload, patientRes, patientId, patientFirstName, patientLastName, patientName, patientSSN, patientBirthday, patientGender,
	 *	 patientTelephone, patientEmail, patientInfo: {generalInfo, contactInfo, emergencyContacts, address, patientNotes, coverageArr, allergyArr}
	 * - orderPayload, orderRes, orderId, accessionNum, orderStatus, priority
	 * - visitId, visitStatus, visitDateTime
	 * - studyId, studyDescription, imagingOrganization, studyStatus, studyDateTime, reasonCode
	 * - procedureCodePayload, procedureCodeRes
	 * - studyTypePayload, studyTypeRes
	 */
	async postStudy() {
		const result = {
			procedureCodePayload: null,
			procedureCodeRes: null,
			studyTypePayload: null,
			studyTypeRes: null,
			patientPayload: null,
			patientRes: null,
			orderPayload: null,
			orderRes: null,
		};
		// Post Procedure Code
		try {
			result.procedureCodePayload = procedureCodeGenerator.generateProcedureCodePayload();
			result.procedureCodeRes = await procedureCodeGenerator.postProcedureCode(result.procedureCodePayload);
		} catch (error) {
			throw error;
		}

		// Post Study Type
		try {
			result.studyTypePayload = studyTypeGenerator.generateStudyTypePayload({
				procedureCode: {
					code: result.procedureCodeRes?.code,
					display: result.procedureCodeRes?.display,
				},
			});
			result.studyTypeRes = await studyTypeGenerator.postStudyType(result.studyTypePayload);
		} catch (error) {
			throw error;
		}
		// Post Patient
		try {
			result.patientInfo = patientGenerator.generatePatientBundlePayload();
			result.patientPayload = result.patientInfo?.patientPayload;
			result.patientRes = await patientGenerator.postPatient(result.patientPayload);
		} catch (error) {
			throw error;
		}

		const extractedPatientInfo = { ...this.#exptractDataFromPatientRes(result.patientRes) };

		// Post order
		try {
			result.orderPayload = orderGenerator.generateOrderPayload(
				{ patientId: extractedPatientInfo.patientId, patientName: extractedPatientInfo.patientName },
				{ studyType: result.studyTypeRes?.studyType, description: result.studyTypeRes?.description },
				{
					deptOrgId: playwrightConfig?.managingOrg?.organizationId,
					deptOrgName: playwrightConfig?.managingOrg?.organizationName,
				}
			);
			result.orderRes = await orderGenerator.postOrder(result.orderPayload);
		} catch (error) {
			throw error;
		}

		const postedData = { ...extractedPatientInfo, ...this.#extractDataFromOrderRes(result.orderRes) };

		console.log('StudyGenerator - postStudy - All resources posted successfully');

		console.log(
			`StudyGenerator - postStudy -  
			patientId: ${postedData.patientId}, 
			studyId: ${postedData.studyId}, 
			visitId: ${postedData.visitId}, 
			orderId: ${postedData.orderId}, 
			patientName: ${postedData.patientName}`
		);

		return {
			...result,
			...postedData,
		};
	}

	#exptractDataFromPatientRes(patientRes) {
		const patientInfo = {};
		if (Array.isArray(patientRes?.entry) && patientRes.entry.length > 0 && patientRes.entry[0]?.resource?.id) {
			patientInfo.patientId = patientRes.entry[0].resource.id;

			patientInfo.patientFirstName = patientRes.entry[0].resource.name[0].given[0];
			patientInfo.patientLastName = patientRes.entry[0].resource.name[0].family;

			patientInfo.patientName = patientRes.entry[0].resource.name[0].text;
			patientInfo.patientSSN = patientRes.entry[0].resource.identifier[0].value;
			patientInfo.patientBirthday = patientRes.entry[0].resource.birthDate;
			patientInfo.patientGender = patientRes.entry[0].resource.gender.toUpperCase();
			patientInfo.patientTelephone = patientRes.entry[0].resource.telecom[1].value;
			patientInfo.patientEmail = patientRes.entry[0].resource.telecom[0].value;
		}

		return patientInfo;
	}

	#extractDataFromOrderRes(orderRes) {
		const data = {};
		if (Array.isArray(orderRes?.entry) && orderRes.entry.length > 1) {
			// Order info
			data.orderId = orderRes.entry[1].resource.id;
			data.accessionNum = orderRes.entry[1].resource.identifier[0].value;
			data.orderStatus = orderRes.entry[1].resource.status.toUpperCase();
			data.priority = orderRes.entry[1].resource.priority.toUpperCase();

			// Visit info
			data.visitId = orderRes.entry[1].resource.encounter.id;
			data.visitStatus = orderRes.entry[0].resource.status.toUpperCase();
			const visitDateTime = orderRes.entry[0].resource.extension.find(
				ext => ext.url === 'VisitDateTimeUTC'
			)?.valueDateTime;
			data.visitDateTime = this.#formatStudyVisitDateTime(visitDateTime);

			// Study info
			data.studyId = orderRes.entry[1].resource.code.coding[0].id;
			data.studyDescription = orderRes.entry[1].resource.code.coding[0].display;
			data.imagingOrganization = orderRes.entry[1].resource.code.coding[0].extension[4].valueReference.display;
			data.studyStatus = orderRes.entry[1].resource.code.coding[0].extension[1].valueCode;
			const studyDateTime = orderRes.entry[1].resource.code.coding[0].extension[0].valueDateTime.split('+')[0];
			data.studyDateTime = this.#formatStudyVisitDateTime(new Date(studyDateTime));
			data.reasonCode = orderRes.entry[1].resource.reasonCode; // diagnosis codes
		}

		return data;
	}

	#formatStudyVisitDateTime(dateTime) {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'UTC', // Optionally set the timezone
		}).format(new Date(dateTime));
	}

	async generateGeneralInfo(originStudyInfo, studyTypeModality) {
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();
		const newStudyInfo = cloneDeep(originStudyInfo ?? studyDOstudyDO);

		const procedureCodePayload = procedureCodeGenerator.generateProcedureCodePayload();
		const procedureCode = await procedureCodeGenerator.postProcedureCode(procedureCodePayload);
		const studyTypePayload = studyTypeGenerator.generateStudyTypePayload({
			procedureCode: { code: procedureCode?.code, display: procedureCode?.display },
			modality: studyTypeModality ?? studyTypeGenerator.modalities[0],
			bodyPart: studyTypeGenerator.bodyParts[0],
			laterality: studyTypeGenerator.lateralities[1],
			duration: '30',
		});
		const studyType = await studyTypeGenerator.postStudyType(studyTypePayload);

		newStudyInfo.general['Study Status'] = this.studyStatus[1];
		newStudyInfo.general['Study Date/Time'] = dateTimeHelper.formatDateTime(
			new Date(addDays(new Date(), -1)),
			'MM/DD/YYYY, h:mm A'
		);
		newStudyInfo.general['Study Set Code'] = studyType?.studyType;
		newStudyInfo.general['Study Description'] = studyType?.description?.toUpperCase();
		newStudyInfo.general['Requested Procedure ID'] = `${newStudyInfo.general['Requested Procedure ID']}-${randNum}`;
		newStudyInfo.general.Department = `${newStudyInfo.general.Department}-${randNum}`;
		newStudyInfo.general['Patient Location'] = `TORONTO-${randNum}`;
		newStudyInfo.general['Exam Room'] = `EXAM ROOM -${randNum}`;
		newStudyInfo.general.Modality = this.modalities[0];
		newStudyInfo.general['Modality Modifier'] = this.modalityModifiers[0];
		newStudyInfo.general['LOINC Code'] = this.loincCodes[0];

		// When changing study Code, the clinical and procedure code sections will be updated
		newStudyInfo.clinical.scanDetails.Laterality = studyTypePayload?.laterality?.display;
		newStudyInfo.clinical.scanDetails['Body Part'] = studyTypePayload?.bodyPart[0]?.display;
		newStudyInfo.clinical.scanDetails['Duration (HH: MM)'] = `00:${studyTypePayload?.duration}`;
		newStudyInfo.procedureCode['PROCEDURE CODE'] = procedureCodePayload?.code;
		newStudyInfo.procedureCode.DESCRIPTION = procedureCodePayload?.display;
		newStudyInfo.procedureCode['DX CODE 0'] = '';
		newStudyInfo.procedureCode['DX REASON 0'] = '';
		newStudyInfo.procedureCode['DX CODE 1'] = '';
		newStudyInfo.procedureCode['DX REASON 1'] = '';

		return newStudyInfo;
	}

	generateClinicalInfo(originStudyInfo) {
		const newStudyInfo = cloneDeep(originStudyInfo ?? studyDO);

		newStudyInfo.clinical.pharmaceutical.Type = this.pharmaceuticalTypes[0];
		newStudyInfo.clinical.pharmaceutical['Dosage (ml)'] = '100';
		newStudyInfo.clinical.pharmaceutical.Name = this.pharmaceuticalNames[0];
		newStudyInfo.clinical.scanDetails.Laterality = this.lateralities[0];
		newStudyInfo.clinical.scanDetails['Type Of View'] = this.typeOfViews[0];
		newStudyInfo.clinical.scanDetails['Anatomic Focus'] = this.anatomicFocuses[0];
		newStudyInfo.clinical.scanDetails.Technique = this.techniques[0];
		newStudyInfo.clinical.scanDetails['Body Part'] = this.bodyParts[0];
		newStudyInfo.clinical.clinicalComments.comments = `E2E Clinical comment: ${faker.lorem.sentence()}`;
		newStudyInfo.clinical.studyReason.comments = `E2E Clinical- Study Reason: ${faker.lorem.sentence()}`;
		newStudyInfo.clinical.customField1.content = `E2E Clinical - Custom Field1: ${faker.lorem.sentence()}`;
		newStudyInfo.clinical.customField2.content = `E2E Clinical - Custom Field2: ${faker.lorem.sentence()}`;

		return newStudyInfo;
	}

	generateCareTeamInfo(originStudyInfo, deptOrgName) {
		const newStudyInfo = cloneDeep(originStudyInfo ?? studyDO);

		newStudyInfo.careTeam['Performing Technologist'] = playwrightConfig.userFullName;
		newStudyInfo.careTeam['Performing Physician'] = playwrightConfig.userFullName2;
		newStudyInfo.careTeam['Reading Physician'] = playwrightConfig.userFullName;
		newStudyInfo.careTeam['Reading Organization'] = deptOrgName;
		newStudyInfo.careTeam.Transcriptionist = playwrightConfig.userFullName2;
		newStudyInfo.careTeam['Transcription Organization'] = deptOrgName;

		return newStudyInfo;
	}
}

export const studyGenerator = new StudyGenerator();

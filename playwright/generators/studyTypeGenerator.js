const { request } = require('@playwright/test');
import * as playwrightConfig from 'playwright.config';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { fhirEndpoints } from '@rs-core/fhir';

class StudyTypeGenerator {
	bodyParts = [
		{
			code: 'R-FAB57',
			display: 'Abdomen and Pelvis',
		},
		{
			code: 'T-15750',
			display: 'Ankle joint',
		},
		{
			code: 'T-59900',
			display: 'Anus',
		},
		{
			code: 'T-42000',
			display: 'Aorta',
		},
		{
			code: 'T-59200',
			display: 'Appendix',
		},
	];

	modalities = [
		{
			code: 'MR',
			display: 'MR',
		},
		{
			code: 'CT',
			display: 'CT',
		},
		{
			code: 'US',
			display: 'US',
		},
	];

	lateralities = [
		{
			code: 'B',
			display: 'Bilateral',
		},
		{
			code: 'L',
			display: 'Unilateral left',
		},
		{
			code: 'R',
			display: 'Unilateral right',
		},
	];

	/**
	 * Generates a payload for posting a study type (order set).
	 *
	 * @param {object} studyTypeDetails - a parameter that includes
	 * - mandatory details: procedureCode object including code and display properties
	 * - optional details: modality, bodyPart, laterality objects and duration.
	 * @returns a study type payload object.
	 */
	generateStudyTypePayload(studyTypeDetails) {
		if (!studyTypeDetails?.procedureCode?.code) {
			return {};
		}

		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();
		const payload = JSON.parse(JSON.stringify(require('../jsonData/postStudyType.json')));
		const studyType = `STUDYTYPE${randNum}`;

		// Update organization and the data making study type unique
		payload.code = studyType;
		payload.description = `E2E StudyType Des${randNum}`;
		payload.studyType = studyType;
		payload.extension[2].valueReference.id = playwrightConfig.managingOrg.organizationId;
		payload.extension[2].valueReference.reference = `/Organization/${playwrightConfig.managingOrg.organizationId}`;

		// Update procedure code
		payload.procedureCode[0].coding[0].code = studyTypeDetails?.procedureCode?.code;
		payload.procedureCode[0].coding[0].display = studyTypeDetails?.procedureCode?.display;

		// Update other studyTypeDetails if provided
		if (studyTypeDetails?.modality) {
			payload.modality.code = studyTypeDetails.modality?.code;
			payload.modality.display = studyTypeDetails.modality?.display;
		}
		if (studyTypeDetails?.bodyPart) {
			payload.bodyPart[0].code = studyTypeDetails.bodyPart?.code;
			payload.bodyPart[0].display = studyTypeDetails.bodyPart?.display;
			payload.extension[0].extension[0].valueCoding.code = studyTypeDetails.bodyPart?.code;
			payload.extension[0].extension[0].valueCoding.display = studyTypeDetails.bodyPart?.display;
		}
		if (studyTypeDetails?.laterality) {
			payload.laterality.code = studyTypeDetails.laterality?.code;
			payload.laterality.display = studyTypeDetails.laterality?.display;
			payload.extension[1].valueCoding.code = studyTypeDetails.laterality?.code;
			payload.extension[1].valueCoding.display = studyTypeDetails.laterality?.display;
		}
		if (studyTypeDetails?.duration) {
			payload.duration = studyTypeDetails?.duration;
		}

		return payload;
	}

	async postStudyType(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);

		try {
			const response = await apiRequest.postResource(fhirEndpoints.studyType, payload);
			return response;
		} catch (error) {
			console.error('studyTypeGenerator - postStudyType - Error in posting study type: ', error?.message);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const studyTypeGenerator = new StudyTypeGenerator();

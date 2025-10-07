const { request } = require('@playwright/test');
import * as playwrightConfig from 'playwright.config';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { fhirEndpoints } from '@rs-core/fhir';

class ProcedureCodeGenerator {
	generateProcedureCodePayload() {
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();
		const payload = JSON.parse(JSON.stringify(require('../jsonData/postProcedureCode.json')));
		payload.code = `E2E PC ${randNum}`;
		payload.display = `E2E PC Description ${randNum}`;
		payload.organization = {
			id: playwrightConfig.managingOrg.organizationId,
			reference: `/Organization/${playwrightConfig.managingOrg.organizationId}`,
			display: playwrightConfig.managingOrg.organizationName,
		};
		return payload;
	}

	async postProcedureCode(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);

		try {
			const response = await apiRequest.postResource(fhirEndpoints.procedureCode, payload);
			return response;
		} catch (error) {
			console.error(
				'procedureCodeGenerator - postProcedureCode - Error in posting procedureCode: ',
				error?.message
			);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const procedureCodeGenerator = new ProcedureCodeGenerator();

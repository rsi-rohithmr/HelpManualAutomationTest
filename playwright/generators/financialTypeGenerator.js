const { request } = require('@playwright/test');
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import * as playwrightConfig from 'playwright.config';
import { fhirEndpoints } from '@rs-core/fhir';

class FinancialTypeGenerator {
	generateFinancialTypePayload(namePrefix) {
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();

		return {
			active: true,
			code: `${namePrefix ?? 'E2E FTCODE'}${randNum}`,
			name: `${namePrefix ?? 'E2E FTNAME'}${randNum}`,
			organization: {
				id: playwrightConfig.managingOrg.organizationId,
				reference: `Organization/${playwrightConfig.managingOrg.organizationId}`,
				display: playwrightConfig.managingOrg.organizationName,
			},
			id: -1,
		};
	}

	async postFinancialType(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);
		const ftPayload = payload?.code && payload?.name ? payload : this.generateFinancialTypePayload();

		try {
			const response = await apiRequest.postResource(fhirEndpoints.financialType, ftPayload);
			return response;
		} catch (error) {
			console.error(
				'financialTypeGenerator - postFinancialType - Error in posting FinancialType: ',
				error?.message
			);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const financialTypeGenerator = new FinancialTypeGenerator();

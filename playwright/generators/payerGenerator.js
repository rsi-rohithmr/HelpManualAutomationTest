const { request } = require('@playwright/test');
import cloneDeep from 'lodash/cloneDeep';
const { faker } = require('@faker-js/faker');
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import * as playwrightConfig from 'playwright.config';
import { fhirEndpoints } from '@rs-core/fhir';
import { financialTypeGenerator } from './financialTypeGenerator';
import { payerDO } from 'playwright/dataObjects/payerDO';

class PayerGenerator {
	payerTypes = [
		{ id: '233280', display: 'Insurance' },
		{ id: '233281', display: 'Self-pay' },
		{ id: '233282', display: 'Other' },
	];

	/**
	 * Generates a payer payload for API posting.
	 *
	 * @param {{ code: string, name: string }} [financialTypeObj] - optional object containing code and name properties.
	 * @param {{ payerName: string, eligibilityPayerId: string }} [thirdPartyPayer] - optional object containing code and name properties.
	 * @returns {Object} The generated payer payload ready for posting to the API.
	 *
	 * @example
	 * const payload = payerGenerator.generatePayerPayload({code: 'FT123', name: 'Financial Type 123'});
	 */
	async generatePayerPayload(thirdPartyPayer, financialTypeObj) {
		let financialTypeCode = financialTypeObj.code;
		let financialTypeName = financialTypeObj.name;

		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();
		const payload = JSON.parse(JSON.stringify(require('../jsonData/postPayer.json')));

		if (thirdPartyPayer.payerName && thirdPartyPayer.eligibilityPayerId) {
			payload.name = thirdPartyPayer.payerName;
			payload.extension[0].valueString = 'pVerify';
			payload.extension[2].valueString = thirdPartyPayer.eligibilityPayerId;
		}

		payload.name = `E2E PAYER ${randNum}`;
		payload.extension[1].valueString = `PAYERID${randNum}`;

		if (!financialTypeCode || !financialTypeName) {
			const financialType = await financialTypeGenerator.postFinancialType();
			financialTypeCode = financialType?.code;
			financialTypeName = financialType?.name;
		}

		payload.extension[6].valueReference.id = financialTypeObj.code;
		payload.extension[6].valueReference.display = financialTypeObj.name;
		payload.extension[6].valueReference.reference = `FinancialType/${financialTypeObj.code}`;

		payload.partOf.id = playwrightConfig.managingOrg.organizationId;
		payload.partOf.reference = `Organization/${playwrightConfig.managingOrg.organizationId}`;
		payload.partOf.display = playwrightConfig.managingOrg.organizationName;

		return payload;
	}

	generatePayerFormValues(financialTypeName) {
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate7DigitRandNum();
		const payerDetails = cloneDeep(payerDO);

		payerDetails['Payer Name'] = `E2E PAYER${randNum}`;
		payerDetails['Payer ID'] = `PAYERID${randNum}`;
		payerDetails['Payer Type'] = this.payerTypes[Math.floor(Math.random() * this.payerTypes.length)].display;
		payerDetails['Financial Type'] = financialTypeName;
		payerDetails.Country = faker.location.country().toUpperCase();
		payerDetails['State/Province'] = faker.location.state().toUpperCase();
		payerDetails['Zip/Postal Code'] = faker.location.zipCode().toUpperCase();
		payerDetails.City = faker.location.city().toUpperCase();
		payerDetails['Address Line 1'] = faker.location.streetAddress().toUpperCase();

		return payerDetails;
	}

	async postPayer(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);
		const payerPayload = payload?.name ? payload : await this.generatePayerPayload();

		try {
			const response = await apiRequest.postResource(fhirEndpoints.organization, payerPayload);
			return response;
		} catch (error) {
			console.error('payerGenerator - postPayer - Error in posting Payer: ', error?.message);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const payerGenerator = new PayerGenerator();

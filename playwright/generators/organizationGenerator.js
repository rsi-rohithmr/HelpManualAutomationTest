const { request } = require('@playwright/test');
import faker from 'community-faker';
import * as playwrightConfig from 'playwright.config';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { fhirEndpoints } from '@rs-core/fhir';
import { generateTestEmail } from 'cypress/support/testUtils';

class OrganizationGenerator {
	/**
	 * Generates an Organization payload for API posting.
	 * For an imaging, reading, or transcription organization, isManaging should be true, but need to pass it via isManaging param to
	 * reduce creating so many unnecessary managing organiations which cause performance issues
	 *
	 * @param {boolean} [isManaging] - Whether the organization is a managing organization.
	 * @param {boolean} [isImaging] - Whether the organization has the Imaging practice type.
	 * @param {boolean} [isReading] - Whether the organization has the Reading practice type.
	 * @param {boolean} [isTranscription] - Whether the organization has the Transcription practice type.
	 * @param {string} [orgNamePrefix] - Optional prefix for the organization name.
	 * @param {Object} [parentOrg] - Optional parent organization object with `id` and `name` properties.*
	 * @returns {Object} The generated organization payload ready for posting to the API.
	 *
	 * @example
	 * const payload = orgGenerator.generateOrganizationPayload(true, true, true, true, 'E2E-PATIENT-ORG', { id: '123', name: 'ParentOrg' });
	 */
	generateOrganizationPayload(isManaging, isImaging, isReading, isTranscription, orgNamePrefix, parentOrg, orgName) {
		const utilFuncs = new postStudyNGetToken();
		const randNum = utilFuncs.generate9DigitRandNum();
		const payload = JSON.parse(JSON.stringify(require('../jsonData/postOrganization.json')));

		payload.entry[0].resource.name = orgName
			? orgName
			: orgNamePrefix
			? `${orgNamePrefix} ${randNum}`
			: `E2E-PROV-ORG ${randNum}`;
		payload.entry[0].resource.identifier[0].value = randNum; // NPI field

		// Set parent org
		payload.entry[0].resource.partOf.id = parentOrg?.id ?? playwrightConfig.managingOrg.organizationId;
		payload.entry[0].resource.partOf.reference = `organization/${
			parentOrg?.id ?? playwrightConfig.managingOrg.organizationId
		}`;
		payload.entry[0].resource.partOf.display = parentOrg?.name ?? playwrightConfig.managingOrg.organizationName;

		if (isManaging) {
			payload.entry[0].resource.extension[3].valueBoolean = true;
		}

		const defaultPracticeTypes = payload.entry[0].resource.extension[2].extension; // postOrganization.json posts an organization with Imaging, Reading, Transcription practice types by default
		payload.entry[0].resource.extension[2].extension = [];
		if (isImaging) {
			payload.entry[0].resource.extension[2].extension.push({
				url: 'text',
				valueString: 'Imaging',
			});
		}
		if (isReading) {
			payload.entry[0].resource.extension[2].extension.push({
				url: 'text',
				valueString: 'Reading',
			});
		}
		if (isTranscription) {
			payload.entry[0].resource.extension[2].extension.push({
				url: 'text',
				valueString: 'Transcription',
			});
		}
		if (!isImaging && !isReading && !isTranscription) {
			payload.entry[0].resource.extension[2].extension = defaultPracticeTypes;
		}

		payload.entry[0].resource.address[0].country = faker.address.country();
		payload.entry[0].resource.address[0].state = faker.address.state();
		payload.entry[0].resource.address[0].city = faker.address.city();
		payload.entry[0].resource.address[0].postalCode = faker.address.zipCode();
		payload.entry[0].resource.address[0].line = [faker.address.streetAddress()];

		payload.entry[0].resource.telecom[1].value = `${generateTestEmail()}`.toLowerCase();
		payload.entry[0].resource.telecom[0].value = faker.phone.phoneNumber('1226#######');
		payload.entry[0].resource.telecom[2].value = faker.phone.phoneNumber('1416#######');

		return payload;
	}

	async postOrganization(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);

		try {
			const response = apiRequest.postResource(fhirEndpoints.bundle, payload, 'Organization');
			return response;
		} catch (error) {
			console.error('organizationGenerator - postOrganization - Error in posting organization: ', error?.message);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const orgGenerator = new OrganizationGenerator();

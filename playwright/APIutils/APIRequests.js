const faker = require('community-faker');
const playwrightConfig = require('../../playwright.config');
const fs = require('fs');
const path = require('path');
import { postStudyNGetToken } from './postStudyNGetToken';
import { fhirEndpoints } from '@rs-core/fhir';

export class APIRequests {
	constructor(apiContext) {
		this.apiContext = apiContext;
		this.utilFuncs = new postStudyNGetToken(apiContext);
	}

	generateRandomNumber(minValue, maxValue) {
		return faker.datatype.number({
			min: minValue,
			max: maxValue,
		});
	}

	async getUserDetails() {
		let tokenAndSessionId = '';
		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
					// this.page.pause();
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}
		let url = playwrightConfig.baseApiUrl + 'fhir/Practitioner/loggedUser? ';
		const requestPayload = {
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
				SessionID: tokenAndSessionId.sessionId,
			},
			data: '_element=telecom',
		};
		try {
			const response = await this.apiContext.get(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.json(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error creating patient:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}

	async importDICOM(filePath, internalStudyId) {
		let tokenAndSessionId = '';
		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
					// this.page.pause();
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}
		let url =
			playwrightConfig.baseURL +
			`/dicomweb/studies/?internalstudyid=${internalStudyId}&internalmanagingorganizationid=${playwrightConfig.managingOrg.organizationId}`;
		// Read the file as binary data
		const fileData = fs.readFileSync(filePath);
		const requestPayload = {
			method: 'POST',
			headers: {
				RSAcceptAnyStudy: 'Y',
				'Synchronous-ElasticSearchDicomJsonSyncEvent': 'true',

				'Content-Type': 'application/dicom',
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
			},
			data: fileData,
		};
		try {
			const response = await this.apiContext.post(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.json(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error creating patient:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}

	async importStudyToManaginOrg(filePath) {
		let tokenAndSessionId = {};

		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}

		const fileData = fs.readFileSync(filePath);

		let url =
			playwrightConfig.baseURL +
			`dicomweb/studies/?internalManagingOrganizationID=${playwrightConfig.managingOrg.organizationId}`;

		const requestPayload = {
			method: 'POST',
			headers: {
				RSAcceptAnyStudy: 'Y',
				'Synchronous-ElasticSearchDicomJsonSyncEvent': 'true',

				'Content-Type': 'application/dicom',
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
			},
			data: fileData,
		};
		try {
			const response = await this.apiContext.post(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.json(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error importing study:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}

	async deleteStudyFromMangingOrg(sutdyUID) {
		let tokenAndSessionId = {};

		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}

		let url =
			playwrightConfig.baseURL +
			`dicomweb/study/${sutdyUID}?InternalOrganizationID=${playwrightConfig.managingOrg.organizationId}`;

		const requestPayload = {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
			},
		};
		try {
			const response = await this.apiContext.delete(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.text(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error deleting patient:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}

	async deleteOrgHeaderNFooter() {
		let tokenAndSessionId = {};

		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}

		const url = playwrightConfig.baseApiUrl + `fhir/Organization/reportAsset/apply`;

		const requestPayload = {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
			},
			data: JSON.parse(
				`{"organizationid":["${playwrightConfig.managingOrg.organizationId}"],"assets":[{"type":"Header","htmlData":"","paddingTop":0},{"type":"Footer","htmlData":"","paddingBottom":0}]}`
			),
		};
		try {
			const response = await this.apiContext.post(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.text(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error deleting org header and footer:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}

	// Utility function to retrieve a resource by internal ID
	async getResourceById(resourceName, internalId, tokenObj) {
		if (tokenObj?.accessToken) {
			return this.getResourceByInternalId(resourceName, internalId, tokenObj);
		} else {
			// Assuming you have a method to get token and session ID in Playwright
			tokenObj = await this.utilFuncs.getTokenAndSessionId();
			return this.getResourceByInternalId(resourceName, internalId, tokenObj);
		}
	}

	// Function to get a resource by internal ID
	async getResourceByInternalId(resourceName, internalId, tokenObj) {
		if (!tokenObj || !internalId || !resourceName) {
			throw new Error('Missing parameters: tokenObj, internalId, or resourceName');
		}

		const response = await this.apiContext.get(`${playwrightConfig.baseApiUrl}fhir/${resourceName}/${internalId}`, {
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
		});

		const responseBody = await response.json();
		// Writing response to file
		// const filePath = path.resolve(__dirname, `../../../output/${resourceName}GetRes.json`);
		// fs.writeFileSync( path.resolve(__dirname, `../../../output/${resourceN ame}GetRes.json`), JSON.stringify(responseBody, null, 2));
		// const filePath = path.resolve(__dirname, `../../../output/${resourceName}GetRes.json`);

		const dirPath = path.resolve(__dirname, './output');
		const filePath = path.join(dirPath, `${resourceName}GetRes.json`);
		const data = JSON.stringify(responseBody, null, 2);

		fs.mkdirSync(dirPath, { recursive: true });
		fs.writeFileSync(filePath, data, { flag: 'w' });

		return responseBody;
	}

	async postHealthcareService() {
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		let tokenObj = {};
		let orgNPI = '';
		const randomNum = this.utilFuncs.generate7DigitRandNum();
		// Get token and session ID
		tokenObj = await this.utilFuncs.getTokenAndSessionId();

		// Get organization details
		const orgResponse = await this.getResourceById('organization', managingOrgId, tokenObj);
		orgNPI = orgResponse.identifier[0].value;
		const dirPath = path.resolve(__dirname, './organization');
		const filePath = path.join(dirPath, 'healthcareService.json');
		// Load healthcare service JSON fixture
		const healthcareServiceJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

		// Update healthcare service JSON with necessary values
		healthcareServiceJson.providedBy.id = managingOrgId;
		healthcareServiceJson.identifier[0].value = orgNPI;
		healthcareServiceJson.identifier[1].value = orgNPI;
		healthcareServiceJson.providedBy.reference = `Organization/${managingOrgId}`;
		healthcareServiceJson.providedBy.display = managingOrgName;
		healthcareServiceJson.providedBy.extension[0].valueReference.id = managingOrgId;
		healthcareServiceJson.providedBy.extension[0].valueReference.reference = `Organization/${managingOrgId}`;
		healthcareServiceJson.providedBy.extension[0].valueReference.display = managingOrgName;
		healthcareServiceJson.name = `E2ETEST-HS${randomNum}`;

		// Write healthcare service input to a file
		fs.writeFileSync(
			path.resolve(__dirname, './output/healthcare_input.json'),
			JSON.stringify(healthcareServiceJson, null, 2)
		);
		// Post healthcare service
		const res = await this.postResource(fhirEndpoints.healthcareService, healthcareServiceJson);
		console.log(`Healthcare Service has been created successfully. Id:${res?.id}, Name:${res?.name}`);

		return { id: res?.id, name: res?.name };
	}

	/**
	 * Posts a resource such as patient, study, order, etc.
	 * @param {string} fhirEndpoint a fhirEndpoint defined in fhirEndpoints
	 * @param {object} payload a payload. It can be a single or bundle request
	 * @param {string} resourceName resource name that is used for log purpose. Value should not be empty if fhirEndpoint is empty (bundle)
	 *
	 * @returns a promise including the resouce info
	 */
	async postResource(fhirEndpoint, payload, resourceName) {
		if (!payload) {
			return;
		}

		const token = await this.utilFuncs.getTokenAndSessionId();

		const url =
			fhirEndpoint === fhirEndpoints.bundle
				? `${playwrightConfig.baseApiUrl}fhir`
				: `${playwrightConfig.baseApiUrl}fhir/${fhirEndpoint}/`;

		const requestPayload = {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token?.accessToken}`,
				SessionID: token?.sessionID,
			},
			data: payload,
		};

		try {
			const response = await this.apiContext.post(url, requestPayload);

			if (!response.ok || ![200, 201].includes(response?.status())) {
				throw new Error(
					`APIRequests - postResource - ${
						fhirEndpoint || resourceName
					} : Failed. Status: ${response.status()}`
				);
			}
			const responseBody = await response.json();

			console.log(
				`APIRequests - postResource - ${fhirEndpoint || resourceName} : Successful. Response:`,
				responseBody
			);

			return responseBody;
		} catch (error) {
			console.error(`APIRequests - postResource - ${fhirEndpoint || resourceName} : Failed. Error: `, error);
			throw error; // Re-throw the error for the calling functions to handle
		}
	}

	async deleteRoleWorklistWithID(workListID) {
		let tokenAndSessionId = {};
		console.log('START - Delete role worklist id : ', workListID);
		console.log('START - Get token and session id');
		try {
			await this.utilFuncs
				.getTokenAndSessionId()
				.then(result => {
					tokenAndSessionId = result;
					console.log('Request successful:', tokenAndSessionId);
				})
				.catch(error => {
					// Handle error
					console.log('An error occurred:', error);
				});
		} catch (error) {
			// Handle error
			console.log('An error occurred:', error);
		}
		console.log('END - Get token and session id');

		console.log('START - Call API Delete role worklist');
		const url = `${playwrightConfig.baseApiUrl}fhir/WorklistLayout/${workListID}`;

		const requestPayload = {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
			},
		};
		try {
			const response = await this.apiContext.delete(url, requestPayload);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseBody = await response.text(); // Parse response body as JSON
			console.log('Response body:', responseBody);
			console.log('END - Call API Delete role worklist');
			return responseBody; // Return the parsed response body
		} catch (error) {
			console.error('Error deleting roleWorkList:', error);
			throw error; // Re-throw the error for handling elsewhere
		}
	}
	async putResource(resourceName, resourceId, payload, criteria) {
		if (!resourceName || !resourceId || !payload) {
			return;
		}
		const tokenObj = await this.utilFuncs.getTokenAndSessionId();

		// const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		// fs.writeFileSync(`${resourceName}PostPayload${randomNum}.json`, JSON.stringify(payload, null, 2));

		const url = `${playwrightConfig.baseApiUrl}fhir/${resourceName}/${resourceId}`;
		console.log(url);
		const requestPayload = {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
			data: payload,
		};
		const response = await this.apiContext.put(url, requestPayload);

		const responseBody = await response.json();
		// fs.writeFileSync(`${resourceName}PostRes${randomNum}.json`, JSON.stringify(responseBody, null, 2));

		return responseBody;
	}
	async getFhirResourceByCriteria(resourceName, criteria) {
		let tokenObj = await this.utilFuncs.getTokenAndSessionId();

		if (!tokenObj) {
			throw new Error('Missing parameters: tokenObj');
		}

		const response = await this.apiContext.get(`${playwrightConfig.baseApiUrl}fhir/${resourceName}?${criteria}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
		});

		const responseBody = await response.json();
		return responseBody;
	}
	async deleteResource(resourceName, resourceId) {
		let tokenObj = await this.utilFuncs.getTokenAndSessionId();

		if (!tokenObj) {
			throw new Error('Missing parameters: tokenObj');
		}

		const response = await this.apiContext.delete(
			`${playwrightConfig.baseApiUrl}fhir/${resourceName}/${resourceId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
				},
			}
		);

		response.ok
			? console.log(`Resource ${resourceName} with ID ${resourceId} deleted successfully`)
			: console.log(`Resource ${resourceName} with ID ${resourceId} not deleted`);
		return;
	}

	async getAdministratorRoleId(internalOrganizationID, tokenObj) {
		if (!tokenObj) {
			tokenObj = await this.utilFuncs.getTokenAndSessionId();
		}

		const response = await this.apiContext.get(
			`${playwrightConfig.baseApiUrl}fhir/Role?&organization=${internalOrganizationID}`,
			{
				headers: {
					Authorization: `Bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
				},
			}
		);

		if (response.status() !== 200) {
			throw new Error(`Failed to fetch roles. Status: ${response.status()}`);
		}

		const rolesData = await response.json();

		// Write response to file for debugging
		const dirPath = path.resolve(__dirname, './output');
		const filePath = path.join(dirPath, 'RoleGetRes.json');
		fs.mkdirSync(dirPath, { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(rolesData, null, 2), { flag: 'w' });

		// Find the index of the ADMINISTRATOR role
		const adminIndex = rolesData.entry.findIndex(entry => entry.resource.name === 'ADMINISTRATOR');

		if (adminIndex === -1) {
			throw new Error('ADMINISTRATOR role not found.');
		}

		// Extract and return the ID
		const adminRoleId = rolesData.entry[adminIndex].resource.id;
		return adminRoleId;
	}

	async extractDeepLink(organizationData) {
		// Extract deepLink value from organization response
		const deepLinkExtension = organizationData.extension.find(
			ext => ext.url === 'http://www.ramsoft.com/fhir/StructureDefinition/deepLink'
		);

		if (!deepLinkExtension) {
			throw new Error('DeepLink extension not found in organization data');
		}

		const deepLinkValue = deepLinkExtension.valueString;
		const deepLinkId = deepLinkValue.split('/').pop(); // Extract the ID from the URL

		return {
			deepLinkId,
			deepLinkValue,
		};
	}

	async patchOrganizationMetadata(organizationId, payload) {
		if (!organizationId || !payload) {
			throw new Error('Missing required parameters: organizationId and payload');
		}

		const tokenObj = await this.utilFuncs.getTokenAndSessionId();
		const url = `${playwrightConfig.baseApiUrl}fhir/Organization/metadata/${organizationId}`;

		const requestPayload = {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				'Content-Type': 'application/json',
			},
			data: payload,
		};

		try {
			const response = await this.apiContext.patch(url, requestPayload);

			if (!response.ok) {
				throw new Error(`Failed to patch organization metadata: ${response.statusText}`);
			}

			// For 204 No Content response, return success without trying to parse JSON
			if (response.status === 204) {
				console.log('Organization metadata patched successfully');
				return { success: true };
			}
		} catch (error) {
			console.error('Error patching organization metadata:', error);
			throw error;
		}
	}
}

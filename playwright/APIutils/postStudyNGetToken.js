const { execSync } = require('child_process');
const faker = require('community-faker');
const playwrightConfig = require('../../playwright.config');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { BlumeSignUpPage } = require('../POM/blumePage/blumeSignUpPage');
const { Common } = require('../POM/common');
const { OAISignUpPage } = require('../POM/oaiSignUpPage');
import { patientGenerator } from 'playwright/generators/patientGenerator';
const { v4: uuidv4 } = require('uuid');
const UserQuery = require('../DBUtils/UserQuery');
import { generateTestEmail } from 'cypress/support/testUtils';
export class postStudyNGetToken {
	/**
	 * @param {import('@playwright/test').Page} page
	 */
	constructor(apiContext) {
		this.apiContext = apiContext;
		this.maxRetries = 5;
		this.retryInterval = 3000; // 3 seconds
	}

	async getTokenAndSessionId(attempt = 1) {
		const tokenAndSessionId = {}; // Keeping the old structure

		try {
			const psFilePath = './cypress/tools/getTokenSessionId/getTokenSessionId.ps1';
			const { userName, password, environment, primaryEntityName, baseApiUrl, azureB2cTenantPrefix } =
				playwrightConfig;

			const testEnv = environment.split('-')[0].slice(0, 3);
			const entityName =
				testEnv === 'dev'
					? baseApiUrl.split('//')[1].split('-fhir')[0]
					: baseApiUrl.split('//')[1].split('-apim')[0];

			const command = `pwsh ${psFilePath} -resourceGroup ${entityName} -primaryEntityName ${primaryEntityName} -userName ${userName} -password ${password} -environment ${testEnv} -b2cTenantPrefix ${azureB2cTenantPrefix}`;

			console.log(`Executing PowerShell command (Attempt ${attempt}):`, command);

			const psOutput = execSync(command, { encoding: 'utf-8' });
			console.log(`PowerShell Output (Attempt ${attempt}):\n`, psOutput);

			let accessToken = null;
			psOutput.split('\n').forEach(line => {
				if (line.includes('Access Token Received:')) {
					accessToken = line.split(':')[1].trim();
				}
			});

			if (!accessToken) {
				throw new Error('Access Token not received');
			}

			tokenAndSessionId.accessToken = accessToken; // Keep the same variable name

			console.log(`Successfully retrieved access token on attempt ${attempt}`);
			return tokenAndSessionId;
		} catch (error) {
			console.error(`Attempt ${attempt} failed:`, error.message);

			if (attempt < this.maxRetries) {
				console.log(`Retrying in ${this.retryInterval / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, this.retryInterval));
				return this.getTokenAndSessionId(attempt + 1);
			}

			throw new Error(`Failed to retrieve access token after ${this.maxRetries} attempts.`);
		}
	}

	generateRandomNumber(minValue, maxValue) {
		return faker.datatype.number({
			min: minValue,
			max: maxValue,
		});
	}

	generate9DigitRandNum() {
		return this.generateRandomNumber(100000000, 999999999);
	}

	generate7DigitRandNum() {
		return this.generateRandomNumber(1111111, 9999999);
	}

	async createProcedure(tokenAndSessionId, procedureJson) {
		const url = (await playwrightConfig.baseApiUrl) + 'fhir/ProcedureCode';
		console.log(`URL2 ${url}`);
		let bearerToken = 'Bearer ' + tokenAndSessionId.accessToken;
		let requestPayload = {
			method: 'POST',
			headers: {
				Authorization: bearerToken,
				SessionID: tokenAndSessionId.sessionID,
				'Content-Type': 'application/fhir+json;charset=utf-8',
				Accept: '*/*',
			},
			data: procedureJson,
		};
		console.log('requestPayload createProcedure');
		console.log(requestPayload);
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

	async createStudyType(tokenAndSessionId, studyTypeJson) {
		let url = playwrightConfig.baseApiUrl + 'fhir/StudyType';
		let requestPayload = {
			method: 'POST',

			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
				'Content-Type': 'application/fhir+json;charset=utf-8',
				SessionID: tokenAndSessionId.sessionId,
			},
			data: studyTypeJson,
		};
		console.log('requestPayload createStudyType');
		// fs.writeFileSync('.requestPayload.json',JSON.stringify(requestPayload));
		console.log(requestPayload);
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

	async createPatient(tokenAndSessionId, patientJson) {
		let url = playwrightConfig.baseApiUrl + 'fhir';
		const requestPayload = {
			method: 'POST',

			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
				'Content-Type': 'application/fhir+json;charset=utf-8',
				SessionID: tokenAndSessionId.sessionId,
			},
			data: patientJson,
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

	async createOrganization(tokenAndSessionId, orgJson, request) {
		// console.log(`[${new Date().toISOString()}] Starting postOrganization function`);
		// const apiContext = request.newContext();
		const url = playwrightConfig.baseApiUrl + 'fhir/Organization';
		const requestPayload = {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + tokenAndSessionId.accessToken,
				'Content-Type': 'application/fhir+json;charset=utf-8',
				SessionID: tokenAndSessionId.sessionId,
			},
			data: orgJson,
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

	async createOrder(tokenAndSessionId, orderJson, request) {
		// const apiContext = request.newContext();
		// console.log(`[${new Date().toISOString()}] Starting postOrder function`);
		const url = playwrightConfig.baseApiUrl + 'fhir';
		const requestPayload = {
			method: 'POST',

			headers: {
				Authorization: 'bearer ' + tokenAndSessionId.accessToken,
				SessionID: tokenAndSessionId.sessionId,
			},
			data: orderJson,
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

	async postStudy(
		createPatientInputFile,
		isPatientV2,
		patientPayload,
		includePatientNames = false,
		managingOrg = null,
		imagingOrg = null,
		tokenObj = undefined
	) {
		let tokenAndSessionId = tokenObj;
		let gender = ['Male', 'Female'];
		const patientGender = faker.random.arrayElement(gender).toUpperCase();
		const patientSSN = this.generate9DigitRandNum();
		const patientBirthday = Common.generateAdultDOB();
		console.log('patientBirthday:', patientBirthday);
		const patientName = faker.name.findName().toUpperCase();
		const randomNum = this.generate9DigitRandNum();
		let managingOrgName = playwrightConfig.managingOrg.organizationName;
		let managingOrgId = playwrightConfig.managingOrg.organizationId;
		if (managingOrg) {
			managingOrgName = managingOrg.name;
			managingOrgId = managingOrg.id;
		}

		let imagingOrgName = playwrightConfig.managingOrg.organizationName;
		let imagingOrgId = playwrightConfig.managingOrg.organizationId;
		if (imagingOrg) {
			imagingOrgName = imagingOrg.name;
			imagingOrgId = imagingOrg.id;
		}

		let studyObject = {};
		// this.page.pause()
		// handle the resolved value or catch any errors
		if (!tokenAndSessionId) {
			try {
				await this.getTokenAndSessionId()
					.then(result => {
						tokenAndSessionId = result;
						console.log('Request successful:', tokenAndSessionId);
					})
					.catch(error => {
						console.log('An error occurred:', error);
					});
			} catch (error) {
				console.log('An error occurred:', error);
			}
		}
		// Main flow
		const procedureJson = JSON.parse(JSON.stringify(require('../studyInfo/postProcedure.json')));

		// Update procedureJson with necessary values
		procedureJson.code = `Code ${randomNum}`;
		procedureJson.display = `Display ${randomNum}`;
		procedureJson.organization = {};
		procedureJson.organization.id = managingOrgId;
		procedureJson.organization.reference = `/Organization/${managingOrgId}`;
		procedureJson.organization.display = managingOrgName;

		await this.createProcedure(tokenAndSessionId, procedureJson).then(async procedureResponsebody => {
			const studyTypeJson = JSON.parse(JSON.stringify(require('../jsonData/postStudyType.json')));
			// const studyTypeJson = procedureResponse;
			studyTypeJson.code = `STUDYTYPE${randomNum}`;
			studyTypeJson.description = `Description${randomNum}`;
			studyTypeJson.studyType = `STUDYTYPE${randomNum}`;
			studyTypeJson.extension[2].valueReference.id = managingOrgId;
			studyTypeJson.extension[2].valueReference.reference = `/Organization/${managingOrgId}`;
			studyTypeJson.procedureCode[0].coding[0].code = procedureJson.code;
			studyTypeJson.procedureCode[0].coding[0].display = procedureJson.display;

			let patientJson = JSON.parse(JSON.stringify(require('../studyInfo/postPatient.json')));
			await this.createStudyType(tokenAndSessionId, studyTypeJson).then(async studyTypeResponsebody => {
				// Update patientJson with necessary values
				if (isPatientV2 && !patientPayload) {
					patientJson = patientGenerator.generatePatientBundlePayload().patientPayload;
				} else if (patientPayload) {
					patientJson = { ...patientPayload };
				} else {
					// TODO: this code is being used for patient tests V1. Clean up it and update relatated test cases when Patient V2 is completely released
					patientJson.entry[0].resource.identifier[2].value = `DL${randomNum}`;
					patientJson.entry[0].resource.identifier[1].value = `${patientSSN}`;
					patientJson.entry[0].resource.name[0].text = `${patientName}`;
					if (includePatientNames) {
						patientJson.entry[0].resource.name[0].family = `${patientName.split(' ')[1]}`;
						patientJson.entry[0].resource.name[0].given = [];
						patientJson.entry[0].resource.name[0].given.push(`${patientName.split(' ')[0]}`);
					}
					patientJson.entry[0].resource.birthDate = `${patientBirthday}`;
					patientJson.entry[0].resource.gender = `${patientGender}`;
					patientJson.entry[0].resource.managingOrganization.id = managingOrgId;
					patientJson.entry[0].resource.managingOrganization.reference = `organization/${managingOrgId}`;
					patientJson.entry[0].resource.managingOrganization.display = managingOrgName;
					patientJson.entry[0].resource.telecom[0].value = generateTestEmail().toLowerCase();
					patientJson.entry[0].resource.telecom[1].value = faker.phone.phoneNumber('+84979######');
					patientJson.entry[1].resource.name = `PAYER${randomNum}`;
					patientJson.entry[1].resource.identifier[0].value = `PAYERID${randomNum}`;
					patientJson.entry[1].resource.partOf.id = managingOrgId;
					patientJson.entry[1].resource.partOf.reference = `organization/${managingOrgId}`;
					patientJson.entry[1].resource.partOf.display = managingOrgName;
					patientJson.entry[3].resource.identifier[0].value = `ACC${randomNum}`;

					if (createPatientInputFile) {
						const directoryPath = path.join(__dirname, '../POM/patientInformation');
						const filePath = path.join(directoryPath, 'patient_input.json');

						fs.writeFileSync(filePath, JSON.stringify(patientJson, null, 2));
					}
				}
				await this.createPatient(tokenAndSessionId, patientJson).then(async patientResponsebody => {
					console.log('patientResponse');
					// Handle patientResponse
					studyObject.patientId = patientResponsebody.entry[0].resource.id;
					if (includePatientNames) {
						studyObject.patientFirstName = patientResponsebody.entry[0].resource.name[0].given[0];
						studyObject.patientLastName = patientResponsebody.entry[0].resource.name[0].family;
					}
					studyObject.patientName = patientResponsebody.entry[0].resource.name[0].text;
					studyObject.patientSSN = patientResponsebody.entry[0].resource.identifier[0].value;
					studyObject.patientBirthday = patientResponsebody.entry[0].resource.birthDate;
					studyObject.patientGender = patientResponsebody.entry[0].resource.gender.toUpperCase();
					studyObject.patientTelephone = patientResponsebody.entry[0].resource.telecom[1].value;
					studyObject.patientEmail = patientResponsebody.entry[0].resource.telecom[0].value;

					const orderJson = JSON.parse(JSON.stringify(require('../jsonData/postOrder.json')));
					// Update orderJson with necessary values
					// Set study type
					orderJson.entry[1].resource.code.coding[0].code = studyTypeResponsebody.studyType;

					// Set patient info to encounter and service request
					orderJson.entry[0].resource.subject.id = orderJson.entry[1].resource.subject.id =
						studyObject.patientId;
					orderJson.entry[0].resource.subject.reference =
						orderJson.entry[1].resource.subject.reference = `patient/${studyObject.patientId}`;
					orderJson.entry[0].resource.subject.display = orderJson.entry[1].resource.subject.display =
						patientName;
					orderJson.entry[0].resource.identifier[0].assigner.id = managingOrgId;
					orderJson.entry[0].resource.identifier[0].assigner.reference = `organization/${managingOrgId}`;
					orderJson.entry[0].resource.identifier[0].assigner.display = managingOrgName;
					orderJson.entry[0].resource.serviceProvider.id = imagingOrgId;
					orderJson.entry[0].resource.serviceProvider.reference = `organization/${imagingOrgId}`;
					orderJson.entry[0].resource.serviceProvider.display = imagingOrgName;
					orderJson.entry[1].resource.requester.extension[0].valueReference.id = managingOrgId;
					orderJson.entry[1].resource.requester.extension[0].valueReference.reference = `organization/${managingOrgId}`;
					orderJson.entry[1].resource.requester.extension[0].valueReference.display = managingOrgName;
					orderJson.entry[1].resource.code.coding[0].display = `Study Description ${randomNum}`;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.id =
						managingOrgId;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.reference = `organization/${managingOrgId}`;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.display =
						managingOrgName;
					await this.createOrder(tokenAndSessionId, orderJson).then(async orderResponsebody => {
						// Handle orderResponse
						studyObject.visitId = orderResponsebody.entry[0].resource.id;
						studyObject.orderId = orderResponsebody.entry[1].resource.id;
						studyObject.accessionNum = orderResponsebody.entry[1].resource.identifier[0].value;
						studyObject.studyDescription = orderResponsebody.entry[1].resource.code.coding[0].display;
						studyObject.studyType = orderResponsebody.entry[1].resource.code.coding[0].code;
						studyObject.studyId = orderResponsebody.entry[1].resource.code.coding[0].id;
						studyObject.studyStatus =
							orderResponsebody.entry[1].resource.code.coding[0].extension[1].valueCode;
						studyObject.studyDateTime =
							orderResponsebody.entry[1].resource.code.coding[0].extension[0].valueDateTime.split('+')[0];
						let studyDT = new Date(studyObject.studyDateTime);
						studyObject.studyDateTime = new Intl.DateTimeFormat('en-US', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							timeZone: 'UTC', // Optionally set the timezone
						}).format(studyDT);
						//  studyDT.formatDateTime();
						console.log(studyObject.studyDateTime);
						studyObject.orderStatus = orderResponsebody.entry[1].resource.status.toUpperCase();
						studyObject.priority = orderResponsebody.entry[1].resource.priority.toUpperCase();
						studyObject.reasonCode = orderResponsebody.entry[1].resource.reasonCode;
						studyObject.visitId = orderResponsebody.entry[1].resource.encounter.id;
						studyObject.visitStatus = orderResponsebody.entry[0].resource.status.toUpperCase();
						studyObject.visitDateTime = orderResponsebody.entry[0].resource.extension.find(
							ext => ext.url === 'VisitDateTimeUTC'
						)?.valueDateTime;
						let visitDT = new Date(studyObject.visitDateTime);
						studyObject.visitDateTime = new Intl.DateTimeFormat('en-US', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							timeZone: 'UTC', // Optionally set the timezone
						}).format(visitDT);

						// Find the imaging facility extension by URL and set imagingOrganization
						const imagingFacilityExt = orderResponsebody.entry[1].resource.code.coding[0].extension.find(
							ext => ext.url === 'http://www.ramsoft.com/fhir/StructureDefinition/imagingFacility'
						);
						studyObject.imagingOrganization = imagingFacilityExt?.valueReference?.display;
					});
				});
			});
		});
		console.log(`[${new Date().toISOString()}] PostStudy successful`);

		return studyObject;
	}

	async postOrderSet() {
		let tokenAndSessionId = {};
		const randomNum = this.generate7DigitRandNum();
		let orderSetObj = {};
		try {
			await this.getTokenAndSessionId()
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

		const studyTypeJson = JSON.parse(JSON.stringify(require('../jsonData/postStudyType.json')));
		studyTypeJson.code = `STUDYTYPE${randomNum}`;
		studyTypeJson.description = `Description${randomNum}`;
		studyTypeJson.studyType = `STUDYTYPE${randomNum}`;
		studyTypeJson.extension[2].valueReference.id = playwrightConfig.managingOrg.organizationId;
		studyTypeJson.extension[2].valueReference.reference = `/Organization/${playwrightConfig.managingOrg.organizationId}`;

		await this.createStudyType(tokenAndSessionId, studyTypeJson).then(async studyTypeResponsebody => {
			orderSetObj.id = studyTypeResponsebody.id;
			orderSetObj.studyType = studyTypeResponsebody.studyType;
			orderSetObj.description = studyTypeResponsebody.description;
			orderSetObj.modality = studyTypeResponsebody.modality.display;
			orderSetObj.bodyPart = studyTypeResponsebody.extension
				?.find(ext => ext.url.includes('bodyPart'))
				?.extension?.map(bp => bp.valueCoding?.display)
				.join(', ');
			orderSetObj.duration = studyTypeResponsebody.duration;
			orderSetObj.active = studyTypeResponsebody.active;
		});

		return orderSetObj;
	}

	async postReferringOrganization() {
		let referringOrgName = '';
		let tokenAndSessionId = {};
		const randomNum = this.generate7DigitRandNum();
		let managingOrgJson = {};
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		let refOrgObject = {};
		referringOrgName = `REFERRING ORG${randomNum}`;
		let refOrgPayload = {};

		try {
			await this.getTokenAndSessionId()
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
		// Main flow
		await this.getResourceById('Organization', managingOrgId, tokenAndSessionId).then(async orgResponse => {
			managingOrgJson = orgResponse;
			let refOrgJson = JSON.parse(
				JSON.stringify(require('../APIutils/organization/postReferringOrganization.json'))
			);
			// Update refOrgJson with necessary values
			const linkedOrgUrl = 'http://www.ramsoft.com/fhir/StructureDefinition/linkedOrganization';
			// Update the referring organization json
			refOrgJson.entry[0].resource.name = referringOrgName;
			// linkedOrganization info:
			refOrgJson.entry[0].resource.extension[3].valueReference.id = managingOrgId;
			refOrgJson.entry[0].resource.extension[3].valueReference.reference = `Organization/${managingOrgId}`;
			refOrgJson.entry[0].resource.extension[3].valueReference.display = managingOrgName;

			// Update the linked organization json
			// linked ref org info
			refOrgJson.entry[1].request.url = `/Organization/${managingOrgId}`;

			const index = managingOrgJson.extension?.findIndex(ext => ext?.url === linkedOrgUrl);
			const refOrg = {
				url: 'detail',
				valueReference: {
					reference: refOrgJson.entry[0].fullUrl,
					display: referringOrgName,
				},
			};
			console.log('index: ', index);
			if (index > -1) {
				if (managingOrgJson.extension[index].extension?.length > 0) {
					managingOrgJson.extension[index].extension.push(refOrg);
				} else {
					managingOrgJson.extension[index].extension = [{ ...refOrg }];
				}
			} else {
				managingOrgJson.extension.push({
					extension: [{ ...refOrg }],
					url: linkedOrgUrl,
				});
			}

			refOrgJson.entry[1].resource = managingOrgJson;
			refOrgPayload = refOrgJson;
			await this.postResource('ReferringOrganization', refOrgPayload, tokenAndSessionId, true).then(
				async orgResponsebody => {
					refOrgObject.id = orgResponsebody.entry[0].resource.id;
					refOrgObject.name = orgResponsebody.entry[0].resource.name;
				}
			);
		});

		return refOrgObject;
	}

	async postReferringPhysician(refOrgId, refOrgName, email) {
		let refPhysicianObj = {};
		let tokenAndSessionId = {};

		if (!refOrgId || !refOrgName) {
			throw new Error('Referring Organization ID and Name are required.');
		}

		try {
			await this.getTokenAndSessionId()
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

		// Generate random names for the referring physician
		const givenName = `CHECKLY`;
		const familyName = `REFUSER`;

		// Load the referring physician JSON template
		const refPhysicianJson = JSON.parse(JSON.stringify(require('../APIutils/user/postReferringPhysician.json')));

		// Update the JSON with dynamic data
		refPhysicianJson.entry[0].resource.name[0].given[0] = givenName;
		refPhysicianJson.entry[0].resource.name[0].family = familyName;
		refPhysicianJson.entry[0].resource.name[0].text = `${givenName}^${familyName}`;
		refPhysicianJson.entry[0].resource.extension[0].valueString = email;

		refPhysicianJson.entry[1].resource.practitioner.reference = refPhysicianJson.entry[0].fullUrl;
		refPhysicianJson.entry[1].resource.organization.display = refOrgName;
		refPhysicianJson.entry[1].resource.organization.id = refOrgId;
		refPhysicianJson.entry[1].resource.organization.reference = `Organization/${refOrgId}`;

		// Post the referring physician resource
		await this.postResource('ReferringPhysician', refPhysicianJson, tokenAndSessionId, true).then(
			async refResponsebody => {
				refPhysicianObj.id = refResponsebody?.entry[0]?.resource?.id;
				refPhysicianObj.name = `${refResponsebody?.entry[0]?.resource?.name[0].given[0]} ${refResponsebody?.entry[0]?.resource?.name[0].family}`;
			}
		);
		return refPhysicianObj;
	}

	async postStudywithPrior(addPriorStudy = true) {
		// console.log(playwrightConfig.baseApiUrl + 'fhir/ProcedureCode')

		let tokenAndSessionId = {};
		let gender = ['Male', 'Female'];
		const patientGender = faker.random.arrayElement(gender).toUpperCase();
		const patientSSN = this.generate9DigitRandNum();
		const patientBirthday = Common.generateAdultDOB();
		console.log('patientBirthday:', patientBirthday);
		const patientName = faker.name.findName().toUpperCase();
		const randomNum = this.generate7DigitRandNum();
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		let studyObject = {};
		// this.page.pause()
		// handle the resolved value or catch any errors
		try {
			await this.getTokenAndSessionId()
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
		// Main flow
		const procedureJson = JSON.parse(JSON.stringify(require('../studyInfo/postProcedure.json')));

		// Update procedureJson with necessary values
		procedureJson.code = `Code ${randomNum}`;
		procedureJson.display = `Display ${randomNum}`;
		procedureJson.organization = {};
		procedureJson.organization.id = playwrightConfig.managingOrg.organizationId;
		procedureJson.organization.reference = `/Organization/${playwrightConfig.managingOrg.organizationId}`;
		procedureJson.organization.display = playwrightConfig.managingOrg.organizationName;
		// cy.writeTestInputOutputToFile('procedure_input.json', procedureJson);

		await this.createProcedure(tokenAndSessionId, procedureJson).then(async procedureResponsebody => {
			const studyTypeJson = JSON.parse(JSON.stringify(require('../jsonData/postStudyType')));
			// const studyTypeJson = procedureResponse;
			studyTypeJson.code = `STUDYTYPE${randomNum}`;
			studyTypeJson.studyDescription = `Description${randomNum}`;
			studyTypeJson.studyType = `STUDYTYPE${randomNum}`;
			studyTypeJson.extension[2].valueReference.id = playwrightConfig.managingOrg.organizationId;
			studyTypeJson.extension[2].valueReference.reference = `/Organization/${playwrightConfig.managingOrg.organizationId}`;
			studyTypeJson.procedureCode[0].coding[0].code = procedureJson.code;
			studyTypeJson.procedureCode[0].coding[0].display = procedureJson.display;
			// cy.writeTestInputOutputToFile('studyType_input.json', studyTypeJson);
			const patientJson = JSON.parse(JSON.stringify(require('../studyInfo/postPatient.json')));
			// const patientJson = {};
			await this.createStudyType(tokenAndSessionId, studyTypeJson).then(async studyTypeResponsebody => {
				// Update patientJson with necessary values
				patientJson.entry[0].resource.identifier[2].value = `DL${randomNum}`;
				patientJson.entry[0].resource.identifier[1].value = `${patientSSN}`;
				patientJson.entry[0].resource.name[0].text = `${patientName}`;
				patientJson.entry[0].resource.birthDate = `${patientBirthday}`;
				patientJson.entry[0].resource.gender = `${patientGender}`;
				patientJson.entry[0].resource.managingOrganization.id = managingOrgId;
				patientJson.entry[0].resource.managingOrganization.reference = `organization/${managingOrgId}`;
				patientJson.entry[0].resource.managingOrganization.display = managingOrgName;
				patientJson.entry[0].resource.telecom[0].value = generateTestEmail().toLowerCase();
				patientJson.entry[0].resource.telecom[1].value = faker.phone.phoneNumber('+1226868####');
				patientJson.entry[1].resource.name = `PAYER${randomNum}`;
				patientJson.entry[1].resource.identifier[0].value = `PAYERID${randomNum}`;
				patientJson.entry[1].resource.partOf.id = managingOrgId;
				patientJson.entry[1].resource.partOf.reference = `organization/${managingOrgId}`;
				patientJson.entry[1].resource.partOf.display = managingOrgName;
				patientJson.entry[3].resource.identifier[0].value = `ACC${randomNum}`;

				await this.createPatient(tokenAndSessionId, patientJson).then(async patientResponsebody => {
					// console.log(await patientResponse.dispose());
					console.log('patientResponse');
					// Handle patientResponse
					studyObject.patientId = patientResponsebody.entry[0].resource.id;
					studyObject.patientName = patientResponsebody.entry[0].resource.name[0].text;
					studyObject.patientSSN = patientResponsebody.entry[0].resource.identifier[0].value;
					studyObject.patientBirthday = patientResponsebody.entry[0].resource.birthDate;
					studyObject.patientGender = patientResponsebody.entry[0].resource.gender.toUpperCase();

					const orderJson = JSON.parse(JSON.stringify(require('../jsonData/postOrder.json')));
					// Update orderJson with necessary values
					// Set study type
					orderJson.entry[1].resource.code.coding[0].code = studyTypeResponsebody.studyType;

					// Set patient info to encounter and service request
					orderJson.entry[0].resource.subject.id = orderJson.entry[1].resource.subject.id =
						studyObject.patientId;
					orderJson.entry[0].resource.subject.reference =
						orderJson.entry[1].resource.subject.reference = `patient/${studyObject.patientId}`;
					orderJson.entry[0].resource.subject.display = orderJson.entry[1].resource.subject.display =
						patientName;
					orderJson.entry[0].resource.identifier[0].assigner.id = managingOrgId;
					orderJson.entry[0].resource.identifier[0].assigner.reference = `organization/${managingOrgId}`;
					orderJson.entry[0].resource.identifier[0].assigner.display = managingOrgName;
					orderJson.entry[0].resource.serviceProvider.id = managingOrgId;
					orderJson.entry[0].resource.serviceProvider.reference = `organization/${managingOrgId}`;
					orderJson.entry[0].resource.serviceProvider.display = managingOrgName;
					orderJson.entry[1].resource.requester.extension[0].valueReference.id = managingOrgId;
					orderJson.entry[1].resource.requester.extension[0].valueReference.reference = `organization/${managingOrgId}`;
					orderJson.entry[1].resource.requester.extension[0].valueReference.display = managingOrgName;
					orderJson.entry[1].resource.code.coding[0].display = `Study Description ${randomNum}`;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.id =
						managingOrgId;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.reference = `organization/${managingOrgId}`;
					orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.display =
						managingOrgName;
					// cy.writeTestInputOutputToFile('order_input.json', orderJson);

					await this.createOrder(tokenAndSessionId, orderJson).then(async orderResponsebody => {
						// Handle orderResponse
						// cy.writeTestInputOutputToFile('order_response.json', orderResponse);
						studyObject.visitId = orderResponsebody.entry[0].resource.id;
						studyObject.orderId = orderResponsebody.entry[1].resource.id;
						studyObject.accessionNum = orderResponsebody.entry[1].resource.identifier[0].value;
						studyObject.studyDescription = orderResponsebody.entry[1].resource.code.coding[0].display;
						studyObject.studyId = orderResponsebody.entry[1].resource.code.coding[0].id;
						studyObject.studyStatus =
							orderResponsebody.entry[1].resource.code.coding[0].extension[1].valueCode;
						studyObject.studyDateTime =
							orderResponsebody.entry[1].resource.code.coding[0].extension[0].valueDateTime.split('+')[0];
						let studyDT = new Date(studyObject.studyDateTime);
						studyObject.studyDateTime = new Intl.DateTimeFormat('en-US', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							timeZone: 'UTC', // Optionally set the timezone
						}).format(studyDT);
						//  studyDT.formatDateTime();
						console.log(studyObject.studyDateTime);
						studyObject.orderStatus = orderResponsebody.entry[1].resource.status.toUpperCase();
						studyObject.priority = orderResponsebody.entry[1].resource.priority.toUpperCase();
						studyObject.reasonCode = orderResponsebody.entry[1].resource.reasonCode;
						studyObject.visitId = orderResponsebody.entry[1].resource.encounter.id;
						studyObject.visitStatus = orderResponsebody.entry[0].resource.status.toUpperCase();
						studyObject.visitDateTime = orderResponsebody.entry[0].resource.extension.find(
							ext => ext.url === 'VisitDateTimeUTC'
						)?.valueDateTime;
						let visitDT = new Date(studyObject.visitDateTime);
						studyObject.visitDateTime = new Intl.DateTimeFormat('en-US', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							timeZone: 'UTC', // Optionally set the timezone
						}).format(visitDT);
						studyObject.imagingOrganization =
							orderResponsebody.entry[1].resource.code.coding[0].extension[4].valueReference.display;

						// Get StudyUID
						let extensions = orderResponsebody.entry[1].resource.code.coding[0].extension;
						let studyUIDExtension = extensions.find(ext => ext.url === 'StudyUID');
						let studyUID = studyUIDExtension ? studyUIDExtension.valueString : '';
						studyObject.studyUID = studyUID;
					});
					if (addPriorStudy) {
						const orderJson = JSON.parse(JSON.stringify(require('../jsonData/postOrder.json')));
						// Update orderJson with necessary values
						// Set study type
						orderJson.entry[1].resource.code.coding[0].code = studyTypeResponsebody.studyType;

						// Set patient info to encounter and service request
						orderJson.entry[0].resource.subject.id = orderJson.entry[1].resource.subject.id =
							studyObject.patientId;
						orderJson.entry[0].resource.subject.reference =
							orderJson.entry[1].resource.subject.reference = `patient/${studyObject.patientId}`;
						orderJson.entry[0].resource.subject.display = orderJson.entry[1].resource.subject.display =
							patientName;
						orderJson.entry[0].resource.identifier[0].assigner.id = managingOrgId;
						orderJson.entry[0].resource.identifier[0].assigner.reference = `organization/${managingOrgId}`;
						orderJson.entry[0].resource.identifier[0].assigner.display = managingOrgName;
						orderJson.entry[0].resource.serviceProvider.id = managingOrgId;
						orderJson.entry[0].resource.serviceProvider.reference = `organization/${managingOrgId}`;
						orderJson.entry[0].resource.serviceProvider.display = managingOrgName;
						orderJson.entry[1].resource.requester.extension[0].valueReference.id = managingOrgId;
						orderJson.entry[1].resource.requester.extension[0].valueReference.reference = `organization/${managingOrgId}`;
						orderJson.entry[1].resource.requester.extension[0].valueReference.display = managingOrgName;
						orderJson.entry[1].resource.code.coding[0].display = `Study Description ${randomNum}`;
						orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.id =
							managingOrgId;
						orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.reference = `organization/${managingOrgId}`;
						orderJson.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.display =
							managingOrgName;
						// cy.writeTestInputOutputToFile('order_input.json', orderJson);

						await this.createOrder(tokenAndSessionId, orderJson).then(async orderResponsebody => {
							// Handle orderResponse
							// cy.writeTestInputOutputToFile('order_response.json', orderResponse);
							studyObject.visitId = orderResponsebody.entry[0].resource.id;
							studyObject.orderId = orderResponsebody.entry[1].resource.id;
							studyObject.accessionNum1 = orderResponsebody.entry[1].resource.identifier[0].value;
							studyObject.studyDescription = orderResponsebody.entry[1].resource.code.coding[0].display;
							studyObject.studyId1 = orderResponsebody.entry[1].resource.code.coding[0].id;
							studyObject.studyStatus =
								orderResponsebody.entry[1].resource.code.coding[0].extension[1].valueCode;
							studyObject.studyDateTime =
								orderResponsebody.entry[1].resource.code.coding[0].extension[0].valueDateTime.split(
									'+'
								)[0];
							let studyDT = new Date(studyObject.studyDateTime);
							studyObject.studyDateTime = new Intl.DateTimeFormat('en-US', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
								timeZone: 'UTC', // Optionally set the timezone
							}).format(studyDT);
							//  studyDT.formatDateTime();
							console.log(studyObject.studyDateTime);
							studyObject.orderStatus = orderResponsebody.entry[1].resource.status.toUpperCase();
							studyObject.priority = orderResponsebody.entry[1].resource.priority.toUpperCase();
							studyObject.reasonCode = orderResponsebody.entry[1].resource.reasonCode;
							studyObject.visitId = orderResponsebody.entry[1].resource.encounter.id;
							studyObject.visitStatus = orderResponsebody.entry[0].resource.status.toUpperCase();
							studyObject.visitDateTime = orderResponsebody.entry[0].resource.extension.find(
								ext => ext.url === 'VisitDateTimeUTC'
							)?.valueDateTime;
							let visitDT = new Date(studyObject.visitDateTime);
							studyObject.visitDateTime = new Intl.DateTimeFormat('en-US', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
								timeZone: 'UTC', // Optionally set the timezone
							}).format(visitDT);
							studyObject.imagingOrganization =
								orderResponsebody.entry[1].resource.code.coding[0].extension[4].valueReference.display;

							// Get StudyUID
							let extensions = orderResponsebody.entry[1].resource.code.coding[0].extension;
							let studyUIDExtension = extensions.find(ext => ext.url === 'StudyUID');
							let studyUID = studyUIDExtension ? studyUIDExtension.valueString : '';
							studyObject.studyUID1 = studyUID;
						});
					}
				});
			});
		});
		console.log(`[${new Date().toISOString()}] PostStudy successful`);
		return studyObject;
	}

	async loginOmegaAI() {
		page.goto(playwrightConfig.logInOaiUrl);
		await page.locator('[data-cy="omegaai"]').click();
		await page.locator('[data-cy="omegaai"]').click({
			button: 'right',
		});
		await page.getByText('Bring success to your business').click();
		await page.getByPlaceholder('Enter your email address here').fill('ramsoftlocaluser02@gmail.com');
		await page.getByRole('button', { name: 'CONTINUE' }).click();

		await page.getByLabel('Password').fill('145948');
		expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
		await page.getByRole('button', { name: 'Continue' }).click();
	}

	// https://www.omegaai.com/api/
	async getUserDetails() {
		let tokenAndSessionId = '';
		try {
			await this.getTokenAndSessionId()
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
				SessionID: tokenAndSessionId.sessionID,
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
			await this.getTokenAndSessionId()
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

	async importStudyToManaginOrg(filePath, organizationId) {
		let tokenAndSessionId = {};

		try {
			await this.getTokenAndSessionId()
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
			`dicomweb/studies/?internalManagingOrganizationID=${
				organizationId ?? playwrightConfig.managingOrg.organizationId
			}`;

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

	async deleteStudyFromMangingOrg(studyUID, organizationId) {
		let tokenAndSessionId = {};

		try {
			await this.getTokenAndSessionId()
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
			`dicomweb/study/${studyUID}?InternalOrganizationID=${
				organizationId ?? playwrightConfig.managingOrg.organizationId
			}`;

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
			await this.getTokenAndSessionId()
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
			tokenObj = await this.getTokenAndSessionId();
			return this.getResourceByInternalId(resourceName, internalId, tokenObj);
		}
	}

	// Function to get a resource by internal ID
	async getResourceByInternalId(resourceName, internalId, tokenObj) {
		if (!tokenObj || !internalId || !resourceName) {
			throw new Error('Missing parameters: tokenObj, internalId, or resourceName');
		}

		const response = await await this.apiContext.get(
			`${playwrightConfig.baseApiUrl}fhir/${resourceName}/${internalId}`,
			{
				headers: {
					Authorization: `Bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
				},
			}
		);

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
		const randomNum = this.generate7DigitRandNum();
		// Get token and session ID
		tokenObj = await this.getTokenAndSessionId();

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
		const res = await this.postResource('healthcareservice', healthcareServiceJson, tokenObj);
		console.log(`Healthcare Service has been created successfully. Id:${res?.id}, Name:${res?.name}`);

		return { id: res?.id, name: res?.name };
	}

	async postResource(resourceName, payload, tokenObj, isBundle) {
		if (!tokenObj || !resourceName || !payload) {
			return;
		}

		// const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		// fs.writeFileSync(`${resourceName}PostPayload${randomNum}.json`, JSON.stringify(payload, null, 2));

		const url = isBundle
			? `${playwrightConfig.baseApiUrl}fhir/`
			: `${playwrightConfig.baseApiUrl}fhir/${resourceName}/`;
		console.log(url);
		const requestPayload = {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
			data: payload,
		};
		const response = await this.apiContext.post(url, requestPayload);

		const responseBody = await response.json();
		// fs.writeFileSync(`${resourceName}PostRes${randomNum}.json`, JSON.stringify(responseBody, null, 2));

		return responseBody;
	}

	async putResource(resourceName, resourceId, payload) {
		if (!resourceName || !resourceId || !payload) {
			return;
		}
		const tokenObj = await this.getTokenAndSessionId();
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
		return responseBody;
	}

	async getFhirResourceByCriteria(resourceName, criteria) {
		let tokenObj = await this.getTokenAndSessionId();

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

	async mergePatients(keepPatientId, replacePatientId) {
		let tokenObj = await this.getTokenAndSessionId();

		if (!tokenObj) {
			throw new Error('Missing parameters: tokenObj');
		}

		const response = await this.apiContext.post(
			`${playwrightConfig.baseApiUrl}fhir/patient/merge/?keepPatientId=${keepPatientId}&replacePatientId=${replacePatientId}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
					'Content-Type': 'application/json',
					Accept: '*/*',
				},
				data: [],
			}
		);

		return response;
	}

	async getInstanceInfo(studyuid, seriesuid, instanceuid, managingOrgId) {
		let tokenObj = await this.getTokenAndSessionId();

		if (!tokenObj) {
			throw new Error('Missing parameters: tokenObj');
		}

		let url =
			playwrightConfig.baseURL +
			`dicomweb/studies/${studyuid}/series/${seriesuid}/instances?SOPInstanceUID=${instanceuid}`;

		const response = await this.apiContext.get(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
				Accept: '*/*',
				'ramsoft-internalmanagingorganizationid': managingOrgId,
			},
			data: [],
		});

		const responseBody = await response.json();
		return responseBody;
	}

	// Function to update GUI Role
	async updateGuiRole(roleId, tokenObj) {
		if (!tokenObj) {
			tokenObj = await this.getTokenAndSessionId();
		}

		// Fetch the existing GuiRole
		const response = await this.apiContext.get(`${playwrightConfig.baseApiUrl}fhir/Role/GuiRole/${roleId}`, {
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
		});

		if (response.status() !== 200) {
			throw new Error(`Failed to fetch GuiRole. Status: ${response.status()}`);
		}

		let roleData = await response.json();
		let guiPermissions = roleData.GuiPermissions || [];
		// Ensure userType contains the required value
		const requiredUserType =
			'Reading Physician|Referring Physician|Performing Physician|Performing Technologist|Transcriptionist';
		if (roleData.userType !== requiredUserType) {
			roleData.userType = requiredUserType;
			console.log('Updated userType:', roleData.userType);
		}

		// Locate "Organizations" inside "GuiPermissions"
		let org = guiPermissions.find(p => p.resource === 'Organizations');
		if (!org || !org.permissions) {
			console.log('Organizations NOT FOUND or has no permissions');
			return;
		}

		// Locate "StudyStatus" inside "Organizations.permissions"
		let studyStatus = org.permissions.find(p => p.resource === 'StudyStatus');
		if (!studyStatus || !studyStatus.permissions) {
			console.log('StudyStatus NOT FOUND or has no permissions');
			return;
		}

		// Locate "OverrideStudyStatusTransition" inside "StudyStatus.permissions"
		let overridePermission = studyStatus.permissions.find(p => p.resource === 'OverrideStudyStatusTransition');

		if (overridePermission) {
			// Update the existing entry
			overridePermission.action = ['read'];
			overridePermission.permissions = [];
			console.log('Updated OverrideStudyStatusTransition:', JSON.stringify(overridePermission, null, 2));
		} else {
			console.log('OverrideStudyStatusTransition NOT FOUND inside StudyStatus.permissions');
			return;
		}

		// PUT request to update `GuiPermissions`
		const updateResponse = await this.apiContext.put(`${playwrightConfig.baseApiUrl}fhir/Role/GuiRole/${roleId}`, {
			headers: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
				'Content-Type': 'application/json',
			},
			data: roleData,
		});

		if (updateResponse.status() === 200) {
			console.log('GuiRole updated successfully with updated GuiPermissions');
		} else {
			throw new Error(`Failed to update GuiRole. Status: ${updateResponse.status()}`);
		}
	}

	/**
	 * Fetches the latest OTP code from Mailsac for a given email.
	 */
	async getOtpCode(email, apiKey) {
		if (!apiKey) throw new Error('API key is missing. Please provide a valid Mailsac API key.');

		const messagesRes = await fetch(`https://mailsac.com/api/addresses/${email}/messages`, {
			method: 'GET',
			headers: { 'Mailsac-Key': apiKey },
		});

		if (messagesRes.status === 401) throw new Error('Unauthorized access. Please check your API key.');
		if (messagesRes.status !== 200) throw new Error(`Failed to fetch messages. Status: ${messagesRes.status}`);

		const messages = await messagesRes.json();
		if (!messages.length) throw new Error('No messages found.');

		const otpMessage = messages
			.sort((a, b) => new Date(b.received) - new Date(a.received))
			.find(msg => msg.subject.includes('Blume Account Verification Code'));
		if (!otpMessage) throw new Error('No OTP message found.');

		const detailRes = await fetch(`https://mailsac.com/api/addresses/${email}/messages/${otpMessage._id}`, {
			method: 'GET',
			headers: { 'Mailsac-Key': apiKey },
		});
		if (detailRes.status !== 200) throw new Error(`Failed to fetch message details. Status: ${detailRes.status}`);

		const message = await detailRes.json();
		const match = message.subject.match(/Verification Code: (\d{6})/);
		if (!match) throw new Error('OTP code not found in the email subject.');

		return match[1];
	}

	/**
	 * Fetches the invite URL from a Mailsac email.
	 */
	async getInviteUrl(email, apiKey, emailSubject) {
		await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before fetching the invite URL
		if (!apiKey) throw new Error('API key is missing. Please provide a valid Mailsac API key.');

		const messagesRes = await fetch(`https://mailsac.com/api/addresses/${email}/messages`, {
			method: 'GET',
			headers: { 'Mailsac-Key': apiKey },
		});

		if (messagesRes.status === 401) throw new Error('Unauthorized access. Please check your API key.');
		if (messagesRes.status !== 200) throw new Error(`Failed to fetch messages. Status: ${messagesRes.status}`);

		const messages = await messagesRes.json();
		if (!messages.length) throw new Error('No messages found.');

		const inviteMessage = messages
			.sort((a, b) => new Date(b.received) - new Date(a.received))
			.find(msg => msg.subject.includes(emailSubject));
		if (!inviteMessage) throw new Error('No invite message found.');

		const detailRes = await fetch(`https://mailsac.com/api/addresses/${email}/messages/${inviteMessage._id}`, {
			method: 'GET',
			headers: { 'Mailsac-Key': apiKey },
		});
		if (detailRes.status !== 200) throw new Error(`Failed to fetch message details. Status: ${detailRes.status}`);

		const message = await detailRes.json();
		if (!message.links || !message.links.length) throw new Error('No invite URL found in the email links.');

		return message.links[0];
	}

	/**
	 * The OAI sign-up process
	 */
	async oaiSignUp(page, email, apiKey, emailSubject) {
		const oaiSignUpPage = new OAISignUpPage(page);
		const inviteUrl = await this.getInviteUrl(email, apiKey, emailSubject);
		console.log('inviteUrl:', inviteUrl);
		await page.goto(inviteUrl.replaceAll(/&amp;/g, '&'));

		await expect(page.locator('#registerWithEmailDropdownArrow')).toBeVisible({ timeout: 10000 });
		await page.click('#registerWithEmailDropdownArrow'); // Click after visibility

		await oaiSignUpPage.userFirstName().fill(`REFERFN`);
		await oaiSignUpPage.userLastName().fill(`REFERLN`);
		await oaiSignUpPage.newPassword().fill('111111');
		await oaiSignUpPage.reenterPassword().fill('111111');
		await oaiSignUpPage.newContinueBtn().click({ force: true });
		await page.waitForTimeout(40000);
		//await page.waitForResponse(resp => resp.url().includes('loggedUser') && resp.status() === 200);
		console.log('Registered and Auto Logged in successfully');
	}

	/**
	 * Automates the Blume sign-up process
	 */
	async blumeSignUpV2(page, email, givenName, familyName, dob, pin, apiKey, emailSubject) {
		const signUpPage = new BlumeSignUpPage(page);
		const inviteUrl = await this.getInviteUrl(email, apiKey, emailSubject);
		console.log('inviteUrl:', inviteUrl);
		await page.goto(inviteUrl);

		// Wait for the B2C login page to load
		await expect(page.getByText('Register with email')).toBeVisible({ timeout: 30000 });

		// Verify pre-filled fields & sign up
		await expect(page.locator('#optionalEmail')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('#optionalEmail')).toHaveValue(email, { timeout: 10000 });
		await expect(page.locator('#surname')).toHaveValue(familyName);
		await expect(page.locator('#givenName')).toHaveValue(givenName);
		// await expect(page.locator('#dob')).toHaveValue(dob);

		await signUpPage.fillGivenName(givenName);
		await signUpPage.fillFamilyName(familyName);
		await signUpPage.fillDOB(dob);
		await signUpPage.fillEmail(email);
		await signUpPage.verifyEmail();

		await page.waitForTimeout(60000);
		const otpCode = await this.getOtpCode(email, apiKey);

		for (let i = 0; i < otpCode.length; i++) {
			await page.locator(`#otpContainer input.email-otp-input`).nth(i).fill(otpCode[i]);
		}

		await signUpPage.fillNewPassword(pin);
		await signUpPage.reenterPassword(pin);
		// Ensure navigating happens after filling the password
		await page.waitForTimeout(10000);
		console.log('Registered successfully');
		await page.waitForResponse(resp => resp.url().includes('User/loggeduser') && resp.status() === 200);
	}

	// function to updateStudyStatus
	async updateStudyStatusSequentially(studyId, tokenObj) {
		const statusSequence = ['ORDER', 'ARRIVED', 'COMPLETED', 'VERIFIED', 'SIGNED'];

		const updateStatus = async (index, studyRes) => {
			if (index >= statusSequence.length) {
				console.log('Study status update completed.');
				return;
			}

			const newStatus = statusSequence[index];
			const statusIndex = studyRes?.extension?.findIndex(
				({ url }) => url === 'http://www.ramsoft.com/fhir/StructureDefinition/status'
			);

			if (statusIndex !== -1) {
				studyRes.extension[statusIndex].valueString = newStatus;
				studyRes.status = newStatus;

				const updatedRes = await this.putResource('ImagingStudy', studyRes.id, studyRes);
				console.log(`Updated study status to: ${updatedRes?.extension[statusIndex]?.valueString}`);
				await updateStatus(index + 1, updatedRes);
			} else {
				console.warn('Status extension not found in study resource.');
			}
		};

		const studyRes = await this.getResourceById('ImagingStudy', studyId, tokenObj);
		await updateStatus(1, studyRes); // Start from 'ARRIVED'
	}

	async postClinicalForm() {
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		const userName = playwrightConfig.userName || playwrightConfig.managingOrg.userName || '';
		let tokenObj = {};
		let randomNum = this.generate7DigitRandNum();
		let internalUserId = '';

		// Get internal user ID (simulate userDb.getInternalUserID)
		// You may need to implement getInternalUserID if not present
		if (this.getInternalUserID) {
			const userRows = await UserQuery.getInternalUserID({ UserName: userName });
			internalUserId = userRows[0]?.InternalUserID || '';
		} else {
			// fallback: try to get from config or throw
			internalUserId = playwrightConfig.internalUserId || '';
		}

		tokenObj = await this.getTokenAndSessionId();

		const dirPath = path.resolve(__dirname, './organization');
		const filePath = path.join(dirPath, 'postClinicalForm.json');
		const clinicalFormJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

		const modalityArray = ['PT/CT', 'CT'];
		clinicalFormJson.name = `Clinical Form ${randomNum}`;
		clinicalFormJson.organizationId = managingOrgId;
		clinicalFormJson.organizationName = managingOrgName;
		clinicalFormJson.createdBy.id = internalUserId;
		clinicalFormJson.createdBy.display = userName;
		clinicalFormJson.eligibility.modality = modalityArray;
		clinicalFormJson.id = uuidv4();
		if (
			clinicalFormJson.formTemplate &&
			clinicalFormJson.formTemplate.content &&
			clinicalFormJson.formTemplate.content[0] &&
			clinicalFormJson.formTemplate.content[0][0]
		) {
			clinicalFormJson.formTemplate.content[0][0].unique_id = uuidv4();
		}

		// Write input to output file for traceability
		const outputDir = path.resolve(__dirname, './output');
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir);
		}
		fs.writeFileSync(path.join(outputDir, 'clinicalForm_input.json'), JSON.stringify(clinicalFormJson, null, 2));

		const res = await this.postResource('form', clinicalFormJson, tokenObj);
		console.log(`Clinical Form has been created successfully. Id:${res?.id}, Name:${res?.name}`);
		return { id: res?.id, name: res?.name };
	}

	async postRegistrationForm() {
		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		const userName = playwrightConfig.userName || playwrightConfig.managingOrg.userName || '';
		let tokenObj = {};
		let randomNum = this.generate7DigitRandNum();
		let internalUserId = '';

		// Get internal user ID using UserQuery
		const userRows = await UserQuery.getInternalUserID({ UserName: userName });
		internalUserId = userRows[0]?.InternalUserID || '';

		tokenObj = await this.getTokenAndSessionId();

		const dirPath = path.resolve(__dirname, './organization');
		const filePath = path.join(dirPath, 'postRegistrationForm.json');
		const registrationFormJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

		registrationFormJson.name = `Patient Registration Form ${randomNum}`;
		registrationFormJson.organizationId = managingOrgId;
		registrationFormJson.organizationName = managingOrgName;
		registrationFormJson.createdBy.id = internalUserId;
		registrationFormJson.createdBy.display = userName;
		registrationFormJson.id = uuidv4();
		if (
			registrationFormJson.formTemplate &&
			registrationFormJson.formTemplate.content &&
			registrationFormJson.formTemplate.content[0] &&
			registrationFormJson.formTemplate.content[0][0]
		) {
			registrationFormJson.formTemplate.content[0][0].unique_id = uuidv4();
		}

		// Write input to output file for traceability
		const outputDir = path.resolve(__dirname, './output');
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir);
		}
		fs.writeFileSync(
			path.join(outputDir, 'registrationForm_input.json'),
			JSON.stringify(registrationFormJson, null, 2)
		);

		const res = await this.postResource('form', registrationFormJson, tokenObj);
		console.log(`Registration Form has been created successfully. Id:${res?.id}, Name:${res?.name}`);
		return { id: res?.id, name: res?.name };
	}

	/**
	 * Cleanup patient by removing the test user's email from telecom array
	 * @param {string} patientId - The patient ID to cleanup
	 * @param {Object} tokenObj - Token object containing accessToken and sessionId
	 */
	async cleanupPatient(patientId, tokenObj) {
		try {
			const patientRes = await this.getResourceById('patient', patientId, tokenObj);

			if (patientRes) {
				const emailToRemove = playwrightConfig.userName;
				const telecomArray = patientRes.telecom;

				// Filter out the telecom entry with the target email
				const updatedTelecom = telecomArray.filter(entry => entry.value !== emailToRemove);

				// Reassign the filtered telecom array back to the patient object
				patientRes.telecom = updatedTelecom;

				// Perform the PUT operation to update the patient
				const response = await this.putResource('patient', patientRes.id, patientRes);
				console.log(`Updated telecom array for patient ID ${patientId}:`, response);
				return response;
			} else {
				console.log(`Patient with ID ${patientId} not found`);
				return null;
			}
		} catch (error) {
			console.error(`Error cleaning up patient ${patientId}:`, error);
			throw error;
		}
	}
}

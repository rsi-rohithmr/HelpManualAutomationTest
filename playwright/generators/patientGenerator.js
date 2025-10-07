const { request } = require('@playwright/test');
import faker from 'community-faker';
import * as playwrightConfig from 'playwright.config';
import { patientDO } from '../dataObjects/patientDO';
import { postStudyNGetToken } from '../APIutils/postStudyNGetToken';
import { fhirEndpoints } from '@rs-core/fhir';
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { generateTestEmail } from 'cypress/support/testUtils';

class PatientGenerator {
	managingOrg = {
		id: playwrightConfig.managingOrg.organizationId,
		reference: `Organization/${playwrightConfig.managingOrg.organizationId}`,
		display: playwrightConfig?.managingOrg?.organizationName?.toUpperCase(),
	};

	maritalStatuses = [
		{ code: 'M', display: 'MARRIED' },
		{ code: 'S', display: 'NEVER MARRIED' },
		{ code: 'UNK', display: 'UNKNOWN' },
	];

	confidentialites = [
		{ code: 'T', display: 'TEMPORARY', id: '1948' },
		{ code: 'M', display: 'MODERATE', id: '1947' },
		{ code: 'N', display: 'NORMAL', id: '1949' },
	];

	ethnicities = [
		{ code: '2155-0', display: 'Central American' },
		{ code: '2148-5', display: 'Mexican' },
		{ code: '2178-2', display: 'Latin American' },
	];

	languages = [
		{ code: 'VIE', display: 'VIETNAMESE', id: '13756' },
		{ code: 'ENG', display: 'ENGLISH', id: '13419' },
		{ code: 'FRA', display: 'FRENCH', id: '13435' },
		{ code: 'JPN', display: 'JAPANESE', id: '13498' },
	];

	races = [
		{ code: '2028-9', display: 'ASIAN' },
		{ code: '2106-3', display: 'WHITE' },
		{ code: 'ASKU', display: 'ASKED BUT NO ANSWER' },
	];

	allergyCodes = [
		{ code: '99972000', display: 'BIOCOM' },
		{ code: '99991000', display: 'BIO-TAL' },
		{ code: '99992007', display: 'BIOTIN 100' },
		{ code: '99993002', display: 'BIOVAC' },
	];

	coverageStatusCodes = [
		{ code: 'ACT', display: 'ACTIVE' },
		{ code: 'IAC', display: 'INACTIVE' },
		{ code: 'UNK', display: 'UNKNOWN' },
	];

	getRandomArrayItem(items) {
		return items[Math.floor(Math.random() * items.length)];
	}

	/**
	 * Generate dynamic patient data that can be used as expected results for patient tests, and creating a patient bundle payload
	 * @returns generalInfo, guarantorInfo, contactInfo, emergencyContacts, address objects;
	 * 			patientNotes string;
	 * 			coverageArr and allergyArr arrays
	 */
	generateDynamicPatientData() {
		const utilFuncs = new postStudyNGetToken();
		const randomNum = utilFuncs.generate7DigitRandNum();
		const patientSSN = utilFuncs.generate9DigitRandNum();
		const gender = this.getRandomArrayItem(['male', 'female', 'unknown', 'other']);

		const generalInfo = { ...patientDO.generalInfo };
		const guarantorInfo = { ...patientDO.guarantor };
		const contactInfo = { ...patientDO.contactInfo };
		const emergencyContacts = { ...patientDO.emergencyContacts };
		const address = { ...patientDO.address };
		let patientNotes = patientDO.patientNotes;
		const coverageArr = [...patientDO.coverages];
		const allergyArr = [...patientDO.allergies];

		// General Information
		generalInfo['Family Name'] = `${faker.name.lastName(gender).toUpperCase()}${randomNum}E2E`; // add number to make patient name more unique that is neccessary for some tests such as patient link and merege, ...
		generalInfo['Given Names'] = faker.name.firstName(gender).toUpperCase();
		generalInfo.Prefix = this.getRandomArrayItem(['DR', 'MR', 'MRS', 'MS.']);
		generalInfo.Suffix = this.getRandomArrayItem(['JR', 'SR', 'PHD', 'MD']);
		generalInfo.SSN = patientSSN;
		generalInfo['Patient ID'] = `PID${randomNum}`;
		generalInfo["Driver's License #"] = `DL${randomNum}`;
		generalInfo['Birth Date'] = faker.date.past().toISOString().split('T')[0];
		generalInfo.Gender = gender.toUpperCase();
		generalInfo['Birth Sex'] = gender.toUpperCase();
		generalInfo['Managing Organization'] = this.managingOrg.display;
		// We don't set Assigning Authority (issuer extension) when posting a patient
		// We generate value for Assigning Authority this way, so we can test value of this field for the patient created when running the tests on pipeline
		// Assigning Authority name in automation tests is defined in register_managing_org.yml
		generalInfo['Assigning Authority'] = `ISSUER - ${this.managingOrg.display}`.toUpperCase();
		generalInfo["Mother's Family Name"] = faker.name.lastName('female').toUpperCase();
		generalInfo["Mother's Given Name"] = faker.name.firstName('female').toUpperCase();
		generalInfo["Father's Family Name"] = faker.name.lastName('male').toUpperCase();
		generalInfo["Father's Given Name"] = faker.name.firstName('male').toUpperCase();
		generalInfo['Marital Status'] = this.getRandomArrayItem([
			this.maritalStatuses[0].display,
			this.maritalStatuses[1].display,
			this.maritalStatuses[2].display,
		]);
		generalInfo.Confidentiality = this.getRandomArrayItem([
			this.confidentialites[0].display,
			this.confidentialites[1].display,
			this.confidentialites[2].display,
		]);
		generalInfo.Ethnicity = this.getRandomArrayItem([
			this.ethnicities[0].display.toUpperCase(),
			this.ethnicities[1].display.toUpperCase(),
			this.ethnicities[2].display.toUpperCase(),
		]);
		const language1 = this.getRandomArrayItem([this.languages[0].display, this.languages[1].display]);
		const language2 = this.getRandomArrayItem([this.languages[2].display, this.languages[3].display]);
		generalInfo.Language = `${language1} | ${language2}`;
		generalInfo.Race = this.getRandomArrayItem([
			this.races[0].display,
			this.races[1].display,
			this.races[2].display,
		]);

		// Guarantor
		// TODO: TBD

		// Contact Information
		contactInfo.Email = generateTestEmail();
		contactInfo.Phone = faker.phone.phoneNumber('+12268685###');

		// Address
		address['Address Line'] = faker.address.streetAddress();
		address.City = faker.address.city();
		address['State/Province'] = faker.address.state();
		address['ZIP/Postal Code'] = faker.address.zipCode();
		address.Country = faker.address.country();

		// Emergency Contacts
		const ecfirstName = faker.name.firstName(gender).toUpperCase();
		const eclastName = faker.name.lastName(gender).toUpperCase();
		emergencyContacts.Name = `${eclastName} ${ecfirstName}`; // In the app, the name is '<last name> <first name>'. Not sure if this is a bug or as expected
		emergencyContacts.Email = generateTestEmail();
		emergencyContacts.Phone = faker.phone.phoneNumber('+12268685###');

		// Patient Notes
		patientNotes = faker.lorem.lines(1);

		// Coverage
		coverageArr[0]['Payer Name'] = `PAYER${randomNum}`;
		coverageArr[0]['Payer ID'] = `PAYERID${randomNum}`;
		coverageArr[0]['Group Number'] = `GroupNo${randomNum}`;
		coverageArr[0]['Member ID'] = `SUBID${randomNum}`;
		coverageArr[0]['Coverage Status'] = this.getRandomArrayItem(this.coverageStatusCodes);

		// Alerts
		// The bundle request does not support adding alerts along with patient
		// We have tests for Alerts that add data from GUI. So only add this section if needed

		// Allergy
		allergyArr[0]['Offending Agent'] = this.getRandomArrayItem([
			this.allergyCodes[0].display,
			this.allergyCodes[1].display,
			this.allergyCodes[2].display,
			this.allergyCodes[3].display,
		]);
		allergyArr[0]['Offending Agent Drug Code'] = this.allergyCodes.filter(
			item => item.display === allergyArr[0]['Offending Agent']
		)[0].code;
		allergyArr[0]['Reaction Type'] = 'Low';
		allergyArr[0].Severity = 'Mild';
		allergyArr[0]['React Description'] = faker.lorem.lines(1);
		allergyArr[0].Note = faker.lorem.lines(1);

		return {
			generalInfo,
			guarantorInfo,
			contactInfo,
			emergencyContacts,
			address,
			patientNotes,
			coverageArr,
			allergyArr,
		};
	}

	/**
	 * Generate a patient bundle payload with dynamic patient data that can be used for posting a patient and related data
	 * @returns generalInfo, guarantorInfo, contactInfo, emergencyContacts, address objects;
	 * 			patientNotes string;
	 * 			coverageArr and allergyArr arrays, and
	 * 			a bundle patientPayload
	 */
	generatePatientBundlePayload() {
		// Update patientJson with necessary values for posting a patient and testing patientInfo
		// Patient resource - General Information
		const patientPayload = JSON.parse(JSON.stringify(require('../jsonData/postPatientV2.json')));

		const { generalInfo, contactInfo, emergencyContacts, address, patientNotes, coverageArr, allergyArr } =
			this.generateDynamicPatientData();

		patientPayload.entry[0].resource.name.text = `${generalInfo['Given Names']}^${generalInfo['Family Name']}`;
		patientPayload.entry[0].resource.name.family = generalInfo['Family Name'];
		patientPayload.entry[0].resource.name.given[0] = generalInfo['Given Names'];
		patientPayload.entry[0].resource.name.prefix[0] = generalInfo.Prefix;
		patientPayload.entry[0].resource.name.suffix[0] = generalInfo.Suffix;
		patientPayload.entry[0].resource.identifier[0].value = generalInfo.SSN;
		patientPayload.entry[0].resource.identifier[2].value = generalInfo['Patient ID'];
		patientPayload.entry[0].resource.identifier[1].value = generalInfo["Driver's License #"];
		patientPayload.entry[0].resource.birthDate = generalInfo['Birth Date'];
		patientPayload.entry[0].resource.gender = generalInfo.Gender;
		patientPayload.entry[0].resource.extension[6].valueCode = generalInfo['Birth Sex'];
		patientPayload.entry[0].resource.managingOrganization = { ...this.managingOrg };
		patientPayload.entry[0].resource.extension[9].valueHumanName.text = `${generalInfo["Mother's Family Name"]}^${generalInfo["Mother's Given Name"]}`;
		patientPayload.entry[0].resource.extension[9].valueHumanName.family = generalInfo["Mother's Family Name"];
		patientPayload.entry[0].resource.extension[9].valueHumanName.given[0] = generalInfo["Mother's Given Name"];
		patientPayload.entry[0].resource.extension[10].valueHumanName.text = `${generalInfo["Father's Family Name"]}^${generalInfo["Father's Given Name"]}`;
		patientPayload.entry[0].resource.extension[10].valueHumanName.family = generalInfo["Father's Family Name"];
		patientPayload.entry[0].resource.extension[10].valueHumanName.given[0] = generalInfo["Father's Given Name"];
		patientPayload.entry[0].resource.maritalStatus.coding[0].display = generalInfo['Marital Status'];

		patientPayload.entry[0].resource.maritalStatus.coding[0].code = this.maritalStatuses.filter(
			item => item.display === generalInfo['Marital Status']
		)[0]?.code;
		const selectedConfidentiality = this.confidentialites.filter(
			item => item.display === generalInfo.Confidentiality
		)[0];

		patientPayload.entry[0].resource.meta.security[0].id = selectedConfidentiality.id;
		patientPayload.entry[0].resource.meta.security[0].code = selectedConfidentiality.code;
		patientPayload.entry[0].resource.meta.security[0].display = selectedConfidentiality.display.toLowerCase();

		const selectedEthnicity = this.ethnicities.filter(
			item => item.display.toUpperCase() === generalInfo.Ethnicity
		)[0];
		patientPayload.entry[0].resource.extension[8].extension[0].valueCoding.display = selectedEthnicity.display;
		patientPayload.entry[0].resource.extension[8].extension[0].valueCoding.code = selectedEthnicity.code;

		const selectedLanguages = generalInfo.Language.split(' | ');
		const selectedLanguage1 = this.languages.filter(item => item.display === selectedLanguages[0])[0];
		const selectedLanguage2 = this.languages.filter(item => item.display === selectedLanguages[1])[0];
		patientPayload.entry[0].resource.communication[0].language.coding[0].id = selectedLanguage1.id;
		patientPayload.entry[0].resource.communication[0].language.coding[0].code = selectedLanguage1.code;
		patientPayload.entry[0].resource.communication[0].language.coding[0].display = selectedLanguage1.display;
		patientPayload.entry[0].resource.communication[0].language.coding[1].id = selectedLanguage2.id;
		patientPayload.entry[0].resource.communication[0].language.coding[1].code = selectedLanguage2.code;
		patientPayload.entry[0].resource.communication[0].language.coding[1].display = selectedLanguage2.display;

		const selectedRace = this.races.filter(item => item.display === generalInfo.Race)[0];
		patientPayload.entry[0].resource.extension[7].extension[0].valueCoding.code = selectedRace.code;
		patientPayload.entry[0].resource.extension[7].extension[0].valueCoding.display = selectedRace.display;

		// Patient resource - Contact Information
		patientPayload.entry[0].resource.telecom[0].value = contactInfo.Phone;
		patientPayload.entry[0].resource.telecom[1].value = contactInfo.Email;

		// Patient resource - Address
		patientPayload.entry[0].resource.address[0].line[0] = address['Address Line'];
		patientPayload.entry[0].resource.address[0].city = address.City;
		patientPayload.entry[0].resource.address[0].state = address['State/Province'];
		patientPayload.entry[0].resource.address[0].postalCode = address['ZIP/Postal Code'];
		patientPayload.entry[0].resource.address[0].country = address.Country;

		// Patient resource - Emergency Contacts
		const nameParts = emergencyContacts.Name.split(' ');
		patientPayload.entry[0].resource.contact[0].name.text = `${nameParts[0]}^${nameParts[1]}`;
		patientPayload.entry[0].resource.contact[0].name.family = nameParts[0];
		patientPayload.entry[0].resource.contact[0].name.given[0] = nameParts[1];
		patientPayload.entry[0].resource.contact[0].telecom[0].value = emergencyContacts.Phone;
		patientPayload.entry[0].resource.contact[0].telecom[1].value = emergencyContacts.Email;

		// Patient resource - Patient Notes
		patientPayload.entry[0].resource.extension[5].extension[0].extension[1].valueString = patientNotes;

		// Payer resource (organization)
		patientPayload.entry[1].resource.name = coverageArr[0]['Payer Name'];
		patientPayload.entry[1].resource.identifier[0].value = coverageArr[0]['Payer ID'];
		patientPayload.entry[1].resource.extension[1].valueString = coverageArr[0]['Payer ID'];
		patientPayload.entry[1].resource.partOf = { ...this.managingOrg };

		// Coverage resource
		patientPayload.entry[2].resource.subscriberId = coverageArr[0]['Member ID'];
		patientPayload.entry[2].resource.class[0].value = coverageArr[0]['Group Number'];
		patientPayload.entry[2].resource.extension[1].valueCoding = coverageArr[0]['Coverage Status'];

		// TODO: UPDATE MORE FOR TESTING PATIENT COVERAGE

		// Alergy resource
		patientPayload.entry[3].resource.criticality = allergyArr[0]['Reaction Type'].toLowerCase();
		patientPayload.entry[3].resource.code.coding[0].code = allergyArr[0]['Offending Agent Drug Code'];
		patientPayload.entry[3].resource.code.coding[0].display = allergyArr[0]['Offending Agent'];
		patientPayload.entry[3].resource.note[0].text = allergyArr[0].Note;
		patientPayload.entry[3].resource.reaction[0].severity = allergyArr[0].Severity.toLowerCase();
		patientPayload.entry[3].resource.reaction[0].description = allergyArr[0]['React Description'];

		return {
			generalInfo,
			contactInfo,
			emergencyContacts,
			address,
			patientNotes,
			coverageArr,
			allergyArr,
			patientPayload,
		};
	}

	getPatientInformationDetailsFromInputJson(patientInputJson, guarantorInputJson) {
		if (!patientInputJson || patientInputJson.resourceType !== 'Patient') {
			console.warn('Invalid JSON Structure: Not a Patient resource.');
			return {};
		}

		let generalInfo = { ...patientDO.generalInfo };
		let telecom = { ...patientDO.telecom };
		let emergencyContacts = { ...patientDO.emergencyContacts };
		let address = { ...patientDO.address };
		let guarantor = { ...patientDO.guarantor };

		try {
			// Utility function to format date as MM/DD/YYYY
			const formatDate = dateStr => {
				if (!dateStr) return 'N/A';
				const [year, month, day] = dateStr.split('-');
				return `${month}/${day}/${year}`;
			};

			// Utility function to format SSN
			const formatSSN = ssn => {
				if (!ssn || ssn.length !== 9) return 'N/A';
				return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
			};

			// General Info
			const name = patientInputJson.name?.[0];
			generalInfo['Family Name'] = name?.text?.toUpperCase() || 'N/A';
			generalInfo['Given Names'] = name?.given?.map(g => g.toUpperCase()).join(' ') || 'N/A';
			generalInfo.Prefix = name?.prefix?.[0]?.toUpperCase() || 'N/A';
			generalInfo.Suffix = name?.suffix?.[0]?.toUpperCase() || 'N/A';
			generalInfo.SSN = formatSSN(patientInputJson.identifier?.[1]?.value || '');
			generalInfo["Driver's License #"] = patientInputJson.identifier?.[2]?.value || 'N/A';
			generalInfo['Birth Date'] = formatDate(patientInputJson.birthDate);
			generalInfo['Deceased Date'] = formatDate(patientInputJson.deceasedDateTime);
			generalInfo.Gender = patientInputJson.gender?.toUpperCase() || 'N/A';
			generalInfo['Birth Sex'] =
				patientInputJson.extension?.find(ext => ext.url.includes('birthsex'))?.valueCode?.toUpperCase() ||
				'N/A';
			generalInfo['Managing Organization'] = patientInputJson.managingOrganization?.display || 'N/A';
			generalInfo['Marital Status'] = patientInputJson.maritalStatus?.coding?.[0]?.display || 'N/A';
			generalInfo.Race =
				patientInputJson.extension
					?.find(ext => ext.url.includes('race'))
					?.extension?.map(e => e.valueCoding?.display?.toUpperCase())
					.join(' | ') || 'N/A';
			generalInfo.Ethnicity =
				patientInputJson.extension
					?.find(ext => ext.url.includes('ethnicity'))
					?.extension?.map(e => e.valueCoding?.display?.toUpperCase())
					.join(' | ') || 'N/A';
			generalInfo.Language =
				patientInputJson.communication?.[0]?.language?.coding
					?.map(coding => coding.display?.toUpperCase())
					.join(' | ') || 'N/A';
			generalInfo.Confidentiality =
				patientInputJson.extension
					?.find(ext => ext.url.includes('confidentiality'))
					?.extension?.map(e => e.valueCoding?.display?.toUpperCase())
					.join(' | ') || 'N/A';

			// Extracting Mother's and Father's Names
			const motherNameExt = patientInputJson.extension?.find(ext =>
				ext.url.includes('patient-mothersMaidenName')
			);
			generalInfo["Mother's Family Name"] = motherNameExt?.valueHumanName?.text?.toUpperCase() || 'N/A';
			generalInfo["Mother's Given Name"] =
				motherNameExt?.valueHumanName?.given?.map(g => g.toUpperCase()).join(' ') || 'N/A';
			generalInfo["Father's Given Name"] = 'N/A';
			generalInfo["Father's Family Name"] = 'N/A';

			// Telecom
			telecom.Email = patientInputJson.telecom?.find(t => t.system === 'email')?.value || 'N/A';
			telecom.Phone = patientInputJson.telecom?.find(t => t.system === 'phone')?.value || 'N/A';

			// Emergency Contacts
			emergencyContacts.Name = patientInputJson.contact?.[0]?.name?.text?.toUpperCase().trimEnd() || 'N/A';
			emergencyContacts.Phone =
				patientInputJson.contact?.[0]?.telecom?.find(t => t.system === 'phone')?.value || 'N/A';
			emergencyContacts.Email =
				patientInputJson.contact?.[0]?.telecom?.find(t => t.system === 'email')?.value || 'N/A';

			// Address
			const addressObj = patientInputJson.address?.[0];
			address.Country = addressObj?.country?.toUpperCase() || 'N/A';
			address['State/Province'] = addressObj?.state?.toUpperCase() || 'N/A';
			address.City = addressObj?.city?.toUpperCase() || 'N/A';
			address['ZIP/Postal Code'] = addressObj?.postalCode || 'N/A';
			address['Address Line'] = addressObj?.line?.map(l => l.toUpperCase()).join(', ') || 'N/A';

			//Guarantor
			if (
				guarantorInputJson &&
				guarantorInputJson.resourceType === 'Bundle' &&
				guarantorInputJson.entry?.length
			) {
				const guarantorResource = guarantorInputJson.entry[0].resource;
				const guarantorData = guarantorResource?.guarantor?.[0]?.party;

				if (guarantorData) {
					// Extract name, removing prefixes/suffixes
					console.log('Guarantor Data:', guarantorData);
					guarantor.Name = guarantorData.display?.split('^^^')[0] || 'N/A';
				}
			}
		} catch (error) {
			console.error('Error parsing patient input JSON:', error);
		}

		return { generalInfo, telecom, emergencyContacts, address, guarantor };
	}

	async postPatient(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);

		try {
			const response = await apiRequest.postResource(fhirEndpoints.bundle, payload, 'Patient');
			return response;
		} catch (error) {
			console.error('patientGenerator - postPatient - Error in posting patient: ', error?.message);
			throw error; // Re-throw the error for the calling function to handle
		}
	}
}

export const patientGenerator = new PatientGenerator();

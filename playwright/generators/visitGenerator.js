import faker from 'community-faker';
import { fhirExtensionUrls } from '@rs-core/fhir';
export class VisitGenerator {
	generateVisit() {
		let visit = {};

		// Generate Visit Header Section
		visit.visitHeaderSection = {
			'Visit Number': faker.datatype.uuid(),
			'Patient Name': faker.name.fullName(),
			'Patient ID': faker.datatype.uuid(),
			'Visit Class': faker.helpers.arrayElement(['Inpatient', 'Outpatient', 'Emergency']),
			'Special Courtesy': faker.helpers.arrayElement(['None', 'VIP', 'Staff']),
		};

		// Generate Visit Details Section
		visit.visitDetailsSection = {
			'Visit Number': faker.datatype.uuid(),
			'Visit Date/Time': faker.date.recent().toISOString(),
			'Encounter Type': faker.helpers.arrayElement(['Initial', 'Follow-up', 'Emergency', 'Routine']),
			'Encounter Status': faker.helpers.arrayElement(['Scheduled', 'In Progress', 'Completed', 'Cancelled']),
			'Attending Physician/Nurse': faker.name.fullName(),
			'Location of Encounter': faker.helpers.arrayElement(['ER', 'Main Clinic', 'ICU', 'General Ward']),
			'Visit Reason/History': faker.lorem.sentence(),
			'Visit Class': visit.visitHeaderSection['Visit Class'],
			'Special Courtesy': visit.visitHeaderSection['Special Courtesy'],
		};

		// Generate Clinical Section
		visit.clinicalSection = {
			'Plan of care': faker.lorem.paragraph(),
			'Follow-Up Instructions': faker.lorem.sentences(2),
		};

		return visit;
	}

	generateMultipleVisits(count) {
		return Array(count)
			.fill(null)
			.map(() => this.generateVisit());
	}

	async getVisitDetailsFromInputJson(inputJson) {
		if (!inputJson?.entry?.length) {
			console.warn('Invalid JSON Structure: entry is missing.');
			return {};
		}

		const resource = inputJson.entry[0]?.resource;
		if (!resource) {
			console.warn('Invalid JSON Structure: resource is missing in entry[0].');
			return {};
		}

		let visit = {};
		console.log('resource:', resource);
		try {
			// Visit Header Section
			visit.visitHeaderSection = {
				'Visit Number': resource.id || '',
				'Visit Class': resource.class?.display || '',
				'Special Courtesy': resource.hospitalization?.specialCourtesy?.[0]?.coding?.[0]?.display || '',
			};

			// Visit Details Section
			visit.visitDetailsSection = {
				'Date/Time of Visit': resource.period?.start || 'N/A',
				'Encounter Type': resource.type?.[0]?.text || 'N/A',
				'Encounter Status': resource.status || 'N/A',
				'Attending Physician/Nurse': resource.participant?.[0]?.individual?.display || 'N/A',
				'Location of Encounter': resource.location?.[0]?.location?.display || 'N/A',
				'Visit Reason/History': resource.reasonCode?.[0]?.text || 'N/A',
				'Visit Class': visit.visitHeaderSection['Visit Class'] || 'N/A',
				'Special Courtesy': visit.visitHeaderSection['Special Courtesy'] || 'N/A',
			};

			// Clinical Section
			visit.clinicalSection = {
				'Plan of care': resource.carePlan?.[0]?.text?.div || '',
				'Follow-Up Instructions': resource.followUp?.[0]?.text || '',
			};

			// Patient Vitals Section
			/* visit.patientVitalsSection = {
				'Blood Pressure': resource.vitals?.bloodPressure || '',
				'Heart Rate': resource.vitals?.heartRate || '',
				'Respiratory Rate': resource.vitals?.respiratoryRate || '',
				Temperature: resource.vitals?.temperature || '',
			}; */
		} catch (error) {
			console.error('Error parsing visit input JSON:', error);
		}
		console.log('visit:', visit);
		return visit;
	}

	getAccidentNotes = resource =>
		resource.extension?.find(item => item.url === fhirExtensionUrls.encounter.accident) || [];

	async getVisitDetailsFromInputJsonWithoutEntryResource(inputJson) {
		const resource = inputJson;
		let visit = {};
		console.log('resource:', resource);
		try {
			// Visit Header Section
			visit.visitHeaderSection = {
				'Visit Number': resource.id || '',
				'Visit Class': resource.class?.display || '',
				'Special Courtesy': resource.hospitalization?.specialCourtesy?.[0]?.coding?.[0]?.display || '',
			};

			// Visit Details Section
			visit.visitDetailsSection = {
				'Visit Date/Time': resource.period?.start || '',
				'Encounter Type': resource.type?.[0]?.coding?.[0].display || '',
				'Encounter Status': resource.status || '',
				'Attending Physician/Nurse': resource.participant?.[0]?.individual?.display || '',
				'Location of Encounter': resource.location?.[0]?.location?.display || '',
				'Visit Reason/History': resource.reasonCode?.[0]?.text || '',
				'Visit Class': visit.visitHeaderSection['Visit Class'],
				'Special Courtesy': visit.visitHeaderSection['Special Courtesy'],
			};

			// Clinical Section
			visit.clinicalSection = {
				'Plan of care': resource.carePlan?.[0]?.text?.div || '',
				'Follow-Up Instructions': resource.followUp?.[0]?.text || '',
			};

			const accidentNotes = this.getAccidentNotes(resource);
			if (accidentNotes?.extension?.length > 0) {
				visit.accidentNotes = {
					sectionHeader: 'Accident Notes',
					count: accidentNotes.extension.length,
					...accidentNotes.extension.reduce(
						(acc, note, index) => ({
							...acc,
							[`note${index}Header`]: 'Accident Notes',
							[`note${index}Content`]: note.valueString || '',
							[`note${index}CreatedBy`]:
								note.extension?.find(ext => ext.url.includes('created-by'))?.valueString || '',
							[`note${index}CreatedDate`]:
								note.extension?.find(ext => ext.url.includes('created-date'))?.valueDateTime || '',
						}),
						{}
					),
				};
			}

			// Patient Vitals Section
			/* visit.patientVitalsSection = {
				'Blood Pressure': resource.vitals?.bloodPressure || '',
				'Heart Rate': resource.vitals?.heartRate || '',
				'Respiratory Rate': resource.vitals?.respiratoryRate || '',
				Temperature: resource.vitals?.temperature || '',
			}; */
		} catch (error) {
			console.error('Error parsing visit input JSON:', error);
		}
		console.log('visit:', visit);
		return visit;
	}
}

export const visitGenerator = new VisitGenerator();

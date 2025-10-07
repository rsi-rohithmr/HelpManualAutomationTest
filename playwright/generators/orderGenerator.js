const { request } = require('@playwright/test');
import cloneDeep from 'lodash/cloneDeep';
import * as playwrightConfig from 'playwright.config';
import { APIRequests } from 'playwright/APIutils/APIRequests';
import { fhirEndpoints } from '@rs-core/fhir';
import { parseName } from '@rs-core/fhir/resource/columnMapping/utils/getUserFullName';
import { orderDO } from 'playwright/dataObjects/orderDO';
import { studyDO } from 'playwright/dataObjects/studyDO';
import { dateTimeHelper } from 'playwright/POM/utils/dateTimeHelper';

class OrderGenerator {
	/**
	 * Generates a payload for posting an order.
	 *
	 * @param {{ patientId: string, patientName: string }} patientInfo
	 * @param {{ studyType: string, description: string }} studyTypeInfo
	 * @param {{ deptOrgId: string, deptOrgName: string }} departmentInfo
	 * @returns an order payload object.
	 */
	generateOrderPayload(patientInfo, studyTypeInfo, departmentInfo) {
		if (!patientInfo?.patientId || !studyTypeInfo?.studyType) {
			return {};
		}

		const managingOrgName = playwrightConfig.managingOrg.organizationName;
		const managingOrgId = playwrightConfig.managingOrg.organizationId;
		const payload = JSON.parse(JSON.stringify(require('../jsonData/postOrder.json')));

		payload.entry[1].resource.code.coding[0].code = studyTypeInfo.studyType;
		payload.entry[1].resource.code.coding[0].display = studyTypeInfo?.description;
		payload.entry[1].resource.code.coding[0].extension[0].valueDateTime = dateTimeHelper.formatDateTime(
			new Date(),
			'YYYY-MM-DDTHH:mm:ss'
		); // Study Date/Time

		if (departmentInfo?.deptOrgName && departmentInfo.deptOrgId) {
			payload.entry[1].resource.code.coding[0].extension[2].valueReference.display = departmentInfo.deptOrgName;
			payload.entry[1].resource.code.coding[0].extension[2].valueReference.id = departmentInfo.deptOrgId;
			payload.entry[1].resource.code.coding[0].extension[2].valueReference.reference = `Organization/${departmentInfo.deptOrgId}`;
		}

		// Set patient info to encounter and service request
		payload.entry[0].resource.subject.id = payload.entry[1].resource.subject.id = patientInfo?.patientId;
		payload.entry[0].resource.subject.reference =
			payload.entry[1].resource.subject.reference = `patient/${patientInfo?.patientId}`;
		payload.entry[0].resource.subject.display = payload.entry[1].resource.subject.display =
			patientInfo?.patientName;
		payload.entry[0].resource.identifier[0].assigner.id = managingOrgId;
		payload.entry[0].resource.identifier[0].assigner.reference = `organization/${managingOrgId}`;
		payload.entry[0].resource.identifier[0].assigner.display = managingOrgName;
		payload.entry[0].resource.serviceProvider.id = managingOrgId;
		payload.entry[0].resource.serviceProvider.reference = `organization/${managingOrgId}`;
		payload.entry[0].resource.serviceProvider.display = managingOrgName;
		payload.entry[1].resource.requester.extension[0].valueReference.id = managingOrgId;
		payload.entry[1].resource.requester.extension[0].valueReference.reference = `organization/${managingOrgId}`;
		payload.entry[1].resource.requester.extension[0].valueReference.display = managingOrgName;
		payload.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.id =
			managingOrgId;
		payload.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.reference = `organization/${managingOrgId}`;
		payload.entry[1].resource.extension[7].extension[0].valueReference.extension[0].valueReference.display =
			managingOrgName;

		return payload;
	}

	async postOrder(payload) {
		const context = await request.newContext();
		const apiRequest = new APIRequests(context);

		try {
			const response = await apiRequest.postResource(fhirEndpoints.bundle, payload, 'Order');
			return response;
		} catch (error) {
			console.error('orderGenerator - postOrder - Error in posting order: ', error?.message);
			throw error; // Re-throw the error for the calling function to handle
		}
	}

	extractStudyDetailsFromOrderInfo(orderPayload, orderResponse, studyTypePayload) {
		const studyInfo = cloneDeep(studyDO);

		if (Array.isArray(orderResponse?.entry) && orderResponse.entry.length > 1) {
			studyInfo.general['Study Status'] =
				orderResponse.entry[1]?.resource?.code?.coding[0]?.extension[1]?.valueCode;
			studyInfo.general['Requested Procedure ID'] = orderResponse.entry[1]?.resource?.code?.coding[0]?.id;
			studyInfo.general['Imaging Organization'] =
				orderResponse.entry[1]?.resource?.code?.coding[0]?.extension[4]?.valueReference?.display;
			studyInfo.general.Department =
				orderResponse.entry[1]?.resource?.code?.coding[0]?.extension[5]?.valueReference?.display;
		}

		if (Array.isArray(orderPayload?.entry) && orderPayload.entry.length > 1) {
			studyInfo.general['Study Date/Time'] = dateTimeHelper.formatDateTime(
				orderPayload.entry[1]?.resource?.code?.coding[0]?.extension[0]?.valueDateTime,
				'MM/DD/YYYY, h:mm A'
			);
			studyInfo.general['Study Set Code'] = orderPayload.entry[1]?.resource?.code?.coding[0]?.code;
			studyInfo.general['Study Description'] =
				orderPayload.entry[1]?.resource?.code?.coding[0]?.display?.toUpperCase();
			studyInfo.general.Modality =
				orderPayload.entry[1]?.resource?.code?.coding[0]?.extension[1]?.extension[0]?.valueCoding?.code;
			studyInfo.procedureCode['DX CODE 0'] = orderPayload.entry[1]?.resource?.reasonCode[0]?.coding[0]?.code;
			studyInfo.procedureCode['DX REASON 0'] = orderPayload.entry[1]?.resource?.reasonCode[0]?.coding[0]?.display;
			studyInfo.procedureCode['DX CODE 1'] = orderPayload.entry[1]?.resource?.reasonCode[1]?.coding[0]?.code;
			studyInfo.procedureCode['DX REASON 1'] = orderPayload.entry[1]?.resource?.reasonCode[1]?.coding[0]?.display;
		}

		studyInfo.clinical.scanDetails.Laterality = studyTypePayload?.laterality?.display;
		studyInfo.clinical.scanDetails['Body Part'] = studyTypePayload?.bodyPart[0]?.display;
		studyInfo.clinical.scanDetails['Duration (HH: MM)'] = `00:${studyTypePayload?.duration}`;

		studyInfo.procedureCode.count = studyTypePayload?.procedureCode?.length;
		studyInfo.procedureCode['PROCEDURE CODE'] = studyTypePayload?.procedureCode[0]?.coding[0]?.code;
		studyInfo.procedureCode.DESCRIPTION = studyTypePayload?.procedureCode[0]?.coding[0]?.display;

		return studyInfo;
	}

	generateOrderGeneralInfo() {
		let orderDetails = { ...orderDO.orderDO };
		orderDetails.Priority = 'CRITICAL';
		orderDetails['Filler Order Number'] = '111111';
		orderDetails['Placed Order Number'] = '222222';
		orderDetails['Referring Physician'] = 'SHARMA^AKHILESH';
		orderDetails['Referring Organization'] = 'RAMSOFT INTERNAL';
		orderDetails.Status = 'REJECTED';
		orderDetails['Requested Appointment Date/Time'] = '2022-06-08T00:26:00+00:00';
		orderDetails['Order priority'] = 'CRITICAL';
		orderDetails['Order Status'] = 'REJECTED';
		orderDetails['Consulting Physician'] = 'SHARMA^AKHILESH';

		return orderDetails;
	}
	parsedDate(date) {
		return typeof date === 'string' && !date.includes('+') && !date.includes('Z') ? `${date}+00:00` : date;
	}
	transFormNotes(notes) {
		return notes?.map(note => ({
			id: note?.id,
			text: note?.text || '',
			author: note?.authorReference?.display,
			authorId: note?.authorReference?.id,
			time: this.parsedDate(note?.time),
			isAddNew: false,
			authorReference: note?.authorReference,
		}));
	}

	getOrderDetailsFromInputJson(orderInputJson, patientName) {
		let orderDetails = {
			'Ordered Date': '',
			'Accession Number': '',
			'Requested Date': '',
			Priority: '',
			'Filler Order Number': '',
			'Placed Order Number': '',
			'Referring Physician': '',
			'Referring Organization': '',
			Status: '',
			'Requested Appointment Date/Time': '',
			'Order priority': '',
			'Order Status': '',
			'Consulting Physician': '',
		};

		orderDetails['Patient Name'] = patientName;
		orderDetails['Accession Number'] =
			orderInputJson.identifier.find(id => id.type.coding.some(coding => coding.code === 'ACSN'))?.value || 'N/A';
		orderDetails['Filler Order Number'] =
			orderInputJson.identifier.find(id => id.type.coding.some(coding => coding.code === 'FILL'))?.value || 'N/A';
		orderDetails['Placed Order Number'] =
			orderInputJson.identifier.find(id => id.type.coding.some(coding => coding.code === 'PLAC'))?.value || 'N/A';
		orderDetails['Ordered Date'] = dateTimeHelper.formatDateTime(orderInputJson.authoredOn);
		orderDetails['Requested Date'] = dateTimeHelper.formatDateTime(orderInputJson.occurrenceDateTime);
		orderDetails.Priority = orderInputJson.priority;
		orderDetails.Status = orderInputJson.status.toUpperCase();
		orderDetails['Requested Appointment Date/Time'] = dateTimeHelper.formatDateTime(
			orderInputJson.occurrenceDateTime
		);
		orderDetails['Order priority'] = orderInputJson.priority;
		orderDetails['Order Status'] = orderInputJson.status.toUpperCase();
		orderDetails['Referring Physician'] = parseName(orderInputJson.requester.display, false, 'DICOM') || 'N/A';
		orderDetails['Referring Organization'] =
			orderInputJson?.requester?.extension?.find(
				ext => ext.url === 'http://www.ramsoft.com/fhir/extension/organization'
			)?.valueReference?.display || 'N/A';
		orderDetails['Consulting Physician'] =
			parseName(
				orderInputJson?.extension
					?.find(ext => ext.url === 'http://www.ramsoft.com/fhir/StructureDefinition/consulting-physician')
					.extension.find(ext => ext.url === 'detailed')?.valueReference?.display,
				false,
				'DICOM'
			) || 'N/A';
		const orderNotes = this.transFormNotes(orderInputJson?.note);
		if (orderNotes?.extension?.length > 0) {
			orderDetails.orderNotes = {
				sectionHeader: 'Accident Notes',
				count: orderNotes.extension.length,
				...orderNotes.extension.reduce(
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

		return orderDetails;
	}
}

export const orderGenerator = new OrderGenerator();

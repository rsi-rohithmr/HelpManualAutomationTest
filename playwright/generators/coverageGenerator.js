import { coverageDO } from '../dataObjects/coverageDO';
import { fhirExtensionUrls } from '@worklist-2/core/src/fhir/extension/fhirExtensionUrls';
import moment from 'moment';
import {
	getExtensionValueString,
	getExtensionValueAttachment,
	getExtensionValueReference,
	getExtensionValueCoding,
} from '@worklist-2/core/src/fhir/resource/columnMapping/utils';

export class CoverageGenerator {
	/**
	 * @returns return range in the format of mm/dd/yyyy - mm/dd/yyyy
	 */
	formatDateRange(start, end) {
		const startDate = start ? moment(start).format('MM/DD/YYYY') : 'N/A';
		const endDate = end ? moment(end).format('MM/DD/YYYY') : 'N/A';
		return `${startDate} - ${endDate}`;
	}

	getPatientCoverageDetail(coverageData) {
		if (!coverageData || typeof coverageData !== 'object') {
			console.warn('Invalid coverage data: Expected an object.');
			return null;
		}
		try {
			// Initialize the coverage details objects
			let coverageCardInfo = { ...coverageDO.coverageCardInfo };
			let coverageDetailsLeftCardInfo = { ...coverageDO.coverageDetailsLeftCardInfo };
			let coverageDetailsTopCardInfo = { ...coverageDO.coverageDetailsTopCardInfo };
			let coverageDetailsRightCardInfo = { ...coverageDO.coverageDetailsRightCardInfo };

			// Populate coverageCardInfo
			coverageCardInfo['Payer Name'] = coverageData?.payor?.[0]?.display || 'N/A';
			coverageCardInfo['Payer ID'] =
				getExtensionValueString(coverageData?.payor?.[0], fhirExtensionUrls.coverage.payerID) || 'N/A';
			coverageCardInfo['Group Number'] = coverageData?.class?.[0]?.value?.toUpperCase() || 'N/A';
			coverageCardInfo['Member ID'] = coverageData?.subscriberId || 'N/A';
			coverageCardInfo['Eligibility Payer ID'] =
				getExtensionValueString(coverageData?.payor?.[0], fhirExtensionUrls.coverage.eligibilityPayerID) ||
				'N/A';
			coverageCardInfo['Phone Number'] = coverageData?.payor?.[0]?.businessPhoneNumber || 'N/A';

			// Populate coverageDetailsLeftCardInfo
			coverageDetailsLeftCardInfo['Payer Name'] = coverageCardInfo['Payer Name'];
			coverageDetailsLeftCardInfo['Employer Name'] = coverageData?.policyHolder?.display || 'N/A';
			coverageDetailsLeftCardInfo['Payer Type'] =
				getExtensionValueReference(
					coverageData,
					fhirExtensionUrls.coverage.payerType
				)?.display?.toUpperCase() || 'N/A';
			coverageDetailsLeftCardInfo['Group Number'] = coverageCardInfo['Group Number'];
			coverageDetailsLeftCardInfo['Coverage Status'] =
				getExtensionValueCoding(coverageData, fhirExtensionUrls.coverage.insuranceStatus)?.display || 'N/A';
			coverageDetailsLeftCardInfo['Employer Phone Number'] =
				getExtensionValueString(coverageData?.policyHolder, fhirExtensionUrls.coverage.employerPhoneNumber) ||
				'N/A';
			coverageDetailsLeftCardInfo['Member Relationship to Patient'] =
				coverageData?.relationship?.coding?.[0]?.display || 'N/A';
			coverageDetailsLeftCardInfo['Member Name'] =
				coverageData?.subscriber?.display?.replace(/[^a-zA-Z0-9 ]/g, ' ') || 'N/A';
			coverageDetailsLeftCardInfo['Member ID'] = coverageCardInfo['Member ID'];

			// Populate coverageDetailsTopCardInfo
			coverageDetailsTopCardInfo['Payer ID'] = coverageCardInfo['Payer ID'];
			coverageDetailsTopCardInfo['Effective from'] = this.formatDateRange(
				coverageData?.period?.start,
				coverageData?.period?.end
			);

			// Populate coverageDetailsRightCardInfo
			coverageDetailsRightCardInfo['Insurance Card'] = getExtensionValueAttachment(
				coverageData,
				fhirExtensionUrls.coverage.insuranceCard
			)
				? 'Yes'
				: 'NO PICTURE UPLOADED';
			coverageDetailsRightCardInfo['Coverage Card'] = coverageData?.coverageCard ? 'Yes' : 'NO PICTURE UPLOADED';

			// Return the populated objects
			return {
				coverageCardInfo,
				coverageDetailsLeftCardInfo,
				coverageDetailsTopCardInfo,
				coverageDetailsRightCardInfo,
			};
		} catch (error) {
			console.error('Error processing coverage data:', error);
			return null;
		}
	}
}

export const coverageGenerator = new CoverageGenerator();
